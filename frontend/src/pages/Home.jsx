import "../styles/style.css";
import ThemeToggle from "../components/ThemeToggle";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { subscribeToUserProfile } from "../auth/authService";

import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function calculateScore(wpm, accuracy) {
  return Number(wpm || 0) * (Number(accuracy || 0) / 100);
}

function Home({ onProtectedNavigate }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    username: "",
    bestWpm: 0,
    bestAccuracy: 0,
    score: 0,
    streak: 0,
    battlesPlayed: 0,
  });

  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserProfile(user.uid, (profileData) => {
      setProfile({
        username: profileData?.username || user.displayName || "Player",
        bestWpm: Number(profileData?.bestWpm || 0),
        bestAccuracy: Number(profileData?.bestAccuracy || 0),
        score: calculateScore(
          profileData?.bestWpm,
          profileData?.bestAccuracy
        ),
        streak: Number(profileData?.streak || 0),
        battlesPlayed: Number(profileData?.battlesPlayed || 0),
      });
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const users = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const bestWpm = Number(data.bestWpm || 0);
          const bestAccuracy = Number(data.bestAccuracy || 0);

          users.push({
            id: doc.id,
            username: data.username || "Player",
            bestWpm,
            bestAccuracy,
            score: calculateScore(bestWpm, bestAccuracy),
          });
        });

        const currentUserEntry = user
          ? {
              id: user.uid,
              username:
                profile.username || user.displayName || user.email?.split("@")[0] || "Player",
              bestWpm: profile.bestWpm || 0,
              bestAccuracy: profile.bestAccuracy || 0,
              score: profile.score || 0,
            }
          : null;

        const mergedUsers = currentUserEntry
          ? [
              ...users.filter((entry) => entry.id !== currentUserEntry.id),
              currentUserEntry,
            ]
          : users;

        mergedUsers.sort((a, b) => (b.score || 0) - (a.score || 0));

        setLeaderboard(
          mergedUsers.map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }))
        );
      },
      (error) => {
        console.error("Error fetching leaderboard:", error);
      }
    );

    return () => unsubscribe();
  }, [user, profile.username, profile.bestWpm, profile.bestAccuracy, profile.score]);

  const handleProtectedNavigation = (path) => {
    onProtectedNavigate(path);
  };

  return (
    <>
      <ThemeToggle />

      <button
        className="profile-btn"
        type="button"
        aria-label="Open profile"
        onClick={() => handleProtectedNavigation("/profile")}
      >
        <span className="material-symbols-outlined">person</span>
      </button>

      <div className="home-page">
        <h1 className="main-heading">Welcome to TypeArena</h1>
        <p>Your ultimate typing challenge platform!</p>

        <div className="home-card">
          <div className="actions">
            <button
              onClick={() => handleProtectedNavigation("/practice")}
              id="practice-btn"
            >
              Practice
            </button>

            <button
              onClick={() => handleProtectedNavigation("/battle")}
              id="battle-btn"
            >
              Battle
            </button>
          </div>
        </div>

  
        <div className="leaderboard leaderboard-floating">
          <h2>Leaderboard</h2>

          <div className="leaderboard-grid leaderboard-header">
            <span>Username</span>
            <span>WPM</span>
            <span>Accuracy</span>
            <span>Rank</span>
          </div>

          <div className="leaderboard-body">
            {leaderboard.length === 0 ? (
              <div className="leaderboard-empty">No players yet</div>
            ) : (
              leaderboard.slice(0, 10).map((user) => (
                <div key={user.id} className="leaderboard-row leaderboard-grid">
                  <span>{user.username}</span>
                  <span>{user.bestWpm}</span>
                  <span>{user.bestAccuracy}%</span>
                  <span>#{user.rank}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="leaderboard status-board status-floating">
          <div className="status-list">
            <div className="status-item">
              🔥 Streaks = {user ? profile.streak : "-"}
            </div>

            <div className="status-item">
              ⚔️ Battles Played = {user ? profile.battlesPlayed : "-"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;