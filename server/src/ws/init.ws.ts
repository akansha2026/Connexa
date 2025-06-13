import { WebSocketServer, RawData } from "ws";
import { parse } from 'cookie'
import jwt from 'jsonwebtoken'
import { IncomingMessage, Server, ServerResponse } from "http";
import { JWT_SECRET_KEY } from "../configs/variables";
import { MessageEventData } from "../types/ws.types";
import { handleEvent } from "./events.ws";

export function initWebSocket(server: Server<typeof IncomingMessage, typeof ServerResponse>) {
    const wss = new WebSocketServer({
        noServer: true
    })

    // Handling Websocket connection
    wss.on('connection', function (ws) {
        // Handling errors
        ws.on('error', console.log)

        // Handling close
        ws.on('close', function () {
            console.log('Client disconnected!')
        })

        // Handling message event
        ws.on('message', function (data: RawData, isBinary: boolean) {
            if(isBinary){
                console.log("Binary data received!")
            }else{
                // Handle textual data
                const parsedData: MessageEventData = JSON.parse(data.toString())
                handleEvent(parsedData.type, parsedData.content)
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

            const decoded = jwt.verify(token, JWT_SECRET_KEY!);

            wss.handleUpgrade(request, socket, head, function done(ws) {
                wss.emit('connection', ws, request);
            });
        } catch (err) {
            console.error('Auth failed:', err);
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
        }
    });
}

