export enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  FILE = "FILE"
}

export type User = {
  id: string
  name: string
  email: string
  verified: boolean
  online: boolean
  lastSeen: Date
  createdAt: Date
  updatedAt: Date
  avatarUrl: string
  ownerId: string
}

export type Conversation = {
  id: string
  isGroup: boolean
  name: string | null
  createdAt: Date
  updatedAt: Date
  lastMessage: Message | null
  participants: User[]
  avatarUrl: string
  ownerId: string
}

export type Message = {
  id: string
  content: string | null
  type: MessageType
  mediaUrl: string | null
  senderId: string
  conversationId: string
  createdAt: Date
}

export type Contact = {
  id: string
  ownerId: string
  contactId: string
  nickname: string | null
  blocked: boolean
  createdAt: Date
}

export type Store = {
  user: User | null;
  setUser: (newUser: User | null) => void;

  conversations: Conversation[] | null;
  setConversations: (newConversations: Conversation[] | null) => void;

  activeConversation: Conversation | null;
  setActiveConversation: (conversation: Conversation | null) => void;

  messages: Map<string, Message[]>
  setMessages: (conversationId: string, messages: Message[]) => void

};

