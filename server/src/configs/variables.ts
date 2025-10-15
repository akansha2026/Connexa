import dotenv from "dotenv";

// Load env variables
dotenv.config();

export const {
  PORT,
  FROM_EMAIL,
  NODE_ENV,
  SENDGRID_API_KEY,
  CLIENT_BASE_URL,
  JWT_SECRET_KEY,
  CLIENT_VERIFY_EMAIL_ENDPOINT,
  CLIENT_PASSWORD_RESET_ENDPOINT,
  AUTHORIZATION_EXCLUSION_ENDPOINTS
} = process.env;
