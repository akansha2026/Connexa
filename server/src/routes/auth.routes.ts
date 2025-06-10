import { Router } from "express";
import { login, signup, forgotPassword, logout, resetPassword } from "../controllers/auth.controllers";

const authRouter = Router();

// Define your routes
authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
// authRouter.post("/refresh-token", refreshToken);
// authRouter.post("/verify-email", verifyEmail);
// authRouter.post("/verify-email/resend", verifyEmailResend);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);

export { authRouter };
