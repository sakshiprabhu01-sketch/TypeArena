const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// ✅ Allow all (for now)
app.use(cors({
  origin: "*"
}));

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

const server = http.createServer(app);

// ✅ Socket.io
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

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

  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) return;

    rooms[roomId].guest = socket.id;
    socket.join(roomId);

    io.to(roomId).emit("room-update", rooms[roomId]);
  });

  socket.on("ready", ({ roomId, role }) => {
    if (!rooms[roomId]) return;

    if (role === "host") rooms[roomId].hostReady = true;
    if (role === "guest") rooms[roomId].guestReady = true;

    io.to(roomId).emit("room-update", rooms[roomId]);
  });

  socket.on("start", (roomId) => {
    if (!rooms[roomId]) return;

    const text = "typing game test text";
    rooms[roomId].text = text;

    io.to(roomId).emit("battle-start", text);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

// ✅ IMPORTANT (Render compatible)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});