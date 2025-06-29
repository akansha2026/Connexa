import { useStore } from "@/lib/store";
import { useEffect } from "react";
import { apiClient } from "@/lib/axios";
import { Message } from "@/lib/index.types";
import { cn } from "@/lib/utils";
// import { apiClient } from "@/lib/axios";

export function MessagesWindow() {
    const { messages: conversationMessages, setMessages, activeConversation, user } = useStore()
    const messages = conversationMessages.get(activeConversation?.id as string)

    useEffect(() => {
        async function fetchMessages() {
            try {
                const { data: res } = await apiClient.get<{ message: string, data: Message[] }>(`/conversations/${activeConversation?.id}/messages`)
                setMessages(activeConversation?.id as string, res.data)
            } catch (error) {
                console.log(error)
            }
        }

        fetchMessages()
    }, [activeConversation?.id, setMessages])

    return (
        <div className="overflow-y-auto scrollbar-hide p-4 w-full flex-1 flex flex-col gap-2">
            {messages?.map(message => {
                return (
                    <div key={message.id} className={cn(
                        "px-4 py-2 rounded-xl text-sm max-w-md",
                        message.senderId === user?.id ? "bg-primary text-primary-foreground self-end" : "bg-secondary self-start border"
                    )}>{
                        <div > {message.content} </div>
                    }</div>
                )
            })}
        </div>

    );
}