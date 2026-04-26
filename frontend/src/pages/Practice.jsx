import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import "../styles/practice.css";
import ThemeToggle from "../components/ThemeToggle";
import { auth } from "../firebase";
import { recordPracticeResult } from "../auth/authService";

const wordList = [
  "time","people","world","life","day","practice","typing","speed","focus",
  "skill","give","fun","which","what","know","learn","improve",
  "keyboard","accuracy","game","the","her","because",
];

function generateText(wordCount = 80) {
  let result = [];
  for (let i = 0; i < wordCount; i++) {
    const index = Math.floor(Math.random() * wordList.length);
    result.push(wordList[index]);
  }
  return result.join(" ");
}

export default function Practice() {
  const [text, setText] = useState("");
  const [time, setTime] = useState(60);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [user, setUser] = useState(null);

  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const inputRef = useRef(null);
  const spansRef = useRef([]);
  const indexRef = useRef(0);
  const timerRef = useRef(null);
  const resultSavedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const startPractice = () => {
    const newText = generateText();

    setText(newText);
    setStarted(true);
    setFinished(false);

    setCorrect(0);
    setMistakes(0);
    resultSavedRef.current = false;

    indexRef.current = 0;
    setTime(60);

    setTimeout(() => {
      spansRef.current = document.querySelectorAll(".char");
      if (spansRef.current.length > 0) {
        spansRef.current[0].classList.add("active");
      }
      inputRef.current.focus();
    }, 0);
  };

  const finishPractice = () => {
    setFinished(true);
    clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (!started) return;

    timerRef.current = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          finishPractice();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [started]);

  const handleInput = (e) => {
    if (!started || finished) return;

    const value = e.target.value;

    const currentChar = value[indexRef.current];
    const expectedChar = spansRef.current[indexRef.current].innerText;

    spansRef.current[indexRef.current].classList.remove("active");

    if (currentChar === expectedChar) {
      spansRef.current[indexRef.current].classList.add("correct");
      setCorrect((prev) => prev + 1);
    } else {
      spansRef.current[indexRef.current].classList.add("wrong");
      setMistakes((prev) => prev + 1);
    }

    indexRef.current++;

    if (indexRef.current < spansRef.current.length) {
      spansRef.current[indexRef.current].classList.add("active");
    } else {
      finishPractice();
    }
  };

  const totalTyped = correct + mistakes;

  const wpm = Math.floor(correct / 5);

  const accuracy =
    totalTyped === 0 ? 0 : Math.round((correct / totalTyped) * 100);

 
  useEffect(() => {
    if (!finished || !user || resultSavedRef.current) return;

    resultSavedRef.current = true;

    recordPracticeResult(user.uid, wpm, accuracy).catch((error) => {
      console.error("Unable to save practice result", error);
    });
  }, [finished, user, wpm, accuracy]);

  return (
    <div className="practice-page">
      <ThemeToggle />
      <h1 className="title">TypeArena Practice Mode</h1>

      {!finished && (
        <div className="practice-box">
          <div id="timer">{time}</div>

          <div id="text-display">
            {text.split("").map((char, index) => (
              <span key={index} className="char">
                {char}
              </span>
            ))}
          </div>

          <div className="input-row">
            <input
              ref={inputRef}
              id="input"
              type="text"
              disabled={!started}
              onChange={handleInput}
            />

            <button
              id="start"
              onClick={startPractice}
              disabled={started && !finished}
            >
              Start
            </button>
          </div>
        </div>
      )}

      {finished && (
        <div className="result">
          <h2>Result</h2>

          <p>WPM: {wpm}</p>
          <p>Accuracy: {accuracy}%</p>
          <p>Mistakes: {mistakes}</p>

          <button onClick={startPractice}>Restart</button>
        </div>
      )}
    </div>
  );
}