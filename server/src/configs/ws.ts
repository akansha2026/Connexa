import { WebSocket } from "ws";

export const onlineUsers = new Map<string, WebSocket>();