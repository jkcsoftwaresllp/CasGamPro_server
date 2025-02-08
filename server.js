import express from "express";
import cors from "cors";
import http from "http";
import { initializeGameServices } from "./src/services/index.js";
import sessionConfig from "./src/config/session.js";
import publicApiRoute from "./src/routes/publicApiRoute.js";
import privateApiRoute from "./src/routes/privateApiRoute.js";
import { isAuth } from "./src/middleware/isAuth.js";
import { errorHandler } from "./src/utils/errorHandler.js";
import "dotenv/config";
import { logger } from "./src/logger/logger.js";
import { initializeSocket } from "./src/services/shared/config/socket/index.js";

const PORT = process.env.PORT || 5001;

const app = express();
const server = http.createServer(app);
const sessionMiddleware = sessionConfig();
const io = initializeSocket(server);
global.io = io;

// Middleware setup
const allowedOrigins = [
  "http://localhost:1060",
  "http://localhost:1061",
  "http://localhost:5173",
  "http://localhost:1062",
];

app.disable("x-powered-by");
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        // // Further checks for requests without origin
        // if (req.headers['user-agent'].includes('YourExpectedClient')) {
        //   return callback(null, true);
        // }

        // // Or require a valid token
        // if (req.headers['authorization'] === 'YourToken') {
        //   return callback(null, true);
        // }

        // // Deny any other cases
        // return callback(new Error("Unauthorized null origin"), false);
        return callback(null, true);
      }
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error("Not allowed by CORS"), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Handle preflight requests
app.options("*", cors());

// Parsing json data
app.use(express.json());

// Register for Express Session
app.use(sessionMiddleware);

// Public API routes
app.use("/api", publicApiRoute);

// Authentication middleware for private routes
app.use(isAuth);

// Private API routes
app.use("/auth-api", privateApiRoute);

// Error handling middleware
app.use(errorHandler);

// Running Server
server.listen(PORT, () => {
  logger.info(`CasGamPro server running on port ${PORT}`);
  initializeGameServices().then();
});

export { server };
