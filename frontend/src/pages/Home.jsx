import { useNavigate } from "react-router-dom";
import "../styles/style.css";

function Home() {
  const navigate = useNavigate();

  return (
    <>
      {/* Profile Button */}
      <button
        className="profile-btn"
        type="button"
        aria-label="Open profile"
        onClick={() => navigate("/profile")}
      >
        <span className="material-symbols-outlined">person</span>
      </button>

      {/* Home Page */}
      <div className="home-page">
        <div className="home-card">
          <h1>Welcome to TypeArena</h1>
          <p>Your ultimate typing challenge platform!</p>

          <div className="actions">
            <button onClick={() => navigate("/practice")} id="practice-btn">
              Practice
            </button>

            <button onClick={() => navigate("/battle")} id="battle-btn">
              Battle
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;