import { io } from "socket.io-client";

const URL = "https://typearena-production.up.railway.app";

export const socket = io(URL, {
  transports: ["websocket"],   // 🚀 FORCE WEBSOCKET
  upgrade: false,              // 🚀 DISABLE POLLING
  reconnection: true
});