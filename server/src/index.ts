import express from "express";
import { PORT, SMTP_USER } from "./config/variables";
import { sendMail } from "./utils/email";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Hello from Express + TypeScript!");
});

app.post("/sendmail", async (req, res) => {
  // Placeholder for sending mail logicß
  const { to } = req.body;
  await sendMail(
    SMTP_USER!,
    to,
    "Test Email",
    "<h1>Hello World</h1><br/>This is a test email sent from Express + TypeScript!<br/><a style=\"padding:10px; border-radius: 5px; border: 2px solid black;\"  href='https://google.com'>Click here</a>",
  );
  res.send("Mail sent successfully!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
