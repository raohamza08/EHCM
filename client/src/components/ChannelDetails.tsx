"use client";

import React, { useEffect, useState } from "react";
import { Info, Users, Pin, FileText, Bell, Hash, User, Loader2, Settings, Download } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { api } from "@/lib/api";
import styles from "./ChannelDetails.module.css";

interface ChannelInfo {
    id: string;
    name: string;
    description?: string;
    type: string;
    members: any[];
}

export default function ChannelDetails() {
    const { activeChannelId, messages } = useChatStore();
    const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (activeChannelId) {
            setIsLoading(true);
            api.get<ChannelInfo>(`/channels/${activeChannelId}`)
                .then(data => {
                    setChannelInfo(data);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setIsLoading(false);
                });
        }
    }, [activeChannelId]);

    const pinnedCount = messages.filter(m => m.isPinned).length;
    const allFiles = messages.flatMap(m => (m as any).files || []);

    if (!activeChannelId) return null;
    if (isLoading) return (
        <div className={styles.emptyState}>
            <Loader2 className="animate-spin" size={24} />
            <p className={styles.emptyText}>Loading details...</p>
        </div>
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.channelName}>
                    <div className={styles.channelHash}>
                        {channelInfo?.type === "DIRECT" ? <User size={18} /> : <Hash size={18} />}
                    </div>
                    <span>{channelInfo?.name || "Channel"}</span>
                </div>
                {channelInfo?.description && (
                    <p className={styles.channelDescription}>{channelInfo.description}</p>
                )}

                <div className={styles.channelActions}>
                    <button className={styles.actionBtn} onClick={() => {
                        // Focus the chat input
                        const input = document.querySelector('input[placeholder^="Message"]') as HTMLInputElement;
                        input?.focus();
                    }}>
                        Send Message
                    </button>
                    {channelInfo?.type !== "DIRECT" && (
                        <button className={styles.actionBtnSecondary} onClick={() => {
                            const event = new CustomEvent("open-invite-modal");
                            window.dispatchEvent(event);
                        }}>
                            Invite Members
                        </button>
                    )}
                    <button className={styles.actionBtnIcon} title="Settings">
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            <div className={styles.content}>
                <section className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <span>About</span>
                    </div>
                    <div className={styles.menu}>
                        <div className={styles.notificationToggle}>
                            <div className={styles.toggleLabel}>
                                <Bell size={18} />
                                <span>Notifications</span>
                            </div>
                            <div className={`${styles.switch} ${styles.active}`}>
                                <div className={styles.switchKnob} />
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <span>Members ({channelInfo?.members?.length || 0})</span>
                        <button className={styles.sectionAction}>View all</button>
                    </div>
                    <div className={styles.membersList}>
                        {channelInfo?.members.map(member => (
                            <div key={member.id} className={styles.member}>
                                <div className={styles.memberAvatar}>
                                    {member.avatar ? <img src={member.avatar} alt={member.name} /> : member.name.charAt(0)}
                                    <div className={`${styles.statusIndicator} ${styles.online}`} />
                                </div>
                                <div className={styles.memberInfo}>
                                    <div className={styles.memberName}>{member.name}</div>
                                    <div className={styles.memberRole}>{member.id === channelInfo.members[0].id ? "Owner" : "Member"}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <span>Pinned Messages</span>
                        {pinnedCount > 0 && <span className={styles.badge}>{pinnedCount}</span>}
                    </div>
                    {pinnedCount === 0 ? (
                        <div className={styles.emptyState}>
                            <Pin className={styles.emptyIcon} />
                            <p className={styles.emptyText}>No pinned messages yet.</p>
                        </div>
                    ) : (
                        <div className={styles.pinnedList}>
                            {messages.filter(m => m.isPinned).map(msg => (
                                <div key={msg.id} className={styles.pinnedMessage}>
                                    <div className={styles.pinnedHeader}>
                                        <span className={styles.pinnedSender}>{msg.sender?.name}</span>
                                        <span className={styles.pinnedTime}>{new Date(msg.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className={styles.pinnedContent}>{msg.content}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <span>Shared Files</span>
                    </div>
                    {allFiles.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FileText className={styles.emptyIcon} />
                            <p className={styles.emptyText}>No files shared in this channel.</p>
                        </div>
                    ) : (
                        <div className={styles.filesList}>
                            {allFiles.map((file, idx) => (
                                <div key={idx} className={styles.fileItem} title={file.name}>
                                    {file.type.startsWith("image/") ? (
                                        <div className={styles.imageThumb}>
                                            <img src={file.url} alt={file.name} onClick={() => window.open(file.url, "_blank")} />
                                        </div>
                                    ) : (
                                        <div className={styles.fileIconBox}>
                                            <FileText size={20} />
                                            <span className={styles.fileNameSmall}>{file.name}</span>
                                            <a href={file.url} download={file.name} className={styles.downloadIcon}><Download size={14} /></a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
