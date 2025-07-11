import { Router } from "express";
import {
  login,
  signup,
  forgotPassword,
  logout,
  resetPassword,
  verifyEmail,
  getProfile,
} from "../controllers/auth.controllers";

const authRouter = Router();

// Define your routes
authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.get("/profile", getProfile);

export { authRouter };
