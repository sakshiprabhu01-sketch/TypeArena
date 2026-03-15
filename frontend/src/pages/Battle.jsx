import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import "../styles/battle.css";
import { socket } from "../socket/socket";

const wordList = [
  "time",
  "people",
  "world",
  "life",
  "day",
  "practice",
  "typing",
  "speed",
  "focus",
  "skill",
  "give",
  "fun",
  "which",
  "what",
  "know",
  "learn",
  "improve",
  "keyboard",
  "accuracy",
  "game",
  "the",
  "her",
  "because",
];

function generateText(wordCount = 80) {
  let result = [];
  for (let i = 0; i < wordCount; i++) {
    const index = Math.floor(Math.random() * wordList.length);
    result.push(wordList[index]);
  }
  return result.join(" ");
}

function Battle() {

  const hasCountedBattleRef = useRef(false);

  const [roomId, setRoomId] = useState("");
  const [role, setRole] = useState("");
  const [roomData, setRoomData] = useState(null);

  const [battleStarted, setBattleStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const [input, setInput] = useState("");

  const [myProgress, setMyProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [spans, setSpans] = useState([]);

  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [winner, setWinner] = useState(null);

  const [timeLeft, setTimeLeft] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);

  const { roomId: urlRoomId = "" } = useParams();

  const startCountdown = useCallback(function startCountdown(serverText) {

    let time = 3;

    setCountdown(time);

    const interval = setInterval(() => {

      time--;

      if (time > 0) {

        setCountdown(time);

      } else {

        setCountdown("GO!");

        setTimeout(() => {

          setCountdown(null);
          renderText(serverText);

        }, 800);

        clearInterval(interval);

      }

    }, 1000);

  }, []);

  useEffect(() => {

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("room-created", (id) => {
      setRoomId(id);
      setRole("host");
    });

    socket.on("room-update", (data) => {
      setRoomData(data);
    });

    socket.on("battle-start", (serverText) => {
      const battleText = serverText || generateText();
      hasCountedBattleRef.current = false;
      setBattleStarted(true);
      startCountdown(battleText);
    });

    socket.on("opponent-progress", (progress) => {
      setOpponentProgress(progress);
    });

    socket.on("opponent-finished", () => {
      if (!winner) setWinner("Opponent");
    });

    if (urlRoomId) {
      setRoomId(urlRoomId);
      setRole("guest");
      socket.emit("join-room", urlRoomId);
    }

    return () => {
      socket.off("connect");
      socket.off("room-created");
      socket.off("room-update");
      socket.off("battle-start");
      socket.off("opponent-progress");
      socket.off("opponent-finished");
    };

  }, [urlRoomId, winner, startCountdown]);



  useEffect(() => {

    if (!timerRunning) return;

    const timer = setInterval(() => {

      setTimeLeft((prev) => {

        if (prev <= 1) {

          clearInterval(timer);
          setTimerRunning(false);

          if (!winner) {
            setWinner("Time Up");
          }

          return 0;
        }

        return prev - 1;

      });

    }, 1000);

    return () => clearInterval(timer);

  }, [timerRunning, winner]);



  function createRoom() {
    socket.emit("create-room");
  }

  function ready() {
    socket.emit("ready", { roomId, role });
  }

  function startBattle() {
    socket.emit("start", roomId);
  }



  function renderText(text) {

    const container = document.getElementById("text-display");

    if (!container) return;

    container.innerHTML = "";

    const characters = text.split("");

    const newSpans = characters.map((char) => {

      const span = document.createElement("span");
      span.classList.add("char");
      span.innerText = char;
      container.appendChild(span);

      return span;

    });

    if (newSpans.length > 0) {
      newSpans[0].classList.add("active");
    }

    setSpans(newSpans);
    setCurrentIndex(0);

    if (!hasCountedBattleRef.current) {
      const currentCount = Number(localStorage.getItem("typearena.battlesPlayed") || "0");
      const safeCount = Number.isFinite(currentCount) && currentCount >= 0 ? Math.floor(currentCount) : 0;
      const nextCount = safeCount + 1;

      localStorage.setItem("typearena.battlesPlayed", String(nextCount));

      const storedProfile = localStorage.getItem("typearena.profile");
      if (storedProfile) {
        try {
          const parsedProfile = JSON.parse(storedProfile);
          const nextProfile = {
            ...parsedProfile,
            battlesPlayed: nextCount,
          };
          localStorage.setItem("typearena.profile", JSON.stringify(nextProfile));
        } catch {
          // Ignore invalid profile payload and keep counter as source of truth.
        }
      }

      hasCountedBattleRef.current = true;
    }

    setStartTime(Date.now());
    setTimeLeft(60);
    setTimerRunning(true);

  }



  function handleTyping(e) {

    if (!timerRunning) return;

    const value = e.target.value;
    setInput(value);

    if (!spans.length) return;

    const typedChar = value[currentIndex];
    const expectedChar = spans[currentIndex]?.innerText;

    if (!typedChar) return;

    spans[currentIndex].classList.remove("active");

    if (typedChar === expectedChar) {
      spans[currentIndex].classList.add("correct");
    } else {
      spans[currentIndex].classList.add("wrong");
    }

    const nextIndex = currentIndex + 1;

    if (spans[nextIndex]) {
      spans[nextIndex].classList.add("active");
    }

    setCurrentIndex(nextIndex);

    const progress = Math.floor((nextIndex / spans.length) * 100);

    setMyProgress(progress);

    socket.emit("progress", {
      roomId,
      progress
    });


    const timeElapsed = (Date.now() - startTime) / 1000;
    const wordsTyped = nextIndex / 5;

    const currentWpm = Math.round((wordsTyped / timeElapsed) * 60);

    setWpm(currentWpm);


    if (nextIndex === spans.length) {

      socket.emit("finish", {
        roomId,
        wpm: currentWpm
      });

      setWinner("You");
      setTimerRunning(false);

    }

  }



  const inviteLink = `${window.location.origin}/battle/${roomId}`;



  return (

    <div className={`battle-container ${roomId && !battleStarted ? "lobby-view" : ""}`}>

      <h1>TypeArena Battle</h1>

      {!roomId && (
        <button onClick={createRoom}>
          Generate Invite
        </button>
      )}


      {roomId && !battleStarted && (

        <div className="lobby">

          <div className="card">

            <h2>Battle Lobby</h2>

            <p><strong>Room ID:</strong> {roomId}</p>

            <p><strong>Invite Link:</strong></p>

            <input value={inviteLink} readOnly />

            <br/>

            <button
              className="copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                alert("Invite link copied!");
              }}
            >
              Copy Invite
            </button>

            <hr/>

            {roomData && (
              <>
                <p>Host: {roomData.hostReady ? "✅ Ready" : "❌ Not Ready"}</p>
                <p>Guest: {roomData.guestReady ? "✅ Ready" : "❌ Not Ready"}</p>
              </>
            )}

            <button className="ready-btn" onClick={ready}>Ready</button>

            {role === "host" && (
              <button
                className="start-btn"
                disabled={!roomData || !roomData.hostReady || !roomData.guestReady}
                onClick={startBattle}
              >
                Start Battle
              </button>
            )}

          </div>

        </div>

      )}



      {battleStarted && (

        <div className="race-area">

          <h2 className="timer">Time Left: {timeLeft}s</h2>

          {countdown && (
            <div className="countdown">{countdown}</div>
          )}

          <div id="text-display" className="text-display"></div>

          <input
            type="text"
            value={input}
            onChange={handleTyping}
            placeholder="Start typing..."
          />

          <h3>Your WPM: {wpm}</h3>

          {winner && (
            <h2 className="winner">
              {winner === "You"
                ? "🏆 You Win!"
                : winner === "Opponent"
                ? "😢 You Lose"
                : "⏰ Time Up"}
            </h2>
          )}

          <h3>You</h3>

          <div className="progress-bar">
            <div
              className="progress"
              style={{ width: `${myProgress}%` }}
            ></div>
          </div>

          <h3>Opponent</h3>

          <div className="progress-bar">
            <div
              className="progress opponent"
              style={{ width: `${opponentProgress}%` }}
            ></div>
          </div>

        </div>

      )}

    </div>

  );

}

export default Battle;