import { apiClient, AxiosErrorResponse, isAxiosError } from "@/lib/axios";
import { useStore } from "@/lib/store";
import { useEffect } from "react";
import { toast } from "sonner";
import { ChatListItem } from "./chat-list-item";


export function ChatList() {
    const { conversations, setConversations } = useStore();
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const { data: res } = await apiClient.get("/conversations");
                if (typeof res === "object" && res !== null && "data" in res) {
                    const { data } = res;
                    if (Array.isArray(data)) {
                        setConversations(data);
                    }
                }
            } catch (error) {
                if (isAxiosError(error)) {
                    // You can handle error.response here if needed
                    const errorMessage =
                        (error.response as AxiosErrorResponse).data.error ||
                        "An error occurred during fetching conversations.";
                    toast.error(errorMessage);
                } else {
                    toast.error("Something went wrong. Please try again later.");
                }
                console.error("Error during fetching conversations:", error);
            }
        };

        fetchConversations();
    }, [setConversations]);


    return (
        <div className="flex flex-col overflow-y-auto h-screen">
            {conversations && conversations.length > 0 ? (
                conversations.map((conversation) => (
                    <ChatListItem
                        key={conversation.id}
                        conversation={conversation}
                    />
                ))
            ) : (
                <p>No conversations found.</p>
            )}
        </div>
    );
}