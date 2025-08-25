"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { apiClient, isAxiosError } from "@/lib/axios";
import { ws, WebSocketEvents } from "@/lib/ws";
import { Message, MetaData } from "@/lib/index.types";
import { dedupeById, byCreatedAtAsc } from "@/lib/utils";
import { ArrowBigDown, LoaderIcon, WifiOff, RefreshCw } from "lucide-react";
import { DateTime } from "luxon";
import { MessageBubble } from "./message-bubble";

interface ScrollState {
  isNearBottom: boolean;
  isNearTop: boolean;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

interface FetchState {
  isFetching: boolean;
  lastFetchTime: number;
  fetchCooldown: number;
  hasMoreMessages: boolean;
  retryCount: number;
  maxRetries: number;
}

export function MessagesWindow() {
  const {
    activeConversation,
    user,
    messages,
    setMessages,
    messagesMeta,
    setMessagesMeta,
    addMessage,
    clearMessages,
    uiState,
    setTypingUsers,
  } = useStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const prevConversationIdRef = useRef<string | null>(null);
  const scrollRestoreRef = useRef<number | null>(null);
  const fetchAbortControllerRef = useRef<AbortController | null>(null);

  // Enhanced state management
  const [fetchState, setFetchState] = useState<FetchState>({
    isFetching: false,
    lastFetchTime: 0,
    fetchCooldown: 1000, // 1 second cooldown between fetches
    hasMoreMessages: true,
    retryCount: 0,
    maxRetries: 3,
  });

  const [scrollState, setScrollState] = useState<ScrollState>({
    isNearBottom: true,
    isNearTop: false,
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
  });

  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [unreadCount, setUnreadCount] = useState(0);

  const activeConversationId = activeConversation?.id ?? null;
  const currentMessages = activeConversationId ? messages.get(activeConversationId) ?? [] : [];
  const currentMeta = activeConversationId ? messagesMeta.get(activeConversationId) ?? null : null;

  // Enhanced fetch messages with better error handling and optimization
  const fetchMessages = useCallback(
    async (page: number, opts?: { 
      scrollBottom?: boolean; 
      maintainScroll?: boolean;
      force?: boolean;
    }) => {
      if (!activeConversationId) return;

      const now = Date.now();
      const { lastFetchTime, fetchCooldown, isFetching, hasMoreMessages, retryCount, maxRetries } = fetchState;

      // Prevent duplicate/rapid fetches unless forced
      if (!opts?.force && (
        isFetching || 
        !hasMoreMessages || 
        (now - lastFetchTime < fetchCooldown) ||
        retryCount >= maxRetries
      )) {
        return;
      }

      // Cancel any ongoing fetch
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      fetchAbortControllerRef.current = abortController;

      try {
        setFetchState(prev => ({ 
          ...prev, 
          isFetching: true, 
          lastFetchTime: now 
        }));

        // Use axios with proper request cancellation
        const { data: res } = await apiClient.get<{ data: Message[]; meta: MetaData }>(
          `/conversations/${activeConversationId}/messages?page=${page}`,
          { 
            signal: abortController.signal,
            timeout: 30000 // 30 second timeout
          } as any
        );

        // Check if we have more messages to fetch
        const hasMore = page < res.meta.pages;
        
        setMessages(activeConversationId, (prev = []) => {
          const combined = page === 1 ? res.data : [...res.data, ...prev];
          return dedupeById(combined).sort(byCreatedAtAsc);
        });

        setMessagesMeta(activeConversationId, res.meta);
        
        setFetchState(prev => ({
          ...prev,
          isFetching: false,
          hasMoreMessages: hasMore,
          retryCount: 0, // Reset retry count on success
        }));

        // Enhanced scroll management
        setTimeout(() => {
          const el = containerRef.current;
          if (!el) return;

          if (opts?.scrollBottom) {
            el.scrollTop = el.scrollHeight;
            setUnreadCount(0);
          } else if (opts?.maintainScroll && page > 1) {
            // More precise scroll restoration
            const newScrollTop = el.scrollHeight - prevScrollHeightRef.current;
            el.scrollTop = newScrollTop;
            scrollRestoreRef.current = newScrollTop;
          }
        }, 10); // Reduced timeout for better UX

      } catch (error) {
        if (abortController.signal.aborted) return; // Ignore aborted requests
        
        console.error('Failed to fetch messages:', error);
        
        // Use your custom error handling
        if (isAxiosError(error)) {
          const axiosError = error as any;
          const status = axiosError.response?.status;
          
          if (status === 401) {
            // Handle unauthorized - maybe redirect to login
            console.error('Unauthorized access to messages');
          } else if (status === 404) {
            // Conversation not found
            console.error('Conversation not found');
            setFetchState(prev => ({ ...prev, hasMoreMessages: false }));
            return;
          } else if (status >= 500) {
            // Server error
            setConnectionStatus('disconnected');
          }
        }
        
        setFetchState(prev => ({
          ...prev,
          isFetching: false,
          retryCount: prev.retryCount + 1,
        }));

        // Show connection status if multiple failures
        if (fetchState.retryCount >= 2) {
          setConnectionStatus('disconnected');
        }
      }
    },
    [activeConversationId, setMessages, setMessagesMeta, fetchState]
  );

  // Enhanced scroll handler with better performance and logic
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || !currentMeta) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    
    const newScrollState: ScrollState = {
      scrollTop,
      scrollHeight,
      clientHeight,
      isNearBottom: scrollTop + clientHeight >= scrollHeight - 100,
      isNearTop: scrollTop <= 100,
    };

