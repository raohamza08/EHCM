"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, User, AtSign, Smile, Paperclip, MessageCircle, Pin, Trash, Search, Users, MessageSquare, Plus, File as FileIcon, Image as ImageIcon, X, Download, Loader2, Phone, Video } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { socketService } from "@/lib/socket";
import { api } from "@/lib/api";
import styles from "./Chat.module.css";

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "✅", "🚀", "✨", "🙌"];

export default function Chat({
    onOpenThread,
    onCreateChannel,
    onInviteUsers
}: {
    onOpenThread: (id: string) => void;
    onCreateChannel?: () => void;
    onInviteUsers?: () => void;
}) {
    const { activeChannelId, activeWorkspaceId, messages, addMessage, updateMessage, deleteMessage, setCallState } = useChatStore();
    const { user } = useAuthStore();
    const [inputValue, setInputValue] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [summary, setSummary] = useState<string | null>(null);
    const [typingUsers, setTypingUsers] = useState<Record<string, { name: string; timestamp: number }>>({});
    const [channelInfo, setChannelInfo] = useState<{ id: string; name: string; type: string; members?: any[] } | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSummarize = async () => {
        try {
            const data = await api.post<{ summary: string }>("/ai/summarize", { channelId: activeChannelId });
            setSummary(data.summary);
        } catch (err) {
            console.error(err);
        }
    };


    useEffect(() => {
        if (activeWorkspaceId) {
            api.get<any[]>(`/workspaces/${activeWorkspaceId}/members`)
                .then(setWorkspaceMembers)
                .catch(console.error);
        }
    }, [activeWorkspaceId]);

    useEffect(() => {
        if (activeChannelId) {
            api.get<any>(`/channels/${activeChannelId}`).then(setChannelInfo).catch(console.error);
            api.get<any[]>(`/messages/channel/${activeChannelId}`).then((data) => {
                const { setMessages } = useChatStore.getState();
                setMessages(data.reverse());
            }).catch(console.error);
        }
    }, [activeChannelId]);
    useEffect(() => {
        if (activeChannelId) {
            socketService.joinChannel(activeChannelId);
            socketService.socket?.on("new-message", (message) => addMessage(message));
            socketService.socket?.on("user-typing", (data: { userId: string; name: string }) => {
                if (data.userId === user?.id) return;
                setTypingUsers(prev => ({ ...prev, [data.userId]: { name: data.name, timestamp: Date.now() } }));
            });
            socketService.socket?.on("message-updated", (m: any) => updateMessage(m));
            socketService.socket?.on("message-deleted", (d: any) => deleteMessage(d.messageId));
        }
        const interval = setInterval(() => {
            setTypingUsers(prev => {
                const now = Date.now();
                const next = { ...prev };
                let changed = false;
                for (const id in next) if (now - next[id].timestamp > 3000) { delete next[id]; changed = true; }
                return changed ? next : prev;
            });
        }, 1000);
        return () => {
            clearInterval(interval);
            if (activeChannelId) {
                socketService.leaveChannel(activeChannelId);
                socketService.socket?.off("new-message");
                socketService.socket?.off("user-typing");
                socketService.socket?.off("message-updated");
                socketService.socket?.off("message-deleted");
            }
        };
    }, [activeChannelId, addMessage, updateMessage, deleteMessage, user?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputValue.trim() && !attachedFile) || !activeChannelId || !user) return;

        if (attachedFile) {
            setIsUploading(true);
            try {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result as string;
                    socketService.socket?.emit("send-message", {
                        channelId: activeChannelId,
                        content: inputValue || `Shared a file: ${attachedFile.name}`,
                        userId: user.id,
                        file: {
                            name: attachedFile.name,
                            url: base64, // Base64 URL for now
                            type: attachedFile.type,
                            size: attachedFile.size
                        }
                    });
                    setAttachedFile(null);
                    setInputValue("");
                    setIsUploading(false);
                };
                reader.onerror = () => {
                    alert("Failed to read file");
                    setIsUploading(false);
                };
                reader.readAsDataURL(attachedFile);
                return; // Wait for reader.onload
            } catch (err) {
                console.error(err);
                setIsUploading(false);
            }
        } else {
            socketService.sendMessage(activeChannelId, inputValue, user.id);
            setInputValue("");
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        setInputValue(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setAttachedFile(file);
    };

    const filteredMessages = messages.filter(msg =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!activeChannelId) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIllustration}>
                    <MessageSquare size={64} className={styles.emptyIcon} />
                </div>
                <h2 className={styles.emptyTitle}>Welcome to EuroCom</h2>
                <p className={styles.emptySubtitle}>Select a channel or direct message from the sidebar to start your conversation.</p>
                <div className={styles.emptyActions}>
                    <button className={styles.actionButton} onClick={() => onCreateChannel?.()}><Plus size={16} /> Create a channel</button>
                    <button className={styles.actionButton} onClick={() => onInviteUsers?.()}><Users size={16} /> Invite teammates</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.channelInfo}>
                    <span className={styles.channelHash}>{channelInfo?.type === "DIRECT" ? "@" : "#"}</span>
                    <span className={styles.channelName}>
                        {channelInfo?.type === "DIRECT"
                            ? (channelInfo.members?.find(m => m.id !== user?.id)?.name || "Direct Message")
                            : (channelInfo?.name || "loading...")}
                    </span>
                    {channelInfo?.type === "PRIVATE" && <span className={styles.privateBadge}>🔒</span>}
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.searchWrapper}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <button onClick={handleSummarize} className={styles.aiButton}>Summarize ✨</button>
                    {channelInfo?.type === "DIRECT" && (
                        <div style={{ display: "flex", gap: "10px", marginLeft: "10px" }}>
                            <button
                                onClick={() => {
                                    const remoteId = channelInfo.members?.find(m => m.id !== user?.id)?.id;
                                    if (remoteId) setCallState({ isCalling: true, remoteUserId: remoteId, callType: "audio" });
                                }}
                                className={styles.iconButton}
                            >
                                <Phone size={18} />
                            </button>
                            <button
                                onClick={() => {
                                    const remoteId = channelInfo.members?.find(m => m.id !== user?.id)?.id;
                                    if (remoteId) setCallState({ isCalling: true, remoteUserId: remoteId, callType: "video" });
                                }}
                                className={styles.iconButton}
                            >
                                <Video size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {summary && (
                <div className={styles.summaryBanner}>
                    <p><strong>AI Summary:</strong> {summary}</p>
                    <button onClick={() => setSummary(null)}>×</button>
                </div>
            )}

            <div className={styles.messageList}>
                {filteredMessages.map((msg) => (
                    <div key={msg.id} className={`${styles.message} ${msg.isPinned ? styles.pinned : ""}`}>
                        <div className={styles.avatar} onClick={() => useChatStore.getState().setViewProfileId(msg.sender?.id)} style={{ cursor: "pointer" }}>
                            {msg.sender?.avatar ? <img src={msg.sender.avatar} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : msg.sender?.name?.charAt(0)}
                        </div>
                        <div className={styles.messageContent}>
                            <div className={styles.messageHeader}>
                                <span className={styles.senderName} onClick={() => useChatStore.getState().setViewProfileId(msg.sender?.id)} style={{ cursor: "pointer" }}>{msg.sender?.name}</span>
                                <span className={styles.timestamp}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {msg.isPinned && <Pin size={12} className={styles.pinIcon} />}
                            </div>
                            <div className={styles.text}>
                                {msg.content.split("\n").map((line, i) => (
                                    <p key={i}>
                                        {line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/).map((part, j) => {
                                            if (part.startsWith("**") && part.endsWith("**")) return <strong key={j}>{part.slice(2, -2)}</strong>;
                                            if (part.startsWith("*") && part.endsWith("*")) return <em key={j}>{part.slice(1, -1)}</em>;
                                            if (part.startsWith("`") && part.endsWith("`")) return <code key={j} className={styles.inlineCode}>{part.slice(1, -1)}</code>;
                                            return part;
                                        })}
                                    </p>
                                ))}
                            </div>

                            {msg.files && msg.files.map((file: any) => (
                                <div key={file.id} className={styles.attachment}>
                                    {file.type.startsWith("image/") ? (
                                        <div className={styles.imagePreview}>
                                            <img src={file.url} alt={file.name} onClick={() => window.open(file.url, "_blank")} />
                                        </div>
                                    ) : (
                                        <div className={styles.fileCard}>
                                            <FileIcon size={24} />
                                            <div className={styles.fileInfo}>
                                                <span className={styles.fileName}>{file.name}</span>
                                                <span className={styles.fileSize}>Click to download</span>
                                            </div>
                                            <a href={file.url} download={file.name} className={styles.downloadBtn}><Download size={18} /></a>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className={styles.messageActions}>
                                <button onClick={() => onOpenThread(msg.id)} title="Reply in thread"><MessageCircle size={16} /></button>
                                <button onClick={() => socketService.socket?.emit("pin-message", { messageId: msg.id, channelId: activeChannelId })} title="Pin message"><Pin size={16} /></button>
                                <button onClick={() => handleEmojiSelect("👍")} title="React"><Smile size={16} /></button>
                                <button onClick={() => socketService.socket?.emit("delete-message", { messageId: msg.id, channelId: activeChannelId })} title="Delete message"><Trash size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {Object.keys(typingUsers).length > 0 && (
                <div className={styles.typingIndicator}>
                    {Object.values(typingUsers).map(u => u.name).join(", ")} {Object.keys(typingUsers).length === 1 ? "is" : "are"} typing...
                </div>
            )}

            <footer className={styles.footer}>
                {attachedFile && (
                    <div className={styles.attachmentPreview}>
                        <div className={styles.previewCard}>
                            {attachedFile.type.startsWith("image/") ? <ImageIcon size={20} /> : <FileIcon size={20} />}
                            <span>{attachedFile.name}</span>
                            <button onClick={() => setAttachedFile(null)}><X size={16} /></button>
                        </div>
                    </div>
                )}
                <form className={styles.inputWrapper} onSubmit={handleSendMessage}>
                    <button type="button" className={styles.actionIcon} onClick={() => fileInputRef.current?.click()}>
                        <Plus size={20} />
                    </button>
                    <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} />

                    <input
                        type="text"
                        placeholder={`Message ${channelInfo?.type === "DIRECT" ? "@" + (channelInfo.members?.find(m => m.id !== user?.id)?.name || "user") : "#" + (channelInfo?.name || "channel")}`}
                        value={inputValue}
                        onChange={(e) => {
                            const val = e.target.value;
                            setInputValue(val);

                            // Simple @mention detection
                            const lastWord = val.split(" ").pop() || "";
                            if (lastWord.startsWith("@")) {
                                setMentionSearch(lastWord.slice(1));
                            } else {
                                setMentionSearch(null);
                            }

                            if (activeChannelId && user) socketService.sendTyping(activeChannelId, user.id, user.name);
                        }}
                        className={styles.input}
                    />

                    {mentionSearch !== null && (() => {
                        const search = mentionSearch.toLowerCase();
                        return (
                            <div style={{
                                position: "absolute", bottom: "100%", left: "50px", background: "var(--surface)",
                                border: "1px solid var(--border)", borderRadius: "8px", padding: "5px",
                                boxShadow: "var(--shadow-xl)", zIndex: 1000, minWidth: "200px"
                            }}>
                                {workspaceMembers
                                    .filter(m => m.user.name.toLowerCase().includes(search))
                                    .map(m => (
                                        <div
                                            key={m.user.id}
                                            onClick={() => {
                                                const parts = inputValue.split(" ");
                                                parts.pop();
                                                setInputValue([...parts, "@" + m.user.name + " "].join(" "));
                                                setMentionSearch(null);
                                            }}
                                            style={{
                                                padding: "8px 12px", cursor: "pointer", borderRadius: "4px",
                                                display: "flex", alignItems: "center", gap: "10px"
                                            }}
                                            className={styles.mentionItem}
                                        >
                                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--primary-light)", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {m.user.avatar ? <img src={m.user.avatar} style={{ width: "100%", height: "100%", borderRadius: "50%" }} /> : m.user.name.charAt(0)}
                                            </div>
                                            <span>{m.user.name}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        );
                    })()}
                    <div className={styles.inputActions}>
                        <div className={styles.emojiWrapper}>
                            <button type="button" className={styles.actionIcon} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                                <Smile size={20} />
                            </button>
                            {showEmojiPicker && (
                                <div className={styles.emojiPicker}>
                                    {COMMON_EMOJIS.map(e => (
                                        <button key={e} type="button" onClick={() => handleEmojiSelect(e)}>{e}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button type="submit" className={styles.sendButton} disabled={(!inputValue.trim() && !attachedFile) || isUploading}>
                            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </form>
            </footer>
        </div>
    );
}
