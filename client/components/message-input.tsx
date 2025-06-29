import { Plus, SendHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { WebSocketEvents, ws } from "@/lib/ws";
import { FormEvent, useRef } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { MessageType } from "@/lib/index.types";
import { useSound } from 'react-sounds';

export function MessageInput() {
    const {play} = useSound("notification/popup")
    const { activeConversation } = useStore();
    
    const inputRef = useRef<HTMLInputElement>(null)

    function handleSubmit(evt: FormEvent<HTMLFormElement>) {
        evt.preventDefault()

        const message = inputRef.current?.value

        if (!message) {
            toast.error("Message cannot be empty!")
            return;
        }

        // Trigger an event
        ws.send(WebSocketEvents.NEW_MESSAGE, {
            conversationId: activeConversation?.id,
            content: message,
            type: MessageType.TEXT
        })

        // Play sent sound
        play()

        if(inputRef.current) inputRef.current.value = ""
    }
    return <div className="p-2 border-t flex items-center gap-2 bg-secondary w-full">
        <Button
            onClick={() => {
                // Handle send message
            }}
            size="icon"
            className="rounded-full"
        >
            <Plus />
        </Button>
        <form onSubmit={handleSubmit} className="flex gap-2 flex-1 items-center">
            <input
                ref={inputRef}
                className="w-full px-4 py-2 bg-background rounded-full outline-none font-thin"
                type="text"
                placeholder="Type a message..."
            />
            <Button
                type="submit"
                size="icon"
                className="rounded-full"
            >
                <SendHorizontal />
            </Button>
        </form>
    </div>
}