"use client";

import { ChatWindow } from "@/components/chat-windows";
import { NavigationBar } from "@/components/navigation-bar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { apiClient } from "@/lib/axios";
import { Conversation, Message, User } from "@/lib/index.types";
import { useStore } from "@/lib/store";
import { WebSocketEvents, ws } from "@/lib/ws";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useSound } from "react-sounds";

export default function HomePage() {
  const router = useRouter();
  const {play} = useSound("notification/notification")
  const { user, setUser, activeConversation, conversations, setActiveConversation, setConversations, setMessages, messages: coversationMessages } = useStore();
  
  const handleNewMessage = useCallback((data: unknown) => {
    const message = (data as Message);
    
    if(message.senderId !== user?.id) play()

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
      setActiveConversation({
        ...activeConversation,
        lastMessage: message
      })

      // Update the messages
      const messages = coversationMessages.get(activeConversation.id) as Message[]
      const updatedMessages: Message[] = [message, ...(messages ?? [])]
      setMessages(activeConversation.id, updatedMessages)
    }

  }, [activeConversation, conversations, coversationMessages, play, setActiveConversation, setConversations, setMessages, user?.id]);

  useEffect(() => {
    ws.on(WebSocketEvents.NEW_MESSAGE, handleNewMessage)

    // Remove old listensers
    return () => {
      ws.off(WebSocketEvents.NEW_MESSAGE)
    }
  }, [handleNewMessage])

  useEffect(() => {
    ws.connect()
    async function getUserFromToken() {
      try {
        const { data } = await apiClient.get("/auth/profile");
        if (typeof data === "object" && data !== null && "data" in data) {
          // You can further type-assert here if needed
          const userProfile = (data as { data: unknown }).data;

          // Save it as a global state for whole application
          setUser(userProfile as User);
        } else {
          throw new Error("User not found");
        }
      } catch (error) {
        console.log(error);
        router.push("/landing");
      }
    }
    getUserFromToken();
  }, [router, setUser]);

  return (
    <ResizablePanelGroup className="min-h-screen max-h-screen" direction="horizontal">
      <ResizablePanel defaultSize={25} minSize={25} maxSize={35}>
        <NavigationBar />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={75} maxSize={75} minSize={65}>
        <ChatWindow />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
