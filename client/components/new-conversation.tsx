'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';

import { useStore } from '@/lib/store';
import { apiClient, AxiosErrorResponse, isAxiosError } from '@/lib/axios';
import { Conversation, User } from '@/lib/index.types';
import { AppPagination } from './pagination';
import { toast } from 'sonner';

export interface ConversationUser {
  id: string;
  userId: string;
  conversationId: string;
  joinedAt: string;
  isMuted: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ConversationData {
  id: string;
  isGroup: boolean;
  name: string;
  createdAt: string;
  updatedAt: string;
  avatarUrl: string | null;
  ownerId: string;
  participants: ConversationUser[];
}

export interface CreateConversationResponse {
  message: string;
  data: ConversationData;
}

interface NewChatModalProps {
  trigger: React.ReactNode;
}

interface NewGroupModalProps {
  trigger: React.ReactNode;
}

// Helper: fetch paginated users
const fetchPaginatedUsers = async (page: number, limit: number = 20) => {
  const { data } = await apiClient.get<{ data: User[]; meta: { total: number; pages: number; currPage: number } }>(
    `/users?page=${page}&limit=${limit}`
  );
  return data;
};

function mapApiToConversation(res: CreateConversationResponse): Conversation {
  const data = res.data;

  const participants: User[] = data.participants.map(p => ({
    id: p.user.id,
    name: p.user.name,
    email: p.user.email,
    avatarUrl: '',
    online: false, // default, update if you have presence info
    verified: true, // assume true for participants
    lastSeen: new Date(), // or fetch if you have
    createdAt: new Date(), // optional if available
    updatedAt: new Date(), // optional if available
  }))

  const conversation: Conversation = {
    id: data.id,
    isGroup: data.isGroup,
    name: data.name,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    lastMessage: null, // fetch separately if needed
    participants,
    avatarUrl: data.avatarUrl ?? '',
    ownerId: data.ownerId,
  } as Conversation

  return conversation;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ trigger }) => {
  const { user: currentUser, setActiveConversation } = useStore();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 20;

  const fetchUsers = async (pageNum: number) => {
    try {
      const res = await fetchPaginatedUsers(pageNum, PAGE_SIZE);
      setUsers(res.data);
      setTotalPages(res.meta.pages);
      setPage(res.meta.currPage);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (open) fetchUsers(1);
  }, [open]);

  const handleUserSelect = (user: User) => {
    setSelectedUsers(prev => prev.some(u => u.id === user.id) ? [] : [user]);
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length !== 1) return;

    setLoading(true);
    try {
      const { data: res } = await apiClient.post<CreateConversationResponse>("/conversations", {
        isGroup: false,
        participants: [selectedUsers[0].id, currentUser?.id ?? ''],
      });

      setOpen(false);
      setSelectedUsers([]);
      setSearchTerm('');

      setActiveConversation(mapApiToConversation(res))
    } catch (err) {
      if (isAxiosError(err)) {
        // You can handle err.response here if needed
        const errorMessage =
          (err.response as AxiosErrorResponse).data.error ||
          "An error occurred during creating chat.";
        toast.error(errorMessage);
      } else {
        toast.error("Something went wrong. Please try again later.");
      }
      console.error("Error during signup:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>New Chat</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredUsers.map(user => (
              currentUser!.id !== user.id &&
              <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors" onClick={() => handleUserSelect(user)}>
                <Checkbox checked={selectedUsers.some(u => u.id === user.id)} />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && <p className="text-center py-4 text-sm text-muted-foreground">No users found</p>}
          </div>

          {totalPages > 1 && <AppPagination currentPage={page} totalPages={totalPages} onPageChange={fetchUsers} />}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateChat} disabled={selectedUsers.length !== 1 || loading}>
              {loading ? 'Creating...' : 'Start Chat'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const NewGroupModal: React.FC<NewGroupModalProps> = ({ trigger }) => {
  const { user: currentUser, setActiveConversation } = useStore();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [selectedAdmins, setSelectedAdmins] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 20;

  const fetchUsers = async (pageNum: number) => {
    try {
      const res = await fetchPaginatedUsers(pageNum, PAGE_SIZE);
      setUsers(res.data);
      setPage(res.meta.currPage);
      setTotalPages(res.meta.pages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (open) fetchUsers(1);
  }, [open]);

  const handleUserSelect = (user: User) => {
    setSelectedUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      if (exists) {
        setSelectedAdmins(admins => admins.filter(a => a.id !== user.id));
        return prev.filter(u => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const handleAdminToggle = (user: User) => {
    setSelectedAdmins(prev => {
      const isAdmin = prev.some(a => a.id === user.id);
      return isAdmin ? prev.filter(a => a.id !== user.id) : [...prev, user];
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length < 2) return;

    setLoading(true);
    try {
      const { data: res } = await apiClient.post<CreateConversationResponse>("/conversations", {
        isGroup: true,
        name: groupName.trim(),
        participants: [...selectedUsers.map(u => u.id), currentUser?.id ?? ''],
        admins: [...selectedAdmins.map(a => a.id), currentUser?.id ?? ''],
      });
      setOpen(false);
      setGroupName('');
      setSelectedUsers([]);
      setSelectedAdmins([]);
      setSearchTerm('');

      setActiveConversation(mapApiToConversation(res))
    } catch (err) {
      if (isAxiosError(err)) {
        // You can handle err.response here if needed
        const errorMessage =
          (err.response as AxiosErrorResponse).data.error ||
          "An error occurred during creating chat.";
        toast.error(errorMessage);
      } else {
        toast.error("Something went wrong. Please try again later.");
      }
      console.error("Error during signup:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>New Group</DialogTitle></DialogHeader>

        <div className="space-y-4">

          <Input id="groupName" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Enter group name..." />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredUsers.map(user => (
              currentUser!.id !== user.id &&
              <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors">
                <Checkbox checked={selectedUsers.some(u => u.id === user.id)} onCheckedChange={() => handleUserSelect(user)} />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback>{user.name.split(' ').map((n: any) => n[0]).join('').toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                {selectedUsers.some(u => u.id === user.id) && (
                  <div className="flex items-center">
                    <Checkbox checked={selectedAdmins.some(a => a.id === user.id)} onCheckedChange={() => handleAdminToggle(user)} />
                    <Label className="ml-1 text-xs">Admin</Label>
                  </div>
                )}
              </div>
            ))}
            {filteredUsers.length === 0 && <p className="text-center py-4 text-sm text-muted-foreground">No users found</p>}
          </div>

          {totalPages > 1 && <AppPagination currentPage={page} totalPages={totalPages} onPageChange={fetchUsers} />}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup} disabled={!groupName.trim() || selectedUsers.length < 2 || loading}>
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};