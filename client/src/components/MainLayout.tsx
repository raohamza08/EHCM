"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { socketService } from "@/lib/socket";
import Sidebar from "@/components/Sidebar";
import Chat from "@/components/Chat";
import ChannelDetails from "@/components/ChannelDetails";
import ThreadPanel from "@/components/ThreadPanel";
import AuthPage from "@/components/AuthPage";
import CreateChannelModal from "@/components/CreateChannelModal";
import InviteModal from "@/components/InviteModal";
import SearchOverlay from "@/components/SearchOverlay";
import styles from "./Layout.module.css";
import { Search, Send, Smile, Paperclip, File as FileIcon, Download, MessageCircle, Pin, Trash, Phone, Video } from "lucide-react";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";
import UserProfileModal from "@/components/UserProfileModal";
import CreativeHub from "@/components/creative/CreativeHub";
import CallModal from "@/components/CallModal";
import IncomingCallModal from "@/components/IncomingCallModal";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    // 1. All hooks at the very top, unconditional
    const { token, user, _hasHydrated } = useAuthStore();
    const {
        activeChannelId,
        activeWorkspaceId,
        currentView,
        showInviteModal,
        setShowInviteModal,
        showProfileModal,
        setShowProfileModal,
        viewProfileId,
        setViewProfileId,
        callState,
        setCallState
    } = useChatStore();
    const [activeThreadMessageId, setActiveThreadMessageId] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [showChannelModal, setShowChannelModal] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setShowSearch(true);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (token && isMounted) {
            socketService.connect(token);
            socketService.socket?.on("presence-update", (data: any) => {
                useChatStore.getState().updateUserProfiles(data);
            });

            socketService.socket?.on("incoming-call", (data: any) => {
                useChatStore.getState().setCallState({
                    incomingCall: true,
                    remoteUserId: data.from,
                    callType: data.type,
                    signalData: data.signal
                });
            });

            socketService.socket?.on("call-ended", () => {
                useChatStore.getState().setCallState({
                    isCalling: false,
                    incomingCall: false,
                    remoteUserId: null,
                    callType: null,
                    signalData: null
                });
            });
        }
        return () => {
            socketService.socket?.off("presence-update");
            socketService.socket?.off("incoming-call");
            socketService.socket?.off("call-ended");
            socketService.disconnect();
        };
    }, [token, isMounted]);

    // 2. Early returns happen AFTER all hooks are declared
    if (!isMounted || !_hasHydrated) {
        return (
            <div style={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "16px",
                background: "var(--background)",
                color: "var(--foreground)"
            }}>
                <div style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid var(--muted)",
                    borderTop: "3px solid var(--primary)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }} />
                <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
                <p style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>Initializing EuroCom...</p>
            </div>
        );
    }

    if (!token) {
        return <AuthPage />;
    }

    return (
        <div className={styles.container}>
            {currentView === "creative" ? (
                <div style={{ flex: 1, display: "flex", height: "100vh" }}>
                    <CreativeHub />
                </div>
            ) : (
                <>
                    <aside className={styles.sidebar}>
                        <Sidebar />
                        <div className={styles.commandHint} onClick={() => setShowSearch(true)} style={{ cursor: "pointer" }}>
                            <Search size={14} />
                            <span>Jump to...</span>
                            <kbd className={styles.kbd}>⌘K</kbd>
                        </div>
                    </aside>
                    <main className={styles.chat}>
                        <Chat
                            onOpenThread={(id) => setActiveThreadMessageId(id)}
                            onCreateChannel={() => setShowChannelModal(true)}
                            onInviteUsers={() => setShowInviteModal(true)}
                        />
                    </main>
                    <div className={styles.rightPanel}>
                        {activeThreadMessageId ? (
                            <ThreadPanel parentMessageId={activeThreadMessageId} onClose={() => setActiveThreadMessageId(null)} />
                        ) : activeChannelId ? (
                            <ChannelDetails />
                        ) : (
                            <div className={styles.emptyRight}>Select a channel to see details</div>
                        )}
                    </div>
                </>
            )}

            {/* Modals */}
            {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
            {showChannelModal && activeWorkspaceId && (
                <CreateChannelModal
                    workspaceId={activeWorkspaceId}
                    onClose={() => setShowChannelModal(false)}
                    onSuccess={(channel) => {
                        setShowChannelModal(false);
                        // Channel will be added to sidebar automatically via Sidebar's useEffect
                    }}
                />
            )}
            {showInviteModal && activeWorkspaceId && (
                <InviteModal
                    workspaceId={activeWorkspaceId}
                    onClose={() => setShowInviteModal(false)}
                />
            )}
            {showProfileModal && (
                <ProfileSettingsModal onClose={() => setShowProfileModal(false)} />
            )}
            {viewProfileId && (
                <UserProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />
            )}

            {callState.incomingCall && !callState.isCalling && (
                <IncomingCallModal
                    fromName="Someone" // We could fetch this if needed
                    type={callState.callType || "video"}
                    onAccept={() => setCallState({ isCalling: true, incomingCall: false })}
                    onReject={() => {
                        socketService.socket?.emit("reject-call", { to: callState.remoteUserId });
                        setCallState({ incomingCall: false });
                    }}
                />
            )}

            {callState.isCalling && callState.remoteUserId && (
                <CallModal
                    remoteUserId={callState.remoteUserId}
                    type={callState.callType || "video"}
                    isIncoming={!!callState.signalData}
                    onClose={() => setCallState({ isCalling: false, remoteUserId: null, callType: null, signalData: null })}
                />
            )}
        </div>
    );
}
