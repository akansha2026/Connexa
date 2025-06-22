import { WebSocket } from "ws"
export type MessageEventData = {
    type: string,
    content: any
}

export type LoggedInUser = {
    id: string,
    email: string
}

export enum MessageType {
    TEXT = "TEXT",
    IMAGE = "IMAGE",
    VIDEO = "VIDEO",
    AUDIO = "AUDIO",
    FILE = "FILE"
}

export type NewMessagePayload = {
    conversationId: string,
    content?: string,
    mediaUrl?: string,
    type: MessageType
}

export type HandlerData = {
    ws: WebSocket,
    user: LoggedInUser,
    data: any
}

export type HandlerFunction = (payload?: HandlerData) => Promise<void>