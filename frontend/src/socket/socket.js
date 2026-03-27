import { io } from "socket.io-client";

export const socket = io("https://typearena-production.up.railway.app", {
  transports: ["websocket"], // 🔥 IMPORTANT
  withCredentials: true
});

// Debug logs (VERY useful)
socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("Connection Error:", err.message);
});