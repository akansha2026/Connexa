import { create } from "zustand"
import { Conversation, Message, MetaData, Store, User } from "./index.types"

export const useStore = create<Store>((set) => ({
    user: null,
    setUser: (newUser: User | null) => set(() => ({ user: newUser })),

    conversations: null,
    setConversations: (newConversations: Conversation[] | null) => set(() => ({ conversations: newConversations })),

    activeConversation: null,
    setActiveConversation: (conversation: Conversation | null) => set(() => ({ activeConversation: conversation })),

    messages: new Map<string, Message[]>(),
    setMessages: (conversationId: string, messages: Message[]) =>
        set((state) => {
            const updatedMessages = new Map(state.messages)
            updatedMessages.set(conversationId, messages)
            return { messages: updatedMessages }
        }),

    messagesMeta: new Map<string, MetaData>(),
    setMessagesMeta: (conversationId: string, metadata: MetaData) =>
        set((state) => {
            const updatedMetadata = new Map(state.messagesMeta)
            updatedMetadata.set(conversationId, metadata)
            return { messagesMeta: updatedMetadata }
        })

}))