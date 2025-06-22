import { WebSocketServer, RawData, WebSocket } from "ws";
import { parse } from 'cookie'
import jwt from 'jsonwebtoken'
import { IncomingMessage, Server, ServerResponse } from "http";
import { JWT_SECRET_KEY } from "../configs/variables";
import { LoggedInUser, MessageEventData } from "../types/ws.types";
import { eventHandlers, registerEventHandlers, registerHandler } from "./events.ws";
import { AuthTokenPayload } from "../types/auth.types";
import { onlineUsers } from "../configs/ws";
import dbClient from "../configs/db";

export function initWebSocket(server: Server<typeof IncomingMessage, typeof ServerResponse>) {
    const wss = new WebSocketServer({
        noServer: true
    });

    // Register all event handlers
    registerEventHandlers()

    // Handling WebSocket connection
    wss.on('connection', async function (ws) {
        const loggedInUser: LoggedInUser = (ws as any).user; // Cast to any to access user property
        console.log("Client connected: ", loggedInUser)
        // Make the user online in DB
        try {
            await dbClient.user.update({
                where: { id: loggedInUser.id },
                data: { online: true }
            })
        } catch (error) {
            console.error('Error updating user online status:', error);
            ws.close(1008, 'Internal Server Error'); // Close the connection with an error code
            return;
        }

        // Add the new user to the online users map
        onlineUsers.set(loggedInUser.id, ws);

        // Handling errors
        ws.on('error', console.log)

        // Handling close
        ws.on('close', async function () {
            console.log('Client disconnected!')
            onlineUsers.delete(loggedInUser.id);

            // Update the user status in DB to offline & last seen time
            try {
                await dbClient.user.update({
                    where: { id: loggedInUser.id },
                    data: { online: false, lastSeen: new Date() }
                });
            } catch (error) {
                console.error('Error updating user offline status:', error);
                return;
            }
        });

        // Handling message event
        ws.on('message', function (data: RawData) {
            const parsedData: MessageEventData = JSON.parse(data.toString())
            if (eventHandlers.get(parsedData.type)) {
                eventHandlers.get(parsedData.type)!({
                    user: loggedInUser,
                    data: parsedData.content,
                    ws: ws
                })
            }
        })
    })

    // Handle the Upgrade
    server.on('upgrade', function upgrade(request, socket, head) {
        socket.on('error', console.log); // catch low-level errors

        try {
            const cookies = parse(request.headers.cookie || '');
            let token = cookies.accessToken;

            if (!token) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            const payload = jwt.verify(token, JWT_SECRET_KEY!) as AuthTokenPayload;

            wss.handleUpgrade(request, socket, head, function done(ws) {
                // attach the user to the ws instance
                (ws as any).user = {
                    id: payload.id,
                    email: payload.email
                };

                wss.emit('connection', ws, request);
            });
        } catch (err) {
            console.error('Auth failed:', err);
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
        }
    });
}
