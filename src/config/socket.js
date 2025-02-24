import { Server } from "socket.io";
import http from "http";

if (!process.env.SERVER_PROXY)
  throw new Error("Cannot setup socket.io server without domain name and port");

export const createSocket = (server) => {
  return new Server(server, {
    cors: {
      origin: ["http://localhost:1060", "http://88.222.214.174:1060"],
      methods: ["GET", "POST", "OPTIONS"],
    },
    path: "/socket.io/",
  });
};
