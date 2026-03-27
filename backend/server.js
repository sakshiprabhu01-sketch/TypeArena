const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// ----------------------
// 🔥 CORS (FINAL FIX)
// ----------------------
app.use(cors({
  origin: true,        // ✅ allow all origins (important for Railway)
  credentials: true
}));

// ----------------------
// HTTP SERVER
// ----------------------
const server = http.createServer(app);

// ----------------------
// SOCKET.IO
// ----------------------
const io = new Server(server, {
  cors: {
    origin: true,      // ✅ allow all origins
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ----------------------
// ROOMS STORAGE
// ----------------------
const rooms = {};

// ----------------------
// GENERATE TEXT
// ----------------------
function generateText(wordCount = 100) {
  const wordList = [
    "time","people","world","life","day",
    "practice","typing","speed","focus","skill",
    "give","fun","which","what","know",
    "learn","improve","keyboard","accuracy","game",
    "the","her","because"
  ];

  let result = [];

  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    result.push(wordList[randomIndex]);
  }

  return result.join(" ");
}

// ----------------------
// SOCKET EVENTS
// ----------------------
io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  // CREATE ROOM
  socket.on("create-room", () => {
    const roomId = Math.random().toString(36).substring(2, 8);

    rooms[roomId] = {
      host: socket.id,
      guest: null,
      hostReady: false,
      guestReady: false,
      text: ""
    };

    socket.join(roomId);

    socket.emit("room-created", roomId);
    io.to(roomId).emit("room-update", rooms[roomId]);
  });

  // JOIN ROOM
  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) return;

    rooms[roomId].guest = socket.id;
    socket.join(roomId);

    io.to(roomId).emit("room-update", rooms[roomId]);
  });

  // READY
  socket.on("ready", ({ roomId, role }) => {
    if (!rooms[roomId]) return;

    if (role === "host") rooms[roomId].hostReady = true;
    if (role === "guest") rooms[roomId].guestReady = true;

    io.to(roomId).emit("room-update", rooms[roomId]);
  });

  // START GAME
  socket.on("start", (roomId) => {
    if (!rooms[roomId]) return;

    const text = generateText(100);
    rooms[roomId].text = text;

    io.to(roomId).emit("battle-start", text);
  });

  // PROGRESS
  socket.on("progress", ({ roomId, progress }) => {
    socket.to(roomId).emit("opponent-progress", progress);
  });

  // FINISH
  socket.on("finish", ({ roomId, wpm }) => {
    socket.to(roomId).emit("opponent-finished", { wpm });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

});

// ----------------------
// ROOT ROUTE (IMPORTANT)
// ----------------------
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// ----------------------
// PORT (RAILWAY)
// ----------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});