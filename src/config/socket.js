import { Server } from "socket.io";
import http from "http";

if (!process.env.SERVER_PROXY)
  throw new Error("Cannot setup socket.io server without domain name and port");

export const createSocket = (server) => {
  return new Server(server, {
    cors: {
      origin: ["http://localhost:1060", "http://88.222.214.174:1060"],
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      allowedHeaders: [
        "Content-Type",
      ],
    },
    allowEIO3: true,
    transports: ["websocket", "polling"], // Explicitly specify transports
    path: "/socket.io/",
    pingTimeout: 60000,
    pingInterval: 25000,
  });
};
