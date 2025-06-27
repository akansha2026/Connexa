import { Plus, SendHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { WebSocketEvents, ws } from "@/lib/ws";
import { FormEvent, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Conversation, Message, MessageType } from "@/lib/index.types";

export function MessageInput() {
    const { activeConversation, conversations, setActiveConversation, setConversations, setMessages, messages: coversationMessages } = useStore();

    const handleNewMessage = useCallback((data: unknown) => {
        const message = (data as Message);
        console.log("Mesage arrived: ", message)
        if (activeConversation) {
            const updatedConversations = conversations?.map(conv => {
                if (conv.id === message.conversationId) {
                    return {
                        ...conv,
                        lastMessage: message
                    } as Conversation
                }

                return conv
            })

            setConversations(updatedConversations!)
            const updatedActiveConversation = updatedConversations?.find(conv => conv.id === activeConversation.id)
            if (updatedActiveConversation) {
                setActiveConversation(updatedActiveConversation)
            }

            // Update the messages
            const messages = coversationMessages.get(activeConversation.id) as Message[]
            const updatedMessages: Message[] = [message, ...messages]
            setMessages(activeConversation.id, updatedMessages)
        }

    }, [activeConversation, conversations, coversationMessages, setActiveConversation, setConversations, setMessages]);

    useEffect(() => {
        ws.connect()

        ws.on(WebSocketEvents.NEW_MESSAGE, handleNewMessage)

        // Remove old listensers
        return () => {
            ws.off(WebSocketEvents.NEW_MESSAGE)
        }
    }, [handleNewMessage])
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

        if(inputRef.current) inputRef.current.value = ""
    }
    return <div className="absolute z-50 bottom-0 p-2 border-t flex items-center gap-2 bg-secondary w-full">
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
                className="w-full px-4 py-2 bg-primary-foreground rounded-full border border-muted-foreground outline-none font-thin"
                type="text"
                placeholder="Type a message..."
            />
            <Button
                onClick={() => {
                    // Handle send message
                }}
                size="icon"
                className="rounded-full"
            >
                <SendHorizontal />
            </Button>
        </form>
    </div>
}