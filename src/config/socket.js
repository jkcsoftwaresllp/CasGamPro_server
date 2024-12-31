import { Server } from "socket.io";
import http from "http";

if (!process.env.SERVER_PROXY)
  throw new Error("Cannot setup socket.io server without domain name and port");

export const createSocket = (server) => {
  return new Server(server, {
    cors: {
      origin: `http://${process.env.SERVER_PROXY}`, // will be changed to https
      methods: ["GET", "POST"],
    },
  });
};