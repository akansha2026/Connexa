import express from "express";
import { CLIENT_BASE_URL, PORT } from "./configs/variables";
import { logger } from "./configs/logger";
import dbClient from "./configs/db";
import { authRouter } from "./routes/auth.routes";
import cors from "cors";

const app = express();

// Middlewares
app.use(express.json());
app.use(
  cors({
    origin: CLIENT_BASE_URL,
    credentials: true,
  }),
);

// Setup routes
app.use("/api/v1/auth", authRouter);

// Home endpoint
app.get("/", (_req, res) => {
  res.send("Hello from Connexa server");
});

async function startServer() {
  try {
    // Try to connect with DB
    await dbClient.$connect();

    // Start the server
    app.listen(PORT, () => {
      logger.info(
        `Connected to database & server started succesfully. You can access it at http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    if (error instanceof Error)
      logger.error(`Internal error: ${error.message}`);
    else logger.error(`Something went wrong`);
  }
}

startServer();
