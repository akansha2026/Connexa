import { Router } from "express";
import { login, signup } from "../controllers/auth.controllers";

const authRouter = Router();

// Define your routes
authRouter.post("/signup", signup);
authRouter.post("/login", login);

export { authRouter };
