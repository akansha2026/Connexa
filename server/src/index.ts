import express from "express";
import { PORT } from "./configs/variables";
import { logger } from "./configs/logger";
import client from "./configs/db";
import { authRouter } from "./routes/auth.routes";

const app = express();

app.use(express.json());

// Setup routes
app.use("/api/v1/auth", authRouter)

// Home endpoint
app.get("/", (_req, res) => {
  res.send("Hello from Connexa server");
});

async function startServer() {
  try {
    // Try to connect with DB
    await client.$connect();

    // Start the server
    app.listen(PORT, () => {
      logger.info(`Connected to database & server started succesfully. You can access it at http://localhost:${PORT}`)
    })
  } catch (error) {
    if (error instanceof Error) logger.error(`Internal error: ${error.message}`)
    else logger.error(`Something went wrong`)
  }
}

startServer()