import { Router } from "express";
import { createConversation, getConversationMessages, getConversationsByUserId } from "../controllers/conversation.controllers";

const conversationRouter = Router();

// POST /conversations -> Create a conversation
conversationRouter.post("/", createConversation);

// GET /conversations -> Get all conversations for the authenticated user
conversationRouter.get("/", getConversationsByUserId);

// GET /conversations/:id/messages -> Get messages for a specific conversation
conversationRouter.get("/:id/messages", getConversationMessages);

export { conversationRouter };
