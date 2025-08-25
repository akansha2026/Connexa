'use client';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserPlus, UserCheck, MessageSquare, MoreHorizontal, Loader2 } from 'lucide-react';
import { DateTime } from 'luxon';
import { User } from '@/app/discover/page';

interface UserCardProps {
    user: User;
    isContact: boolean;
    loading: boolean;
    onAddContact: (userId: string) => void;
    onRemoveContact: (userId: string) => void;
    onStartChat: (userId: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, isContact, loading, onAddContact, onRemoveContact, onStartChat }) => {
    const formatLastSeen = (lastSeen: string | null | undefined) => {
        if (!lastSeen) return 'Never';
        return `Last seen ${DateTime.fromISO(lastSeen).toRelative()}`;
    };
    return (
        <Card className="group hover:shadow-md transition-all duration-200 hover:border-primary/20">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="relative">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={user.avatarUrl!} alt={user.name} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                            {user.online && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground truncate">{user.name}</h3>
                                {user.verified && <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700">✓ Verified</Badge>}
                                {isContact && <Badge variant="outline" className="text-xs px-2 py-0.5">Contact</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground truncate mb-1">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                                {user.online ? <span className="text-green-600 font-medium">Online</span> : `Last seen ${formatLastSeen(user.lastSeen)}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isContact ? (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => onStartChat(user.id)}><MessageSquare className="h-4 w-4" /></Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onStartChat(user.id)}><MessageSquare className="h-4 w-4 mr-2" />Start Chat</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onRemoveContact(user.id)}>
                                            <UserCheck className="h-4 w-4 mr-2" />Remove Contact
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <Button size="sm" onClick={() => onAddContact(user.id)} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-2" />Add</>}
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};