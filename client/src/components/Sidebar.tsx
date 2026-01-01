"use client";

import React, { useEffect, useState } from "react";
import { Hash, Settings, Plus, UserPlus, LogOut, Layout as LayoutIcon, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { socketService } from "@/lib/socket";
import WorkspaceModal from "./WorkspaceModal";
import CreateChannelModal from "./CreateChannelModal";
import InviteModal from "./InviteModal";
import WorkspaceSettingsModal from "./WorkspaceSettingsModal";
import ProfileSettingsModal from "./ProfileSettingsModal";
import styles from "./Sidebar.module.css";

interface Workspace {
    id: string;
    name: string;
    role?: string;
}

interface Channel {
    id: string;
    name: string;
    type: string;
    members?: any[];
}

export default function Sidebar() {
    const {
        activeWorkspaceId,
        activeChannelId,
        setActiveChannel,
        setActiveWorkspace,
        unreadChannels,
        setShowProfileModal,
        setShowInviteModal
    } = useChatStore();
    const { user, logout } = useAuthStore();

    const [channels, setChannels] = useState<Channel[]>([]);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    // Modal states
    const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
    const [showChannelModal, setShowChannelModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    useEffect(() => {
        const handlePresence = (data: { userId: string, status: string }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                if (data.status === "online") next.add(data.userId);
                else next.delete(data.userId);
                return next;
            });
        };

        const handleNewMember = () => {
            if (activeWorkspaceId) {
                api.get<any[]>(`/workspaces/${activeWorkspaceId}/members`)
                    .then(setWorkspaceMembers)
                    .catch(console.error);
            }
        };

        const handleOpenInvite = () => setShowInviteModal(true);

        socketService.socket?.on("presence-update", handlePresence);
        socketService.socket?.on("channel-created", handleNewMember);
        socketService.socket?.on("member-joined", handleNewMember);
        window.addEventListener("open-invite-modal", handleOpenInvite);

        if (user) {
            socketService.socket?.emit("user-online", { userId: user.id });
            socketService.socket?.on("user-offline", (userId: string) => {
                setOnlineUsers(prev => { const next = new Set(prev); next.delete(userId); return next; });
            });
        }

        return () => {
            socketService.socket?.off("presence-update");
            socketService.socket?.off("channel-created");
            socketService.socket?.off("member-joined");
            window.removeEventListener("open-invite-modal", handleOpenInvite);
            if (user) {
                socketService.socket?.off("user-online");
                socketService.socket?.off("user-offline");
            }
        };
    }, [user, activeWorkspaceId]);

    useEffect(() => {
        api.get<Workspace[]>("/workspaces")
            .then((data) => {
                setWorkspaces(data);
                if (data.length > 0 && !activeWorkspaceId) {
                    setActiveWorkspace(data[0].id);
                } else if (data.length === 0) {
                    setShowWorkspaceModal(true);
                }
            })
            .catch(console.error);
    }, [activeWorkspaceId, setActiveWorkspace]);

    useEffect(() => {
        if (activeWorkspaceId) {
            api.get<Channel[]>(`/channels/workspace/${activeWorkspaceId}`)
                .then(data => {
                    setChannels(data);
                    if (data.length > 0 && !activeChannelId) {
                        const general = data.find(c => c.name === "general") || data[0];
                        setActiveChannel(general.id);
                    }
                })
                .catch(console.error);

            api.get<any[]>(`/workspaces/${activeWorkspaceId}/members`)
                .then(setWorkspaceMembers)
                .catch(console.error);
        }
    }, [activeWorkspaceId, setActiveChannel, activeChannelId]);

    const handleChannelCreated = (channel: Channel) => {
        setChannels(prev => [...prev, channel]);
        setActiveChannel(channel.id);
        setShowChannelModal(false);
    };

    const regularChannels = channels.filter(c => c.type !== "DIRECT");
    const dmChannels = channels.filter(c => c.type === "DIRECT");

    const currentWorkspace = workspaces.find(ws => ws.id === activeWorkspaceId);
    const isAdmin = currentWorkspace?.role === "OWNER" || currentWorkspace?.role === "ADMIN";

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.workspaceHeader}>
                    <div className={styles.workspaceAvatar}>
                        {workspaces.find(ws => ws.id === activeWorkspaceId)?.name.charAt(0) || "E"}
                    </div>
                    <div className={styles.workspaceInfo}>
                        <select
                            value={activeWorkspaceId || ""}
                            onChange={(e) => {
                                if (e.target.value === "new") {
                                    setShowWorkspaceModal(true);
                                } else {
                                    setActiveWorkspace(e.target.value);
                                }
                            }}
                            className={styles.select}
                        >
                            {workspaces.map(ws => (
                                <option key={ws.id} value={ws.id}>{ws.name}</option>
                            ))}
                            <option value="new">+ Create Workspace</option>
                        </select>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={styles.creativeBtn}
                        onClick={() => useChatStore.getState().setCurrentView("creative")}
                        title="Switch to Creative Hub"
                    >
                        <Sparkles size={16} />
                    </button>
                    {isAdmin && (
                        <Settings
                            size={18}
                            className={styles.icon}
                            onClick={() => setShowSettingsModal(true)}
                        />
                    )}
                </div>
            </header>

            {/* Remaining local modals */}
            {showWorkspaceModal && (
                <WorkspaceModal
                    onClose={() => setShowWorkspaceModal(false)}
                    onSuccess={(workspace) => {
                        setWorkspaces(prev => [...prev, workspace]);
                        setActiveWorkspace(workspace.id);
                    }}
                />
            )}
            {showChannelModal && activeWorkspaceId && (
                <CreateChannelModal
                    workspaceId={activeWorkspaceId}
                    onClose={() => setShowChannelModal(false)}
                    onSuccess={handleChannelCreated}
                />
            )}
            {/* Global modals (Profile, Invite) are handled in MainLayout */}
            {showSettingsModal && activeWorkspaceId && (
                <WorkspaceSettingsModal
                    workspaceId={activeWorkspaceId}
                    onClose={() => setShowSettingsModal(false)}
                />
            )}

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <span>Channels</span>
                    {isAdmin && (
                        <Plus
                            size={16}
                            className={styles.plusIcon}
                            onClick={() => setShowChannelModal(true)}
                        />
                    )}
                </div>
                <div className={styles.list}>
                    {regularChannels.map((channel) => (
                        <button
                            key={channel.id}
                            className={`${styles.item} ${activeChannelId === channel.id ? styles.active : ""}`}
                            onClick={() => setActiveChannel(channel.id)}
                        >
                            <Hash size={16} />
                            <span>{channel.name} {channel.type === "PRIVATE" ? "🔒" : ""}</span>
                            {unreadChannels[channel.id] > 0 && <span className={styles.unreadBadge}>{unreadChannels[channel.id]}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <span>Direct Messages</span>
                    {isAdmin && (
                        <UserPlus
                            size={16}
                            className={styles.plusIcon}
                            onClick={() => setShowInviteModal(true)}
                        />
                    )}
                </div>
                <div className={styles.list}>
                    {workspaceMembers.filter(m => m.user.id !== user?.id).map((member) => {
                        const existingDM = dmChannels.find(c => c.members?.some(cm => cm.id === member.user.id));
                        const isOnline = onlineUsers.has(member.user.id);

                        const handleDmClick = async () => {
                            if (existingDM) {
                                setActiveChannel(existingDM.id);
                            } else {
                                try {
                                    const newDm = await api.post<Channel>("/channels/direct", {
                                        workspaceId: activeWorkspaceId,
                                        otherUserId: member.user.id
                                    });
                                    setChannels(prev => [...prev, newDm]);
                                    setActiveChannel(newDm.id);
                                } catch (err) {
                                    console.error("Failed to create DM", err);
                                }
                            }
                        };

                        return (
                            <button
                                key={member.user.id}
                                className={`${styles.item} ${activeChannelId === existingDM?.id ? styles.active : ""}`}
                                onClick={handleDmClick}
                            >
                                <div className={`${styles.statusDot} ${isOnline ? styles.online : ""}`} />
                                <span>{member.user.name}</span>
                                {existingDM && unreadChannels[existingDM.id] > 0 && (
                                    <span className={styles.unreadBadge}>{unreadChannels[existingDM.id]}</span>
                                )}
                            </button>
                        );
                    })}
                    {workspaceMembers.length <= 1 && (
                        <div className={styles.emptyHint}>No other members yet</div>
                    )}
                </div>
            </div>

            <footer className={styles.footer}>
                <div className={styles.userInfo} onClick={() => setShowProfileModal(true)}>
                    <div className={styles.userAvatar}>
                        {user?.avatar ? <img src={user.avatar} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : user?.name.charAt(0)}
                    </div>
                    <div className={styles.userDetails}>
                        <div className={styles.userName}>{user?.name}</div>
                        <div className={styles.userStatus}>{user?.status || "Online"}</div>
                    </div>
                </div>
                <LogOut size={18} className={styles.logoutIcon} onClick={logout} />
            </footer>
        </div>
    );
}
