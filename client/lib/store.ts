import { create } from "zustand";
import { ConnectionStatus, Conversation, Message, MetaData, User } from "./index.types";
import { dedupeById, byCreatedAtAsc } from "./utils";

// Enhanced store type with better organization
export type Store = {
    // User state
    user: User | null;
    setUser: (newUser: User | null) => void;

    // Conversations state
    conversations: Conversation[] | null;
    setConversations: (newConversations: Conversation[] | null) => void;

    // Active conversation state
    activeConversation: Conversation | null;
    setActiveConversation: (conversation: Conversation | null) => void;

    // Messages state - organized by conversation ID
    messages: Map<string, Message[]>;
    setMessages: (
        convId: string,
        updater: Message[] | ((prev: Message[]) => Message[])
    ) => void;

    // Add a single message (optimized for real-time updates)
    addMessage: (message: Message) => void;

    // Clear messages for a conversation
    clearMessages: (convId: string) => void;

    // Messages metadata state
    messagesMeta: Map<string, MetaData>;
    setMessagesMeta: (conversationId: string, metadata: MetaData) => void;

    // UI state for better UX
    uiState: {
        isTyping: Map<string, string[]>; // conversationId -> array of user IDs typing
        unreadCounts: Map<string, number>; // conversationId -> unread count
    };
    setTypingUsers: (conversationId: string, userIds: string[]) => void;
    setUnreadCount: (conversationId: string, count: number) => void;
    incrementUnreadCount: (conversationId: string) => void;
    clearUnreadCount: (conversationId: string) => void;
    connectionStatus: ConnectionStatus;
    setConnectionStatus: (status: Partial<Store["connectionStatus"]>) => void;
};

export const useStore = create<Store>((set, get) => ({
    // User state
    user: null,
    setUser: (newUser: User | null) => set(() => ({ user: newUser })),

    // Conversations state
    conversations: null,
    setConversations: (newConversations: Conversation[] | null) =>
        set(() => ({ conversations: newConversations })),

    // Active conversation state
    activeConversation: null,
    setActiveConversation: (conversation: Conversation | null) => {
        set(() => ({ activeConversation: conversation }));

        // Clear unread count when opening a conversation
        if (conversation) {
            get().clearUnreadCount(conversation.id);
        }
    },

    // Messages state with improved performance
    messages: new Map<string, Message[]>(),
    setMessages: (convId, updater) =>
        set((state) => {
            const prev = state.messages.get(convId) ?? [];
            const next = typeof updater === "function" ? updater(prev) : updater;

            const newMap = new Map(state.messages);
            newMap.set(convId, next);
            return { messages: newMap };
        }),

    // Optimized method for adding single messages (real-time)
    addMessage: (message: Message) =>
        set((state) => {
            const convId = message.conversationId;
            const currentMessages = state.messages.get(convId) ?? [];

            // Check if message already exists to prevent duplicates
            const messageExists = currentMessages.some(msg => msg.id === message.id);
            if (messageExists) return state;

            // Add message and sort properly
            const newMessages = dedupeById([...currentMessages, message]).sort(byCreatedAtAsc);
            const newMap = new Map(state.messages);
            newMap.set(convId, newMessages);

            // Increment unread count if not in active conversation and not from current user
            const isActiveConversation = state.activeConversation?.id === convId;
            const isFromCurrentUser = message.senderId === state.user?.id;

            let newUiState = state.uiState;
            if (!isActiveConversation && !isFromCurrentUser) {
                const currentUnread = state.uiState.unreadCounts.get(convId) ?? 0;
                newUiState = {
                    ...state.uiState,
                    unreadCounts: new Map(state.uiState.unreadCounts).set(convId, currentUnread + 1),
                };
            }

            return {
                messages: newMap,
                uiState: newUiState
            };
        }),

    // Clear messages for a conversation
    clearMessages: (convId: string) =>
        set((state) => {
            const newMap = new Map(state.messages);
            newMap.delete(convId);

            // Also clear metadata for this conversation
            const newMeta = new Map(state.messagesMeta);
            newMeta.delete(convId);

            return {
                messages: newMap,
                messagesMeta: newMeta
            };
        }),

    // Messages metadata
    messagesMeta: new Map<string, MetaData>(),
    setMessagesMeta: (conversationId: string, metadata: MetaData) =>
        set((state) => {
            const updatedMetadata = new Map(state.messagesMeta);
            updatedMetadata.set(conversationId, metadata);
            return { messagesMeta: updatedMetadata };
        }),

    // UI state for better user experience
    uiState: {
        isTyping: new Map<string, string[]>(),
        unreadCounts: new Map<string, number>(),
    },

    setTypingUsers: (conversationId: string, userIds: string[]) =>
        set((state) => ({
            uiState: {
                ...state.uiState,
                isTyping: new Map(state.uiState.isTyping).set(conversationId, userIds),
            },
        })),

    setUnreadCount: (conversationId: string, count: number) =>
        set((state) => ({
            uiState: {
                ...state.uiState,
                unreadCounts: new Map(state.uiState.unreadCounts).set(conversationId, count),
            },
        })),

    incrementUnreadCount: (conversationId: string) =>
        set((state) => {
            const currentCount = state.uiState.unreadCounts.get(conversationId) ?? 0;
            return {
                uiState: {
                    ...state.uiState,
                    unreadCounts: new Map(state.uiState.unreadCounts).set(conversationId, currentCount + 1),
                },
            };
        }),

    clearUnreadCount: (conversationId: string) =>
        set((state) => ({
            uiState: {
                ...state.uiState,
                unreadCounts: new Map(state.uiState.unreadCounts).set(conversationId, 0),
            },
        })),

    connectionStatus: {
        isConnected: false,
        isReconnecting: false,
        error: null,
        lastConnectedAt: null,
    },

    setConnectionStatus: (status) =>
        set((state) => ({
            connectionStatus: { ...state.connectionStatus, ...status },
        })),
}));