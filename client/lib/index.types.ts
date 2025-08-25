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
  sender: User,
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  fileName?: string;
  fileSize?: number;
  editedAt?: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
  readAt?: string;
  deliveredAt?: string;
  sentAt?: string;
}

export type Contact = {
  id: string
  ownerId: string
  contactId: string
  nickname: string | null
  blocked: boolean
  createdAt: Date
}

export type MetaData = {
  total: number,
  pages: number,
  currPage: number
}

export interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
  lastConnectedAt: Date | null;
}

export interface AttachmentPreview {
  id: string;
  file: File;
  type: 'image' | 'document' | 'audio';
  preview?: string;
}