export type User = {
  name: string;
  email: string;
  verified: string;
  id: string;
  avatarUrl: string;
  online: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type Store = {
  user: User | null;
  setUser: (newUser: User | null) => void;
};

