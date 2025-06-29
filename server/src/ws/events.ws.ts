import { WebSocket } from "ws";
import { WebSocketEvents } from "../constants/events.constants";
import { HandlerData, HandlerFunction, LoggedInUser, MessageType, NewMessagePayload } from "../types/ws.types";
import dbClient from "../configs/db";
import { onlineUsers } from "../configs/ws";

export const eventHandlers = new Map<string, HandlerFunction>;

export function registerHandler(type: string, handlerFn: HandlerFunction) {
    eventHandlers.set(type, handlerFn)
}

export function registerEventHandlers() {
    registerHandler(WebSocketEvents.NEW_MESSAGE, handleNewMessage as HandlerFunction)
}

function sendMessage(ws: WebSocket, type: WebSocketEvents, data: any) {
    ws.send(JSON.stringify({
        type,
        content: data
    }))
}   

// handlers
async function handleNewMessage(payload: HandlerData) {
    const { ws, user, data } = payload
    try {
        const { conversationId, type, content, mediaUrl } = data as NewMessagePayload

        if (!conversationId) {
            sendMessage(ws, WebSocketEvents.ERROR, {
                error: "Conversation Id is required"
            })
            return;
        }

        if (type == MessageType.TEXT && !content){
            sendMessage(ws, WebSocketEvents.ERROR, {
                error: "Content is required in case of text messages"
            })
            return;
        }

        if (type != MessageType.TEXT && !mediaUrl){
            sendMessage(ws, WebSocketEvents.ERROR, {
                error: "Media URL is required in case of non-text messages"
            })
            return;
        }

        // Create a new message in database
        const message = await dbClient.message.create({
            data: {
                senderId: user.id,
                ...data
            },
            include: {
                sender: true
            }
        })

        // Send messages to all online participants
        const participants = await dbClient.participant.findMany({
            where: {
                conversationId
            },
            select: {
                userId: true
            }
        })

        for(let participant of participants){
            if(onlineUsers.has(participant.userId)){
                const socket = onlineUsers.get(participant.userId)
                if(socket?.OPEN){
                    // Send the message
                    sendMessage(socket, WebSocketEvents.NEW_MESSAGE, message)
                }
            }
        }
    } catch (error) {
        sendMessage(ws, WebSocketEvents.ERROR, {
            error: "Internal Server Error"
        })
    }
}