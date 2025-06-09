import dotenv from "dotenv";

// Load env variables
dotenv.config();

export const {
  PORT,
  NODE_ENV,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  CLIENT_BASE_URL,
  CLIENT_VERIFY_EMAIL_ENDPOINT,
  JWT_SECRET_KEY,
  AUTHORIZATION_EXCLUSION_ENDPOINTS,
} = process.env;
