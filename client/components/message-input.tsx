import {
  Plus,
  SendHorizontal,
  Smile,
  Mic} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { WebSocketEvents, ws } from "@/lib/ws";
import { FormEvent, useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { AttachmentPreview, MessageType } from "@/lib/index.types";
import { useSound } from "react-sounds";
import { cn } from "@/lib/utils";
import { useTypingIndicator } from "@/hooks/use-typing";
import { useVoiceRecording } from "@/hooks/use-recording";
import { AttachmentPreviewComponent } from "./attachement-preview";
import { AttachmentMenu } from "./attachement-menu";
import { VoiceRecordingInterface } from "./voice-recording";

interface MessageInputProps {
  disabled?: boolean;
  isReconnecting?: boolean;
}

// Main component
export function MessageInput({
  disabled = false,
  isReconnecting = false,
}: Readonly<MessageInputProps>) {
  const { play } = useSound("notification/popup");

  // State management
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  const {
    activeConversation,
  } = useStore();


  // Custom hooks
  const { handleTypingStart, handleTypingStop } = useTypingIndicator(() => {}, () => {});
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording
  } = useVoiceRecording();

  // Handle input changes with typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (value.trim() && !disabled) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }
  };

  // Handle form submission
  const handleSubmit = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    if (disabled || isReconnecting) {
      toast.error("Cannot send message while disconnected");
      return;
    }

    if (!activeConversation) {
      toast.error("No conversation selected");
      return;
    }

    const trimmedMessage = message.trim();
    const hasAttachments = attachments.length > 0;

    if (!trimmedMessage && !hasAttachments) {
      toast.error("Message cannot be empty!");
      return;
    }

    try {
      // Send text message if there's content
      if (trimmedMessage) {
        const success = ws.send(WebSocketEvents.NEW_MESSAGE, {
          conversationId: activeConversation.id,
          content: trimmedMessage,
          type: MessageType.TEXT,
        });

        if (!success) {
          throw new Error("Failed to send message");
        }
      }

      // Handle attachments (placeholder for now)
      if (hasAttachments) {
        toast.info("File upload feature coming soon!");
        // Implement file upload logic here
      }

      // Reset form
      setMessage("");
      setAttachments([]);
      handleTypingStop();

      // Play sound and focus input
      play();
      inputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  // Handle file selection
  const handleFileSelect = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 11);
      const isImage = file.type.startsWith("image/");

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachments((prev) => [
            ...prev,
            { id, file, type: "image", preview: e.target?.result as string },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        // Directly add documents
        setAttachments((prev) => [
          ...prev,
          { id, file, type: "document" },
        ]);
      }
    });
  };

  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  // Handle emoji selection (placeholder)
  const handleEmojiClick = () => {
    setShowEmojiPicker(!showEmojiPicker);
    // Implement emoji picker
    toast.info("Emoji picker coming soon!");
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRecording) {
          cancelRecording();
        } else {
          setShowAttachmentMenu(false);
          setShowEmojiPicker(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, cancelRecording]);

  const isDisabled = disabled || isReconnecting || !activeConversation;
  const canSend = (message.trim() || attachments.length > 0) && !isDisabled;

  return (
    <div className="w-full border-t bg-background/80 backdrop-blur-sm">
      <AttachmentPreviewComponent attachments={attachments} onRemove={removeAttachment} />

      <div className="px-3 py-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Attachment button with menu */}
          <div className="relative" ref={attachmentMenuRef}>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={isDisabled || isRecording}
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className={cn(
                "rounded-full hover:bg-muted transition-all",
                showAttachmentMenu && "bg-muted"
              )}
            >
              <Plus className="h-5 w-5" />
            </Button>

            <AttachmentMenu
              isOpen={showAttachmentMenu}
              onClose={() => setShowAttachmentMenu(false)}
              onFileSelect={handleFileSelect}
            />
          </div>

          {/* Voice recording interface or input */}
          {isRecording ? (
            <VoiceRecordingInterface
              recordingTime={recordingTime}
              onStop={stopRecording}
              onCancel={cancelRecording}
            />
          ) : (
            <>
              {/* Emoji picker button */}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={isDisabled}
                onClick={handleEmojiClick}
                className="rounded-full hover:bg-muted"
              >
                <Smile className="h-5 w-5" />
              </Button>

              {/* Message input */}
              <Input
                ref={inputRef}
                value={message}
                onChange={handleInputChange}
                onBlur={handleTypingStop}
                placeholder={
                  isDisabled
                    ? "Cannot send messages while offline..."
                    : "Type a message..."
                }
                disabled={isDisabled}
                className="flex-1 rounded-3xl bg-muted px-4 py-2 text-sm focus-visible:ring-primary/50 disabled:opacity-60"
                maxLength={4096}
              />
            </>
          )}

          {/* Send or Voice button */}
          {!isRecording && (
            <>
              {canSend ? (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!canSend}
                  className="rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <SendHorizontal className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={isDisabled}
                  onClick={startRecording}
                  className="rounded-full hover:bg-muted transition-all hover:scale-105"
                >
                  <Mic className="h-5 w-5" />
                </Button>
              )}
            </>
          )}
        </form>

        {/* Status indicators */}
        {isReconnecting && (
          <div className="text-center mt-1">
            <span className="text-xs text-muted-foreground">
              Reconnecting... Messages will be sent once connected.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}