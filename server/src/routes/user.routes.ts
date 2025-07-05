import { Router } from "express";
import { updateUser } from "../controllers/user.controllers";

const userRouter = Router();

userRouter.patch("/", updateUser)

export { userRouter }