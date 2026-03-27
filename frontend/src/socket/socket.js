import { io } from "socket.io-client";

export const socket = io("https://typearena-backend-akog.onrender.com", {
  transports: ["polling", "websocket"] // 🔥 REQUIRED
});

// Debug logs
socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("❌ Error:", err.message);
});