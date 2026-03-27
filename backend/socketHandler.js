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
// SOCKET HANDLER
// ----------------------
module.exports = (socket, io) => {

  console.log("User connected:", socket.id);


  // ----------------------
  // CREATE ROOM
  // ----------------------
  socket.on("create-room", () => {

    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    rooms[roomId] = {
      host: socket.id,
      guest: null,
      hostReady: false,
      guestReady: false,
      gameStarted: false,
      text: ""
    };

    socket.join(roomId);

    console.log("Room created:", roomId);

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

    const text = generateText(100);

    rooms[roomId].text = text;
    rooms[roomId].gameStarted = true;

    console.log("Battle started in room:", roomId);

    // 🔥 IMPORTANT (matches frontend)
    io.to(roomId).emit("battle-start", text);
  });


  // ----------------------
  // PROGRESS
  // ----------------------
  socket.on("progress", ({ roomId, progress }) => {

    if (!rooms[roomId]) return;

    socket.to(roomId).emit("opponent-progress", progress);
  });


  // ----------------------
  // FINISH
  // ----------------------
  socket.on("finish", ({ roomId, wpm }) => {

    if (!rooms[roomId]) return;

    socket.to(roomId).emit("opponent-finished", { wpm });
  });


  // ----------------------
  // DISCONNECT
  // ----------------------
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

};