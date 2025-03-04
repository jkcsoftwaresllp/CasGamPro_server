import { Server } from "socket.io";

if (!process.env.SERVER_PROXY)
  throw new Error("Cannot setup socket.io server without domain name and port");

export const createSocket = (server) => {
  return new Server(server, {
    cors: {
      origin: ["http://localhost:1060", "http://localhost:4173", "http://88.222.214.174:1060", "http://88.222.214.174:2060", "http://localhost:2060",],
      methods: ["GET", "POST", "OPTIONS"],
    },
    path: "/socket.io/",
  });
};
