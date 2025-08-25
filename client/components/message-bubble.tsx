import { DateTime } from "luxon";
import { Message, MessageType } from "@/lib/index.types";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { useState, memo } from "react";
import Image from "next/image";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  isLastInGroup?: boolean;
}

// Message status enum - you might want to add this to your types
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

function MessageBubbleComponent({
  message,
  isMine,
  showAvatar,
  showTimestamp,
  isLastInGroup = false,
}: Readonly<MessageBubbleProps>) {
  const [imageError, setImageError] = useState(false);
  const [showFullTimestamp, setShowFullTimestamp] = useState(false);

  // Extract message status from your message object or determine based on your logic
  const getMessageStatus = (): MessageStatus => {
    // This is example logic - adapt based on your Message type structure
    if (message.status) return message.status as MessageStatus;
    if (message.readAt) return 'read';
    if (message.deliveredAt) return 'delivered';
    if (message.sentAt) return 'sent';
    return 'sending';
  };

  const messageStatus = getMessageStatus();

  // Render status icon for sent messages
  const renderStatusIcon = () => {
    if (!isMine) return null;

    const iconClass = "w-4 h-4";
    
    switch (messageStatus) {
      case 'sending':
        return <Clock className={`${iconClass} text-muted-foreground animate-pulse`} />;
      case 'failed':
        return <AlertCircle className={`${iconClass} text-destructive`} />;
      case 'sent':
        return <Check className={`${iconClass} text-muted-foreground`} />;
      case 'delivered':
        return <CheckCheck className={`${iconClass} text-muted-foreground`} />;
      case 'read':
        return <CheckCheck className={`${iconClass} text-primary`} />;
      default:
        return null;
    }
  };

  // Format timestamp with more options
  const formatTime = () => {
    const date = DateTime.fromJSDate(new Date(message.createdAt));
    const now = DateTime.now();
    
    if (showFullTimestamp) {
      return date.toFormat("MMM dd, yyyy 'at' HH:mm");
    }
    
    const diffInHours = now.diff(date, 'hours').hours;
    
    if (diffInHours < 24) {
      return date.toFormat("HH:mm");
    } else if (diffInHours < 24 * 7) {
      return date.toFormat("ccc HH:mm"); // Wed 14:30
    } else {
      return date.toFormat("MM/dd/yy");
    }
  };

  // Render user avatar
  const renderAvatar = () => {
    if (!showAvatar) return <div className="w-8 h-8" />; // Spacer

    const avatarSrc = message.sender.avatarUrl;
    const initials = message.sender.name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

    return (
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-background shadow-sm">
        {avatarSrc && !imageError ? (
          <Image
            src={avatarSrc}
            alt={message.sender.name || 'User'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-semibold">
            {initials}
          </div>
        )}
      </div>
    );
  };

  // Determine bubble styling based on position in group
  const getBubbleRadius = () => {
    const baseRadius = "rounded-2xl";
    
    if (isMine) {
      if (isLastInGroup) return "rounded-2xl rounded-br-md";
      return baseRadius;
    } else {
      if (isLastInGroup) return "rounded-2xl rounded-bl-md";
      return baseRadius;
    }
  };

  // Handle different message types
  const renderMessageContent = () => {
    // If message has attachments or special content types
    if (message.type === MessageType.IMAGE && message.mediaUrl) {
      return (
        <div className="space-y-2">
          <Image
            src={message.mediaUrl}
            alt="Shared image"
            className="max-w-full rounded-lg"
            onError={() => setImageError(true)}
          />
          {message.content && (
            <div className="text-sm">{message.content}</div>
          )}
        </div>
      );
    }

    if (message.type === MessageType.FILE && message.fileName) {
      return (
        <div className="flex items-center space-x-2 p-2 bg-secondary rounded-lg">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">📎</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{message.fileName}</div>
            {message.fileSize && (
              <div className="text-xs text-muted-foreground">{formatFileSize(message.fileSize)}</div>
            )}
          </div>
        </div>
      );
    }

    // Regular text message with link detection
    return (
      <div className="text-sm whitespace-pre-wrap break-words">
        {formatMessageContent(message.content!)}
      </div>
    );
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Simple link detection and formatting
  const formatMessageContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline text-primary/80 hover:text-primary transition-colors"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
      {/* Avatar for received messages */}
      {!isMine && (
        <div className="mr-2 flex flex-col justify-end">
          {renderAvatar()}
        </div>
      )}

      <div className={`max-w-[75%] sm:max-w-[60%] ${isMine ? 'ml-auto' : 'mr-auto'}`}>
        {/* Sender name for group chats */}
        {!isMine && showAvatar && message.sender.name && (
          <div className="text-xs text-muted-foreground ml-3 mb-1 font-medium">
            {message.sender.name}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`px-3 py-2 shadow-sm transition-all duration-200 hover:shadow-md ${getBubbleRadius()} ${
            isMine
              ? "bg-primary text-primary-foreground"
              : "bg-card text-card-foreground border border-border"
          } ${
            messageStatus === 'failed' ? 'ring-2 ring-destructive/50 bg-destructive/5 text-destructive-foreground' : ''
          }`}
        >
          {renderMessageContent()}

          {/* Timestamp and status row */}
          <div className="flex items-center justify-end mt-2 space-x-1">
            {/* Timestamp */}
            <button
              onClick={() => setShowFullTimestamp(!showFullTimestamp)}
              className={`text-[10px] ${
                isMine 
                  ? "text-primary-foreground/70 hover:text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              } transition-colors cursor-pointer`}
            >
              {formatTime()}
            </button>

            {/* Status icon */}
            {renderStatusIcon()}
          </div>
        </div>

        {/* Edited indicator */}
        {message.editedAt && (
          <div className={`text-[10px] text-muted-foreground mt-1 ${isMine ? 'text-right mr-3' : 'ml-3'}`}>
            edited
          </div>
        )}

        {/* Reactions (if you implement them) */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end mr-3' : 'ml-3'}`}>
            {message.reactions.map((reaction, index) => (
              <span
                key={index}
                className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs flex items-center space-x-1 hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                <span>{reaction.emoji}</span>
                <span className="text-[10px] text-muted-foreground">{reaction.count}</span>
              </span>
            ))}
          </div>
        )}

        {/* Show full timestamp when expanded */}
        {showTimestamp && (
          <div className={`text-[10px] text-muted-foreground mt-1 ${isMine ? 'text-right mr-3' : 'ml-3'}`}>
            {DateTime.fromJSDate(new Date(message.createdAt)).toFormat("MMM dd, yyyy 'at' HH:mm")}
            {message.sender.name && !isMine && (
              <span className="ml-2">• {message.sender.name}</span>
            )}
          </div>
        )}
      </div>

      {/* Spacer for sent messages to maintain alignment */}
      {isMine && <div className="w-10" />}
    </div>
  );
}

// Memoize component for better performance
export const MessageBubble = memo(MessageBubbleComponent);