import { useStore } from "@/lib/store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/lib/axios";
import { Message, MessageType, MetaData } from "@/lib/index.types";
import { cn, formatTime } from "@/lib/utils";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import useDetectScroll from "@smakss/react-scroll-direction";
import { MoveDown } from "lucide-react";
import { BeatLoader } from "react-spinners";

export function MessagesWindow() {
    const [isLoading, setIsLoading] = useState(false);
    const [scrollButtonEnabled, setScrollButtonEnabled] = useState(false);

    const {
        setMessages,
        activeConversation,
        user,
        messages: conversationMessages,
        setMessagesMeta,
        messagesMeta,
    } = useStore();

    const containerRef = useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const prevMessagesRef = useRef<Message[]>([]);
    const { scrollDir } = useDetectScroll({ target: containerRef.current ?? window });

    const messages = useMemo(() => {
        const rawList = activeConversation?.id
            ? (conversationMessages.get(activeConversation.id) || [])
            : [];
        const seen = new Set<string>();
        return rawList
            .toReversed()
            .filter((msg) => {
                if (seen.has(msg.id)) return false;
                seen.add(msg.id);
                return true;
            });
    }, [activeConversation?.id, conversationMessages]);

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
    };

    const fetchMessages = useCallback(
        async (page = 1) => {
            if (!activeConversation) return;
            try {
                const container = containerRef.current;
                const prevScrollHeight = container?.scrollHeight ?? 0;

                setIsLoading(true);
                const { data: res } = await apiClient.get<{
                    message: string;
                    data: Message[];
                    meta: MetaData;
                }>(`/conversations/${activeConversation.id}/messages?page=${page}`);

                const existing = conversationMessages.get(activeConversation.id) ?? [];
                const merged = [...existing, ...res.data];
                const unique = Array.from(new Map(merged.map((m) => [m.id, m])).values());

                setMessages(activeConversation.id, unique);
                setMessagesMeta(activeConversation.id, res.meta);

                queueMicrotask(() => {
                    const container = containerRef.current;
                    if (container) {
                        const newScrollHeight = container.scrollHeight;
                        container.scrollTop += newScrollHeight - prevScrollHeight;
                    }
                });
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        },
        [activeConversation, conversationMessages, setMessages, setMessagesMeta]
    );

    useEffect(() => {
        if (!activeConversation) return;
        if (!messagesMeta.has(activeConversation.id)) {
            scrollToBottom(); // auto only
            fetchMessages();
        }
    }, [activeConversation, messagesMeta, fetchMessages]);

    useEffect(() => {
        const prev = prevMessagesRef.current;
        const current = messages;

        const isUserSentNew =
            current.length > prev.length &&
            current.at(-1)?.senderId === user?.id;

        if (isUserSentNew) {
            scrollToBottom(); // auto instead of smooth
        }

        prevMessagesRef.current = current;
    }, [messages, user?.id]);

    const handleScroll = () => {
        const container = containerRef.current;
        if (!container || !activeConversation) return;

        const meta = messagesMeta.get(activeConversation.id);
        const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;

        setScrollButtonEnabled(remaining >= 10);

        if (
            container.scrollTop <= 10 &&
            !isLoading &&
            meta &&
            meta.currPage < meta.pages &&
            scrollDir === "up"
        ) {
            fetchMessages(meta.currPage + 1);
        }
    };

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="overflow-y-auto scrollbar-hide p-4 w-full flex-1 flex flex-col gap-2"
        >
            {isLoading && <BeatLoader className="mx-auto" color="#006231" />}

            {messages.map((message) => (
                <motion.div
                    key={message.id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                        mass: 0.5,
                    }}
                    className={cn(
                        "px-3 py-2 rounded-xl text-sm max-w-md min-w-32 shadow-md",
                        message.senderId === user?.id
                            ? "bg-primary self-end border-secondary"
                            : "bg-secondary self-start"
                    )}
                >
                    {activeConversation?.isGroup &&
                        message.senderId !== user?.id && (
                            <p className="text-green-500 text-[10px]">
                                {message.sender?.name}
                            </p>
                        )}

                    {message.type === MessageType.TEXT ? (
                        <p>{message.content}</p>
                    ) : (
                        <div>Other type coming soon...</div>
                    )}

                    <p className="w-full text-end text-[10px] dark:text-muted-foreground text-stone-600">
                        {formatTime(message.createdAt)}
                    </p>
                </motion.div>
            ))}

            {scrollButtonEnabled && (
                <Button
                    variant="secondary"
                    size="icon"
                    className="fixed right-2 bottom-16 rounded-full border"
                    onClick={scrollToBottom}
                >
                    <MoveDown />
                </Button>
            )}

            <div ref={bottomRef} />
        </div>
    );
}