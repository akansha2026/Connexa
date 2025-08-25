import { Router } from "express";
import { getAllUsers, updateUser } from "../controllers/user.controllers";

const userRouter = Router();

userRouter.patch("/", updateUser)
userRouter.get("/", getAllUsers); // Fetch all users

export { userRouter }