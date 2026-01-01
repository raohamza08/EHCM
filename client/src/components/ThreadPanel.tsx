"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, User } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { socketService } from "@/lib/socket";
import { api } from "@/lib/api";
import styles from "./ThreadPanel.module.css";

export default function ThreadPanel({ parentMessageId, onClose }: { parentMessageId: string; onClose: () => void }) {
    const [replies, setReplies] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState("");
    const { user } = useAuthStore();
    const [parentMessage, setParentMessage] = useState<any>(null);
    const repliesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch parent message and existing replies
        api.get<any>(`/messages/thread/${parentMessageId}`).then(data => {
            setParentMessage(data.parent);
            setReplies(data.replies);
        });

        const handleNewMessage = (message: any) => {
            if (message.parentId === parentMessageId) {
                setReplies(prev => [...prev, message]);
            }
        };

        socketService.socket?.on("new-message", handleNewMessage);

        return () => {
            socketService.socket?.off("new-message", handleNewMessage);
        };
    }, [parentMessageId]);

    useEffect(() => {
        repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [replies]);

    const handleSendReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !user || !parentMessage) return;

        socketService.socket?.emit("send-message", {
            parentId: parentMessageId,
            content: inputValue,
            userId: user.id,
            channelId: parentMessage.channelId
        });
        setInputValue("");
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerInfo}>
                    <h3>Thread</h3>
                    <span className={styles.parentRef}>In #{parentMessage?.channel?.name || "general"}</span>
                </div>
                <button onClick={onClose} className={styles.closeButton}><X size={20} /></button>
            </header>

            <div className={styles.content}>
                {parentMessage && (
                    <div className={styles.parentMessage}>
                        <div className={styles.avatar}>
                            {parentMessage.sender.avatar ? <img src={parentMessage.sender.avatar} /> : <User size={20} />}
                        </div>
                        <div className={styles.textContainer}>
                            <div className={styles.messageHeader}>
                                <span className={styles.sender}>{parentMessage.sender.name}</span>
                                <span className={styles.time}>{new Date(parentMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className={styles.text}>{parentMessage.content}</p>
                        </div>
                    </div>
                )}

                <div className={styles.repliesHeader}>
                    {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </div>

                <div className={styles.repliesList}>
                    {replies.map(reply => (
                        <div key={reply.id} className={styles.reply}>
                            <div className={styles.avatar}>
                                {reply.sender.avatar ? <img src={reply.sender.avatar} /> : <User size={18} />}
                            </div>
                            <div className={styles.textContainer}>
                                <div className={styles.messageHeader}>
                                    <span className={styles.sender}>{reply.sender.name}</span>
                                    <span className={styles.time}>{new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className={styles.text}>{reply.content}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={repliesEndRef} />
                </div>
            </div>

            <footer className={styles.footer}>
                <form onSubmit={handleSendReply} className={styles.inputWrapper}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        placeholder="Reply..."
                        className={styles.input}
                    />
                    <button type="submit" className={styles.sendButton} disabled={!inputValue.trim()}><Send size={18} /></button>
                </form>
            </footer>
        </div>
    );
}
