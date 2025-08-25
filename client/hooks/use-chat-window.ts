import { ConnectionStatus } from "@/lib/index.types";
import { useCallback, useEffect, useState } from "react";

// Custom hook for chat functionality
export const useChatWindow = (activeConversation: any, connectionStatus: ConnectionStatus) => {
  const [isTyping, setIsTyping] = useState(false);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!connectionStatus.isConnected) return;
    setIsTyping(true);
    setLastActivity(new Date());
  }, [connectionStatus.isConnected]);

  const handleTypingStop = useCallback(() => {
    setIsTyping(false);
  }, []);

  // Update last activity when conversation changes
  useEffect(() => {
    if (activeConversation) {
      setLastActivity(new Date());
    }
  }, [activeConversation]);

  return {
    isTyping,
    lastActivity,
    handleTypingStart,
    handleTypingStop,
  };
};