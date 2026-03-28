import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import "../styles/battle.css";
import { socket } from "../socket/socket";

function Battle() {
  const hasCountedBattleRef = useRef(false);

  const [roomId, setRoomId] = useState("");
  const [role, setRole] = useState("");
  const [roomData, setRoomData] = useState(null);

  const [battleStarted, setBattleStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const [input, setInput] = useState("");
  const [, setMyProgress] = useState(0);
  const [, setOpponentProgress] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [spans, setSpans] = useState([]);

  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [winner, setWinner] = useState(null);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalCharsTyped, setTotalCharsTyped] = useState(0);

  const [timeLeft, setTimeLeft] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);

  const { roomId: urlRoomId = "" } = useParams();

  // ----------------------
  // COUNTDOWN
  // ----------------------
  const startCountdown = useCallback((serverText) => {
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

  // ----------------------
  // SOCKET EVENTS
  // ----------------------
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
      // ✅ ONLY use server text
      const battleText = serverText;

      hasCountedBattleRef.current = false;
      setBattleStarted(true);
      startCountdown(battleText);
    });

    socket.on("opponent-progress", (progress) => {
      setOpponentProgress(progress);
    });

    socket.on("opponent-finished", () => {
      setWinner("Opponent");
      setTimerRunning(false);
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
  }, [startCountdown, urlRoomId]);

  // ----------------------
  // TIMER
  // ----------------------
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

  // ----------------------
  // SOCKET ACTIONS
  // ----------------------
  function createRoom() {
    socket.emit("create-room");
  }

  function ready() {
    socket.emit("ready", { roomId, role });
  }

  function startBattle() {
    socket.emit("start", roomId);
  }

  // ----------------------
  // RENDER TEXT
  // ----------------------
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
    setInput("");
    setWpm(0);
    setAccuracy(0);
    setCorrectChars(0);
    setTotalCharsTyped(0);
    setWinner(null);

    setStartTime(Date.now());
    setTimeLeft(60);
    setTimerRunning(true);
  }

  // ----------------------
  // TYPING
  // ----------------------
  function handleTyping(e) {
    if (!timerRunning) return;

    const value = e.target.value;
    setInput(value);

    if (!spans.length) return;

    const typedChar = value[currentIndex];
    const expectedChar = spans[currentIndex]?.innerText;

    if (!typedChar) return;

    spans[currentIndex].classList.remove("active");

    let isCorrect = false;
    if (typedChar === expectedChar) {
      spans[currentIndex].classList.add("correct");
      isCorrect = true;
    } else {
      spans[currentIndex].classList.add("wrong");
    }

    const nextIndex = currentIndex + 1;

    if (spans[nextIndex]) {
      spans[nextIndex].classList.add("active");
    }

    setCurrentIndex(nextIndex);

    // Update accuracy tracking
    const newCorrectChars = isCorrect ? correctChars + 1 : correctChars;
    const newTotalCharsTyped = totalCharsTyped + 1;
    const currentAccuracy = Math.round((newCorrectChars / newTotalCharsTyped) * 100);
    
    setCorrectChars(newCorrectChars);
    setTotalCharsTyped(newTotalCharsTyped);
    setAccuracy(currentAccuracy);

    const progress = Math.floor((nextIndex / spans.length) * 100);
    setMyProgress(progress);

    socket.emit("progress", { roomId, progress });

    const timeElapsed = (Date.now() - startTime) / 1000;
    const wordsTyped = nextIndex / 5;
    const currentWpm = Math.round((wordsTyped / timeElapsed) * 60);

    setWpm(currentWpm);

    if (nextIndex === spans.length) {
      socket.emit("finish", { roomId, wpm: currentWpm, accuracy: currentAccuracy });
      setWinner("You");
      setTimerRunning(false);
    }
  }

  const inviteLink = `${window.location.origin}/battle/${roomId}`;

  return (
    <div className={`battle-container ${roomId && !battleStarted ? "lobby-view" : ""}`}>

      <h1>TypeArena Battle</h1>

      {!roomId && (
        <button onClick={createRoom}>Generate Invite</button>
      )}

      {roomId && !battleStarted && (
        <div className="lobby">
          <div className="card">

            <h2>Battle Lobby</h2>

            <p><strong>Room ID:</strong> {roomId}</p>

            <input value={inviteLink} readOnly />

            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                alert("Copied!");
              }}
            >
              Copy Invite
            </button>

            {roomData && (
              <>
                <p>Host: {roomData.hostReady ? "✅" : "❌"}</p>
                <p>Guest: {roomData.guestReady ? "✅" : "❌"}</p>
              </>
            )}

            <button onClick={ready}>Ready</button>

            {role === "host" && (
              <button
                disabled={!roomData || !roomData.hostReady || !roomData.guestReady}
                onClick={startBattle}
              >
                Start Battle
              </button>
            )}

          </div>
        </div>
      )}

      {battleStarted && !winner && (
        <div className="race-area">

          <h2>Time Left: {timeLeft}s</h2>

          {countdown && <div className="countdown">{countdown}</div>}

          <div id="text-display"></div>

          <input
            value={input}
            onChange={handleTyping}
            placeholder="Start typing..."
            autoFocus
          />

          <h3>WPM: {wpm}</h3>

        </div>
      )}

      {battleStarted && winner && (
        <div className="result">
          <h2>Result</h2>

          <p>Winner: {winner}</p>
          <p>WPM: {wpm}</p>
          <p>Accuracy: {accuracy}%</p>
          <p>Mistakes: {totalCharsTyped - correctChars}</p>

          <button onClick={() => window.location.reload()}>Play Again</button>
        </div>
      )}

    </div>
  );
}

export default Battle;