const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// Allow frontend (Vite React)
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"]
}));

const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});


// ----------------------
// WORD LIST
// ----------------------

const wordList = [
  "time","people","world","life","day",
  "practice","typing","speed","focus","skill",
  "give","fun","which","what","know",
  "learn","improve","keyboard","accuracy","game",
  "the","her","because"
];


// ----------------------
// GENERATE TEXT
// ----------------------

function generateText(wordCount = 150) {

  let result = [];

  for (let i = 0; i < wordCount; i++) {

    const randomIndex = Math.floor(Math.random() * wordList.length);

    result.push(wordList[randomIndex]);

  }

  return result.join(" ");
}


// ----------------------
// ROOM STORAGE
// ----------------------

const rooms = {};


// ----------------------
// SOCKET CONNECTION
// ----------------------

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);


  // ----------------------
  // CREATE ROOM
  // ----------------------

  socket.on("create-room", () => {

    const roomId = Math.random().toString(36).substring(2, 8);

    console.log("Room created:", roomId);

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


  // ----------------------
  // JOIN ROOM
  // ----------------------

  socket.on("join-room", (roomId) => {

    if (!rooms[roomId]) return;

    rooms[roomId].guest = socket.id;

    socket.join(roomId);

    io.to(roomId).emit("room-update", rooms[roomId]);

  });


  // ----------------------
  // READY
  // ----------------------

  socket.on("ready", ({ roomId, role }) => {

    if (!rooms[roomId]) return;

    if (role === "host") rooms[roomId].hostReady = true;

    if (role === "guest") rooms[roomId].guestReady = true;

    io.to(roomId).emit("room-update", rooms[roomId]);

  });


  // ----------------------
  // START BATTLE
  // ----------------------

  socket.on("start", (roomId) => {

    if (!rooms[roomId]) return;

    const text = generateText(80);

    rooms[roomId].text = text;

    io.to(roomId).emit("battle-start", text);

  });


  // ----------------------
  // TYPING PROGRESS
  // ----------------------

  socket.on("progress", ({ roomId, progress }) => {

    if (!rooms[roomId]) return;

    socket.to(roomId).emit("opponent-progress", progress);

  });


  // ----------------------
  // FINISH EVENT
  // ----------------------

  socket.on("finish", ({ roomId, wpm }) => {

    if (!rooms[roomId]) return;

    socket.to(roomId).emit("opponent-finished", {
      wpm
    });

  });


  // ----------------------
  // DISCONNECT
  // ----------------------

  socket.on("disconnect", () => {

    console.log("User disconnected:", socket.id);

  });

});


// ----------------------
// START SERVER
// ----------------------

server.listen(5000, () => {

  console.log("Server running on port 5000");

});