    setScrollState(newScrollState);

    // Show scroll-to-bottom button logic
    const shouldShowScrollButton = scrollTop + clientHeight < scrollHeight - 200;
    setShowScrollToBottom(shouldShowScrollButton);

    // Count unread messages when not at bottom
    if (!newScrollState.isNearBottom && shouldShowScrollButton) {
      // This would be enhanced with actual unread logic from your store
      // setUnreadCount(prev => prev);
    } else if (newScrollState.isNearBottom) {
      setUnreadCount(0);
    }

    // Load older messages when near top
    if (newScrollState.isNearTop && 
        !fetchState.isFetching && 
        fetchState.hasMoreMessages && 
        currentMeta.currPage < currentMeta.pages) {
      prevScrollHeightRef.current = scrollHeight;
      fetchMessages(currentMeta.currPage + 1, { maintainScroll: true });
    }
  }, [currentMeta, fetchState, fetchMessages]);

  // Optimized scroll handler with throttling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let timeoutId: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 16); // ~60fps throttling
    };

    el.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', throttledScroll);
      clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  // Enhanced scroll to bottom with better UX
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = containerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior });
      setShowScrollToBottom(false);
      setUnreadCount(0);
    }
  }, []);

  // Retry failed fetch
  const retryFetch = useCallback(() => {
    if (!currentMeta) return;
    setFetchState(prev => ({ ...prev, retryCount: 0 }));
    setConnectionStatus('reconnecting');
    fetchMessages(currentMeta.currPage + 1, { maintainScroll: true, force: true });
  }, [currentMeta, fetchMessages]);

  // Reset when conversation changes with better loading states
  useEffect(() => {
    if (!activeConversationId) return;
    
    if (prevConversationIdRef.current !== activeConversationId) {
      // Cancel any ongoing fetch
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }

      clearMessages(activeConversationId);
      setFetchState({
        isFetching: false,
        lastFetchTime: 0,
        fetchCooldown: 1000,
        hasMoreMessages: true,
        retryCount: 0,
        maxRetries: 3,
      });
      setUnreadCount(0);
      setConnectionStatus('connected');
      
      
      fetchMessages(1, { scrollBottom: true });
      prevConversationIdRef.current = activeConversationId;
    }
  }, [activeConversationId, fetchMessages, clearMessages]);

  // Enhanced WebSocket handling with connection status
  useEffect(() => {
    if (!activeConversationId) return;

    const handleNewMessage = (msg: Message) => {
      addMessage(msg);
      
      // If not at bottom, increment unread count
      if (!scrollState.isNearBottom) {
        setUnreadCount(prev => prev + 1);
      } else {
        // Auto scroll to new message if near bottom
        setTimeout(() => scrollToBottom(), 100);
      }
    };

    const handleTypingStart = (p: { conversationId: string; userId: string }) => {
      if (p.conversationId !== activeConversationId) return;
      const currentTyping = uiState.isTyping.get(p.conversationId) ?? [];
      if (!currentTyping.includes(p.userId)) {
        setTypingUsers(p.conversationId, [...currentTyping, p.userId]);
      }
    };

    const handleTypingStop = (p: { conversationId: string; userId: string }) => {
      if (p.conversationId !== activeConversationId) return;
      const currentTyping = uiState.isTyping.get(p.conversationId) ?? [];
      setTypingUsers(p.conversationId, currentTyping.filter(id => id !== p.userId));
    };

    const handleConnect = () => setConnectionStatus('connected');
    const handleDisconnect = () => setConnectionStatus('disconnected');
    const handleReconnecting = () => setConnectionStatus('reconnecting');

    ws.on(WebSocketEvents.NEW_MESSAGE, handleNewMessage);
    ws.on(WebSocketEvents.TYPING_START, handleTypingStart);
    ws.on(WebSocketEvents.TYPING_STOP, handleTypingStop);
    ws.on('connect', handleConnect);
    ws.on('disconnect', handleDisconnect);
    ws.on('reconnecting', handleReconnecting);

    return () => {
      ws.off(WebSocketEvents.NEW_MESSAGE, handleNewMessage);
      ws.off(WebSocketEvents.TYPING_START, handleTypingStart);
      ws.off(WebSocketEvents.TYPING_STOP, handleTypingStop);
      ws.off('connect', handleConnect);
      ws.off('disconnect', handleDisconnect);
      ws.off('reconnecting', handleReconnecting);
    };
  }, [activeConversationId, addMessage, setTypingUsers, uiState.isTyping, scrollState.isNearBottom, scrollToBottom]);

  // Enhanced message rendering with better performance
  const renderMessages = useCallback(() => {
    const items: React.ReactNode[] = [];
    let lastDate: string | null = null;

    currentMessages.forEach((msg, i) => {
      const date = DateTime.fromJSDate(new Date(msg.createdAt)).toISODate();
      
      // Date separator with better styling
      if (date !== lastDate) {
        const dateLabel = DateTime.fromISO(date!);
        const isToday = dateLabel.hasSame(DateTime.now(), 'day');
        const isYesterday = dateLabel.hasSame(DateTime.now().minus({ days: 1 }), 'day');
        
        let dateString;
        if (isToday) dateString = 'Today';
        else if (isYesterday) dateString = 'Yesterday';
        else dateString = dateLabel.toLocaleString(DateTime.DATE_MED);

        items.push(
          <div key={`date-${date}`} className="flex justify-center my-4 sticky top-2 z-10">
            <span className="bg-card text-card-foreground px-4 py-2 rounded-full text-sm font-medium shadow-sm border border-border">
              {dateString}
            </span>
          </div>
        );
        lastDate = date;
      }

      const prev = i > 0 ? currentMessages[i - 1] : null;
      const next = i < currentMessages.length - 1 ? currentMessages[i + 1] : null;
      const isMine = msg.sender.id === user?.id;
      const showAvatar = !isMine && (!prev || prev.sender.id !== msg.sender.id || 
        DateTime.fromJSDate(new Date(msg.createdAt)).diff(
          DateTime.fromJSDate(new Date(prev.createdAt)), 'minutes'
        ).minutes > 5);
      const showTimestamp = !prev ||
        DateTime.fromJSDate(new Date(msg.createdAt)).diff(
          DateTime.fromJSDate(new Date(prev.createdAt)), 'minutes'
        ).minutes > 5;
      const isLastInGroup = !next || next.sender.id !== msg.sender.id ||
        DateTime.fromJSDate(new Date(next.createdAt)).diff(
          DateTime.fromJSDate(new Date(msg.createdAt)), 'minutes'
        ).minutes > 5;

      items.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          isMine={isMine}
          showAvatar={showAvatar}
          showTimestamp={showTimestamp}
          isLastInGroup={isLastInGroup}
        />
      );
    });

    return items;
  }, [currentMessages, user?.id]);

  const typingUsers = uiState.isTyping.get(activeConversationId!)?.filter(id => id !== user?.id) ?? [];

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Welcome to Chat
          </h2>
          <p className="text-muted-foreground max-w-md">
            Select a conversation to start chatting, or create a new one to connect with your contacts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative bg-background">
      {/* Connection Status Bar */}
      {connectionStatus !== 'connected' && (
        <div className={`w-full px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
          connectionStatus === 'disconnected' 
            ? 'bg-destructive/10 text-destructive' 
            : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300'
        }`}>
          <div className="flex items-center justify-center gap-2">
            {connectionStatus === 'reconnecting' ? (
              <LoaderIcon className="w-4 h-4 animate-spin" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            {connectionStatus === 'disconnected' ? 'No internet connection' : 'Reconnecting...'}
            {connectionStatus === 'disconnected' && (
              <button onClick={retryFetch} className="ml-2 underline hover:no-underline">
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 w-full overflow-y-auto scroll-smooth"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
        }}
      >
        {/* Enhanced loader at top */}
        {fetchState.isFetching && currentMessages.length > 0 && (
          <div className="sticky top-0 flex justify-center py-3 gap-2 bg-background/80 backdrop-blur-sm z-20 border-b border-border">
            <LoaderIcon className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading older messages...</span>
          </div>
        )}

        {/* Retry button for failed fetches */}
        {!fetchState.isFetching && fetchState.retryCount >= fetchState.maxRetries && fetchState.hasMoreMessages && (
          <div className="flex justify-center py-3">
            <button
              onClick={retryFetch}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry loading messages
            </button>
          </div>
        )}

        {/* No more messages indicator */}
        {!fetchState.hasMoreMessages && currentMessages.length > 0 && (
          <div className="flex justify-center py-4">
            <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-secondary">
              Beginning of conversation
            </span>
          </div>
        )}

        <div className="px-4 py-2 space-y-1">
          {renderMessages()}
        </div>

        {/* Enhanced typing indicator */}
        {typingUsers.length > 0 && (
          <div key="typing" className="flex items-start gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0"></div>
            <div className="flex items-center space-x-1 bg-secondary px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]"></span>
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom spacer for better UX */}
        <div className="h-4"></div>
      </div>

      {/* Enhanced scroll to bottom button */}
      {showScrollToBottom && (
        <button
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-6 right-6 bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 z-30 group"
        >
          <ArrowBigDown className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}