import { useStore } from "@/lib/store";
import { WebSocketEvents, ws } from "@/lib/ws";
import { useCallback, useEffect, useRef } from "react";

// Custom hooks
export const useTypingIndicator = (onTypingStart?: () => void, onTypingStop?: () => void) => {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const { activeConversation } = useStore();

  const handleTypingStart = useCallback(() => {
    if (!isTypingRef.current && activeConversation && ws.isConnected()) {
      isTypingRef.current = true;
      onTypingStart?.();
      ws.send(WebSocketEvents.TYPING_START, {
        conversationId: activeConversation.id,
      });
    }

    // Reset the timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  }, [activeConversation, onTypingStart]);

  const handleTypingStop = useCallback(() => {
    if (isTypingRef.current && activeConversation && ws.isConnected()) {
      isTypingRef.current = false;
      onTypingStop?.();
      ws.send(WebSocketEvents.TYPING_STOP, {
        conversationId: activeConversation.id,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [activeConversation, onTypingStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return { handleTypingStart, handleTypingStop };
};