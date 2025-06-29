import { useStore } from "@/lib/store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/lib/axios";
import { Message, MessageType, MetaData } from "@/lib/index.types";
import { cn, formatTime, sleep } from "@/lib/utils";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import useDetectScroll from "@smakss/react-scroll-direction";
import { MoveDown } from "lucide-react";
import { BeatLoader } from "react-spinners";

export function MessagesWindow() {
    const [isLoading, setIsLoading] = useState(false);
    const {
        setMessages,
        activeConversation,
        user,
        messages: conversationMessages,
        setMessagesMeta,
        messagesMeta,
    } = useStore();

    const messages = useMemo(
        () =>
            activeConversation?.id
                ? (conversationMessages.get(activeConversation.id) || []).toReversed()
                : [],
        [activeConversation?.id, conversationMessages]
    );

    const bottomRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const buffer = 10;
    const { scrollDir } = useDetectScroll({ target: containerRef.current ?? window });
    const [scrollButtonEnabled, setScrollButtonEnabled] = useState(false);
    const prevMessagesRef = useRef<Message[]>([]);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        bottomRef.current?.scrollIntoView({ behavior });
    };

    const fetchMessages = useCallback(
        async function (page: number = 1) {
            console.log("Fetching Page", page);
            try {
                setIsLoading(true);
                await sleep(500); // optional delay
                const { data: res } = await apiClient.get<{
                    message: string;
                    data: Message[];
                    meta: MetaData;
                }>(`/conversations/${activeConversation?.id}/messages?page=${page}`);

                if (activeConversation) {
                    setMessages(
                        activeConversation.id as string,
                        [...(conversationMessages.get(activeConversation.id) ?? []), ...res.data] as Message[]
                    );
                    setMessagesMeta(activeConversation.id, res.meta);
                }
            } catch (error) {
                console.log(error);
            } finally {
                setIsLoading(false);
            }
        },
        [activeConversation, conversationMessages, setMessages, setMessagesMeta]
    );

    useEffect(() => {
        if (!activeConversation) return;
        // Fetching conversations only first time
        if (!messagesMeta.has(activeConversation.id)) fetchMessages();
    }, [activeConversation, fetchMessages, messagesMeta]);

    useEffect(() => {
        const prevMessages = prevMessagesRef.current;
        const currentMessages = messages;

        const isFirstLoad = prevMessages.length === 0;
        const isNewMessageAppended =
            currentMessages.length > prevMessages.length &&
            currentMessages.at(-1)?.id !== prevMessages.at(-1)?.id;

        if (isFirstLoad || isNewMessageAppended) {
            scrollToBottom(isFirstLoad ? "auto" : "smooth");
        }

        prevMessagesRef.current = currentMessages;
    }, [messages]);

    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;

        const remaining =
            container.scrollHeight - container.scrollTop - container.clientHeight;

        if (remaining >= buffer && !scrollButtonEnabled) {
            setScrollButtonEnabled(true);
        } else if (remaining < buffer && scrollButtonEnabled) {
            setScrollButtonEnabled(false);
        }

        if (!activeConversation) return;

        const meta = messagesMeta.get(activeConversation.id);
        if (
            container.scrollTop <= buffer &&
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
            className="overflow-y-auto scrollbar-hide p-4 w-full flex-1 flex flex-col gap-2"
            onScroll={handleScroll}
            ref={containerRef}
        >
            {isLoading && <BeatLoader className="mx-auto" color="#006231" />}

            {messages?.map((message) => (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    key={message.id}
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
                                {message?.sender?.name}
                            </p>
                        )}

                    {message.type === MessageType.TEXT ? (
                        <p className="text-sm">{message.content}</p>
                    ) : (
                        <div>Other type coming soon...</div>
                    )}

                    <p
                        className={cn(
                            "w-full text-end text-[10px] dark:text-muted-foreground text-stone-600"
                        )}
                    >
                        {formatTime(message.createdAt)}
                    </p>
                </motion.div>
            ))}

            {scrollButtonEnabled && (
                <Button
                    variant="secondary"
                    className="fixed right-2 bottom-16 rounded-full border"
                    size="icon"
                    onClick={() => scrollToBottom()}
                >
                    <MoveDown />
                </Button>
            )}

            <div ref={bottomRef} />
        </div>
    );
}
