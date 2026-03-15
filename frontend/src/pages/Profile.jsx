import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

const defaultProfile = {
  playerName: "Guest",
  battlesPlayed: 0,
  age: "",
  gender: "Prefer not to say",
};

function getBattlesPlayedCount() {
  const rawCount = Number(localStorage.getItem("typearena.battlesPlayed") || "0");
  return Number.isFinite(rawCount) && rawCount >= 0 ? Math.floor(rawCount) : 0;
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(defaultProfile);
  const [draftProfile, setDraftProfile] = useState(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem("typearena.profile");
    const battlesPlayed = getBattlesPlayedCount();

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        const nextProfile = {
          ...defaultProfile,
          ...parsed,
          battlesPlayed,
        };

        setProfile(nextProfile);
        setDraftProfile(nextProfile);
      } catch {
        const fallbackProfile = {
          ...defaultProfile,
          battlesPlayed,
        };
        setProfile(fallbackProfile);
        setDraftProfile(fallbackProfile);
      }
    } else {
      const initialProfile = {
        ...defaultProfile,
        battlesPlayed,
      };
      setProfile(initialProfile);
      setDraftProfile(initialProfile);
    }

    const onStorage = (event) => {
      if (event.key === "typearena.battlesPlayed") {
        const nextBattlesPlayed = getBattlesPlayedCount();
        setProfile((prev) => ({ ...prev, battlesPlayed: nextBattlesPlayed }));
        setDraftProfile((prev) => ({ ...prev, battlesPlayed: nextBattlesPlayed }));
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const saveProfile = () => {
    const parsedAge = Number(draftProfile.age);
    const battlesPlayed = getBattlesPlayedCount();

    const nextProfile = {
      playerName: draftProfile.playerName.trim() || "Guest",
      battlesPlayed,
      age:
        Number.isFinite(parsedAge) && parsedAge >= 1 && parsedAge <= 120
          ? String(Math.floor(parsedAge))
          : "",
      gender: draftProfile.gender || "Prefer not to say",
    };

    setProfile(nextProfile);
    setDraftProfile(nextProfile);
    setIsEditing(false);
    localStorage.setItem("typearena.profile", JSON.stringify(nextProfile));
  };

  const cancelEdit = () => {
    setDraftProfile(profile);
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1>Player Profile</h1>
        <p className="subtitle">Track your progress and jump back into the arena.</p>

        <div className="profile-grid">
          <div className="profile-item">
            <span className="label">Player Name</span>
            {isEditing ? (
              <input
                type="text"
                value={draftProfile.playerName}
                onChange={(e) =>
                  setDraftProfile((prev) => ({
                    ...prev,
                    playerName: e.target.value,
                  }))
                }
                className="profile-input"
                maxLength={24}
              />
            ) : (
              <span className="value">{profile.playerName}</span>
            )}
          </div>

          <div className="profile-item">
            <span className="label">Battles Played</span>
            <span className="value">{profile.battlesPlayed}</span>
            <span className="label">Auto-updated after each battle</span>
          </div>

          <div className="profile-item">
            <span className="label">Age</span>
            {isEditing ? (
              <input
                type="number"
                min="1"
                max="120"
                value={draftProfile.age}
                onChange={(e) =>
                  setDraftProfile((prev) => ({
                    ...prev,
                    age: e.target.value,
                  }))
                }
                className="profile-input"
              />
            ) : (
              <span className="value">{profile.age || "-"}</span>
            )}
          </div>

          <div className="profile-item">
            <span className="label">Gender</span>
            {isEditing ? (
              <select
                value={draftProfile.gender}
                onChange={(e) =>
                  setDraftProfile((prev) => ({
                    ...prev,
                    gender: e.target.value,
                  }))
                }
                className="profile-input profile-select"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            ) : (
              <span className="value">{profile.gender}</span>
            )}
          </div>
        </div>

        {!isEditing ? (
          <div className="profile-actions">
            <button
              type="button"
              className="mini-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <div className="profile-actions">
            <button type="button" className="mini-btn" onClick={saveProfile}>
              Save
            </button>

            <button
              type="button"
              className="mini-btn mini-btn-secondary"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          </div>
        )}

        <button type="button" className="back-btn" onClick={() => navigate("/")}>
          Back To Home
        </button>
      </div>
    </div>
  );
}
