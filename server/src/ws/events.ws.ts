import { WebSocket } from "ws";
import { WebSocketEvents } from "../constants/events.constants";
import { HandlerData, HandlerFunction, MessageType, NewMessagePayload, TypingPayload } from "../types/ws.types";
import dbClient from "../configs/db";
import { onlineUsers } from "../configs/ws";
import logger from "../configs/logger";

export const eventHandlers = new Map<string, HandlerFunction>();

export function registerHandler(type: string, handlerFn: HandlerFunction) {
  eventHandlers.set(type, handlerFn);
}

export function registerEventHandlers() {
  registerHandler(WebSocketEvents.NEW_MESSAGE, handleNewMessage as HandlerFunction);
  registerHandler(WebSocketEvents.TYPING_START, handleTypingStart as HandlerFunction);
  registerHandler(WebSocketEvents.TYPING_STOP, handleTypingStop as HandlerFunction);
  // Extend more events if needed
}

function sendMessage(ws: WebSocket, type: WebSocketEvents, data: any) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type, content: data }));
  }
}

// Utility: Broadcast to all participants of a conversation
async function broadcastToParticipants(conversationId: string, type: WebSocketEvents, payload: any, excludeUserId?: string) {
  try {
    const participants = await dbClient.participant.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    for (const participant of participants) {
      if (participant.userId === excludeUserId) continue; // Don't send to self
      const socket = onlineUsers.get(participant.userId);
      if (socket && socket.readyState === socket.OPEN) {
        sendMessage(socket, type, payload);
      }
    }
  } catch (err) {
    logger.error("Error broadcasting to participants", err);
  }
}

// Handlers

export async function handleNewMessage(payload: HandlerData) {
  const { ws, user, data } = payload;
  try {
    const { conversationId, type, content, mediaUrl } = data as NewMessagePayload;

    if (!conversationId) throw new Error("Conversation Id is required");
    if (type === MessageType.TEXT && !content) throw new Error("Content is required for text messages");
    if (type !== MessageType.TEXT && !mediaUrl) throw new Error("Media URL is required for non-text messages");

    // Create message in DB
    const message = await dbClient.message.create({
      data: { senderId: user.id, ...data },
      include: { sender: true },
    });

    // Send to sender immediately
    sendMessage(ws, WebSocketEvents.NEW_MESSAGE, message);

    // Broadcast to others
    await broadcastToParticipants(conversationId, WebSocketEvents.NEW_MESSAGE, message, user.id);
  } catch (error) {
    logger.error("handleNewMessage error:", error);
    sendMessage(ws, WebSocketEvents.ERROR, { error: (error as Error).message || "Internal Server Error" });
  }
}

export async function handleTypingStart(payload: HandlerData) {
  const { ws, user, data } = payload;
  try {
    const { conversationId } = data as TypingPayload;
    if (!conversationId) throw new Error("Conversation Id is required");

    await broadcastToParticipants(conversationId, WebSocketEvents.TYPING_START, {
      conversationId,
      userId: user.id,
    }, user.id);
  } catch (err) {
    logger.error("handleTypingStart error:", err);
    sendMessage(ws, WebSocketEvents.ERROR, { error: (err as Error).message });
  }
}

export async function handleTypingStop(payload: HandlerData) {
  const { ws, user, data } = payload;
  try {
    const { conversationId } = data as TypingPayload;
    if (!conversationId) throw new Error("Conversation Id is required");

    await broadcastToParticipants(conversationId, WebSocketEvents.TYPING_STOP, {
      conversationId,
      userId: user.id,
    }, user.id);
  } catch (err) {
    logger.error("handleTypingStop error:", err);
    sendMessage(ws, WebSocketEvents.ERROR, { error: (err as Error).message });
  }
}

// Additional events could include:
// handleMessageEdited, handleMessageDeleted, handleUserOnline, handleUserOffline