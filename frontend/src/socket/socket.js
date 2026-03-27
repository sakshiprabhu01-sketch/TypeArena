import { io } from "socket.io-client";

export const socket = io("https://typearena-production.up.railway.app", {
  transports: ["polling", "websocket"], // ✅ VERY IMPORTANT
  withCredentials: true
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("Connection Error:", err.message);
});