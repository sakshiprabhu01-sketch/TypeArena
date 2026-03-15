# TypeArena – Real-Time Typing Battle

TypeArena is a real-time multiplayer typing game where players can compete with friends and test their typing speed and accuracy. Players can generate an invite link, join a lobby, and race against each other within a limited time.

The app also includes a Practice Mode where users can practice typing individually and improve their typing speed.

This project uses Socket.IO for real-time communication with a React frontend and Node.js backend.

---

## Features

* Real-time multiplayer typing race
* Generate and share invite links
* Lobby system before the game starts
* 60-second typing challenge
* Live typing progress updates
* Practice mode for solo typing
* Clean and responsive UI

---

## Tech Stack

**Frontend**

* React
* React Router
* CSS
* Vite

**Backend**

* Node.js
* Express.js
* Socket.IO

**Tools**

* Git
* GitHub

---

## Project Structure

```
typing-battle/
│
├── frontend/              # React frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── styles/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── backend/               # Node.js backend
│   ├── server.js
│   ├── socket.js
│   └── package.json
│
└── README.md
```

---

## Running the Project

### Start the backend server

```
cd backend
node server.js
```

### Start the frontend

Open another terminal:

```
cd frontend
npm run dev
```

Then open your browser and go to:

```
http://localhost:5173
```

---

## Game Modes

### Multiplayer Battle

1. Generate an invite link.
2. Share the link with friends.
3. Players join the lobby.
4. Players click Ready.
5. The game starts with a 60-second timer.
6. Players type the given text as fast as possible.
7. The player with the highest typing speed wins.

### Practice Mode

Users can also practice typing individually without joining a lobby. This mode helps improve typing speed and accuracy.

---

## Author

Sakshi Prabhu
IT Student
Interested in Web Development and Real-Time Applications.
