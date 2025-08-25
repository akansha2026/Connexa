'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, UserCheck, RefreshCw, Loader2, SortAsc, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import { UserCard } from '@/components/user-card';
import { AppPagination } from '@/components/pagination';

const PAGE_SIZE = 20;

export interface User {
    id: string;
    name: string;
    email: string;
    verified: boolean;
    online: boolean;
    lastSeen: string | null;
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Contact {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    nickname: string | null;
    blocked: boolean;
    createdAt: string;
}

export interface PaginationMeta {
    total: number;
    pages: number;
    currPage: number;
}

export interface UsersResponse {
    message: string;
    data: User[];
    meta: PaginationMeta;
}

export interface ContactsResponse {
    message: string;
    data: Contact[];
    meta: PaginationMeta;
}

export default function UsersContactsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [usersMeta, setUsersMeta] = useState<PaginationMeta>({ total: 0, pages: 1, currPage: 1 });
    const [contactsMeta, setContactsMeta] = useState<PaginationMeta>({ total: 0, pages: 1, currPage: 1 });
    const [activeTab, setActiveTab] = useState<'users' | 'contacts'>('users');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [usersLoading, setUsersLoading] = useState(false);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [addContactLoading, setAddContactLoading] = useState<string | null>(null);

    const fetchUsers = async (page = 1) => {
        setUsersLoading(true);
        try {
            const { data } = await apiClient.get<UsersResponse>(`/users?page=${page}&limit=${PAGE_SIZE}`);
            setUsers(data.data);
            setUsersMeta(data.meta);
        } catch (err: unknown) {
            console.error(err);
            toast.error('Failed to fetch users');
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchContacts = async (page = 1) => {
        setContactsLoading(true);
        try {
            const { data } = await apiClient.get<ContactsResponse>(`/contacts?page=${page}&limit=${PAGE_SIZE}`);
            setContacts(data.data);
            setContactsMeta(data.meta);
        } catch (err: unknown) {
            console.error(err);
            toast.error('Failed to fetch contacts');
        } finally {
            setContactsLoading(false);
        }
    };

    const addContact = async (contactId: string) => {
        setAddContactLoading(contactId);
        try {
            await apiClient.post('/contacts', { contactId });
            toast.success('Contact added');
            await Promise.all([fetchUsers(usersMeta.currPage), fetchContacts(contactsMeta.currPage)]);
        } catch (err: unknown) {
            const error = (err as any)?.response?.data?.error;
            toast.error(error || 'Failed to add contact');
        } finally {
            setAddContactLoading(null);
        }
    };

    const removeContact = async (contactId: string) => {
        try {
            await apiClient.delete(`/contacts/${contactId}`);
            toast.success('Contact removed');
            await Promise.all([fetchUsers(usersMeta.currPage), fetchContacts(contactsMeta.currPage)]);
        } catch (err: unknown) {
            console.error(err);
            const error = (err as any)?.response?.data?.error;
            toast.error(error || 'Failed to remove contact');
        }
    };

    const startChat = async (userId: string) => {
        toast.info('Opening chat...');
        // Implement conversation navigation here
    };

    useEffect(() => {
        if (activeTab === 'users') fetchUsers(1);
        else fetchContacts(1);
    }, [activeTab]);

    const filteredUsers = useMemo(() => {
        const filtered = users.filter(u =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            const aValue = a[sortBy] ?? '';
            const bValue = b[sortBy] ?? '';
            return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        });
    }, [users, searchTerm, sortBy, sortOrder]);

    const filteredContacts = useMemo(() => {
        const filtered = contacts.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            const aValue = a[sortBy] ?? '';
            const bValue = b[sortBy] ?? '';
            return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        });
    }, [contacts, searchTerm, sortBy, sortOrder]);

    const isUserContact = (userId: string) => contacts.some(c => c.id === userId);

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">People</h1>
                        <p className="text-muted-foreground">Discover and connect with users</p>
                    </div>
                    <Button
                        onClick={() => activeTab === 'users' ? fetchUsers(usersMeta.currPage) : fetchContacts(contactsMeta.currPage)}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={sortBy} onValueChange={value => setSortBy(value as 'name' | 'email' | 'createdAt')}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="createdAt">Join Date</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                        {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as 'users' | 'contacts')}
                    className="space-y-6"
                >
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                        <TabsTrigger value="users" className="flex items-center gap-2">
                            <Users className="h-4 w-4" /> All Users ({usersMeta.total})
                        </TabsTrigger>
                        <TabsTrigger value="contacts" className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" /> My Contacts ({contactsMeta.total})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="space-y-6">
                        {usersLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <span className="ml-2">Loading users...</span>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-4">
                                    {filteredUsers.map(user => (
                                        <UserCard
                                            key={user.id}
                                            user={user}
                                            isContact={isUserContact(user.id)}
                                            onAddContact={addContact}
                                            onRemoveContact={removeContact}
                                            onStartChat={startChat}
                                            loading={addContactLoading === user.id}
                                        />
                                    ))}
                                </div>
                                {filteredUsers.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No users found</h3>
                                        <p>Try adjusting your search criteria</p>
                                    </div>
                                )}
                                {usersMeta.pages > 1 && (
                                    <AppPagination
                                        currentPage={usersMeta.currPage}
                                        totalPages={usersMeta.pages}
                                        onPageChange={fetchUsers}
                                    />
                                )}
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="contacts" className="space-y-6">
                        {contactsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <span className="ml-2">Loading contacts...</span>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-4">
                                    {filteredContacts.map(contact => (
                                        <UserCard
                                            key={contact.id}
                                            user={{
                                                ...contact,
                                                verified: true,
                                                online: false,
                                                lastSeen: null,
                                                updatedAt: contact.createdAt
                                            }}
                                            isContact
                                            onAddContact={addContact}
                                            onRemoveContact={removeContact}
                                            onStartChat={startChat}
                                            loading={false}
                                        />
                                    ))}
                                </div>
                                {filteredContacts.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <UserCheck className="h-12 w-12 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No contacts yet</h3>
                                        <p>Start by adding users from the &quot;All Users&quot; tab</p>
                                    </div>
                                )}
                                {contactsMeta.pages > 1 && (
                                    <AppPagination
                                        currentPage={contactsMeta.currPage}
                                        totalPages={contactsMeta.pages}
                                        onPageChange={fetchContacts}
                                    />
                                )}
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}