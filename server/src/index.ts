import express from "express";
import { CLIENT_BASE_URL, PORT } from "./configs/variables";
import logger from "./configs/logger";
import dbClient from "./configs/db";
import { authRouter } from "./routes/auth.routes";
import cors from "cors";
import { authMiddleware } from "./middlewares/auth.middleware";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { initWebSocket } from "./ws/init.ws";
import { conversationRouter } from "./routes/conversation.routes";

const app = express();
const server = createServer(app);

// Middlewares
app.use(express.json());
app.use(
  cors({
    origin: CLIENT_BASE_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(authMiddleware);

// Setup routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/conversations", conversationRouter);

// Home endpoint
app.get("/", (_req, res) => {
  res.send("Hello from Connexa server");
});

async function startServer() {
  try {
    // Try to connect with DB
    await dbClient.$connect();

    // Start the server
    server.listen(PORT, () => {
      logger.info(
        `Connected to database & server started succesfully. You can access it at http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    if (error instanceof Error)
      logger.error(`Internal error: ${error.message}`);
    else logger.error(`Something went wrong`);
    process.exit(1);
  }
}

// Initialize web socket
initWebSocket(server);

// Start the server
startServer();
