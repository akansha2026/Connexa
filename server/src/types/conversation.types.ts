export type CreateConversationPayload = {
  isGroup: boolean;
  name?: string;
  participants: string[]; // Array of user IDs
  admins?: string[]; // Array of user IDs for group conversations
};
