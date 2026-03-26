import { io } from "socket.io-client";

const socket = io("https://typearena-production.up.railway.app", {
  transports: ["websocket"],   
  withCredentials: true
});

export default socket;