import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import "../styles/profile.css";
import ThemeToggle from "../components/ThemeToggle";
import { auth } from "../firebase";
import { subscribeToUserProfile, updateUserProfile } from "../auth/authService";

const defaultProfile = {
  username: "Guest",
  bestWpm: 0, 
  battlesPlayed: 0,
  streak: 0,

};

function normalizeProfile(profileData, user) {
  return {
    username:
      profileData?.username ||
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "User",

    bestWpm: Number(profileData?.bestWpm || 0), // 🔥 changed

    battlesPlayed: Number(profileData?.battlesPlayed || 0),
    streak: Number(profileData?.streak || 0),
    
  };
}

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(defaultProfile);
  const [draftProfile, setDraftProfile] = useState(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const unsubscribe = subscribeToUserProfile(user.uid, (profileData) => {
      const nextProfile = normalizeProfile(profileData, user);
      setProfile(nextProfile);

      setDraftProfile((currentDraft) => {
        if (isEditing) {
          return currentDraft;
        }
        return nextProfile;
      });
    });

    return () => unsubscribe();
  }, [user, isEditing]);

  const displayProfile = user ? profile : defaultProfile;
  const displayDraftProfile = user ? draftProfile : defaultProfile;

  const saveProfile = async () => {
    if (!user) return;

    const nextUsername = draftProfile.username.trim() || "User";

    await updateUserProfile(user.uid, {
      username: nextUsername,
    });

    setProfile((currentProfile) => ({
      ...currentProfile,
      username: nextUsername,
    }));

    setDraftProfile((currentDraft) => ({
      ...currentDraft,
      username: nextUsername,
    }));

    setIsEditing(false);
  };

  const cancelEdit = () => {
    setDraftProfile(profile);
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <ThemeToggle />
      <div className="profile-card">
        <h1>Player Profile</h1>
        <p className="subtitle">
          Track your progress and jump back into the arena.
        </p>

        <div className="profile-grid">
          <div className="profile-item">
            <span className="label">Username</span>
            {isEditing ? (
              <input
                type="text"
                value={displayDraftProfile.username}
                onChange={(e) =>
                  setDraftProfile((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                className="profile-input"
                maxLength={24}
              />
            ) : (
              <span className="value">{displayProfile.username}</span>
            )}
          </div>

         
          <div className="profile-item">
            <span className="label">Best WPM</span>
            <span className="value">{displayProfile.bestWpm}</span>
            <span className="label">Your highest typing speed</span>
          </div>

          <div className="profile-item">
            <span className="label">Battles Played</span>
            <span className="value">{displayProfile.battlesPlayed}</span>
            <span className="label">Updated from Battle mode</span>
          </div>

          <div className="profile-item">
            <span className="label">Streak</span>
            <span className="value">{displayProfile.streak || "-"}</span>
          </div>
        </div>

        {!isEditing ? (
          <div className="profile-actions">
            <button
              type="button"
              className="mini-btn"
              onClick={() => user && setIsEditing(true)}
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

        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/")}
        >
          Back To Home
        </button>
      </div>
    </div>
  );
}