"use client";

import React, { useState, useEffect } from "react";
import { X, Mail, Briefcase, MapPin, MessageSquare, Star, User as UserIcon, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import styles from "./WorkspaceModal.module.css";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    jobTitle: string | null;
    bio: string | null;
    status: string | null;
}

export default function UserProfileModal({ userId, onClose }: { userId: string, onClose: () => void }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { activeWorkspaceId, setActiveChannel, setViewProfileId } = useChatStore();
    const { user: currentUser } = useAuthStore();

    useEffect(() => {
        setIsLoading(true);
        api.get<UserProfile>(`/auth/users/${userId}`)
            .then(data => {
                setProfile(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, [userId]);

    const handleStartChat = async () => {
        if (!activeWorkspaceId || !profile) return;
        try {
            const channel = await api.post<any>("/channels/direct", {
                workspaceId: activeWorkspaceId,
                otherUserId: profile.id
            });
            setActiveChannel(channel.id);
            onClose();
            setViewProfileId(null);
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.overlay}>
                <div className={styles.modal} style={{ maxWidth: "400px", textAlign: "center", padding: "40px" }}>
                    <Loader2 className="animate-spin" size={32} style={{ margin: "0 auto" }} />
                    <p style={{ marginTop: "10px" }}>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} style={{ maxWidth: "450px", width: "95%", padding: 0, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
                <div style={{ height: "120px", background: "linear-gradient(135deg, var(--primary), var(--primary-light))", position: "relative" }}>
                    <button onClick={onClose} style={{ position: "absolute", top: "15px", right: "15px", background: "rgba(0,0,0,0.2)", border: "none", borderRadius: "50%", padding: "5px", color: "white", cursor: "pointer" }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: "0 30px 30px", marginTop: "-50px", position: "relative" }}>
                    <div style={{
                        width: "100px", height: "100px", borderRadius: "50%", border: "4px solid var(--surface)",
                        overflow: "hidden", background: "white", marginBottom: "15px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "36px", fontWeight: "bold", color: "var(--primary)"
                    }}>
                        {profile.avatar ? <img src={profile.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : profile.name.charAt(0)}
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <h2 style={{ margin: "0 0 5px", display: "flex", alignItems: "center", gap: "10px" }}>
                            {profile.name}
                            <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "10px", background: "var(--success-light)", color: "var(--success)", fontWeight: "normal" }}>
                                {profile.status || "Online"}
                            </span>
                        </h2>
                        <p style={{ color: "var(--foreground-tertiary)", margin: 0, fontSize: "14px" }}>{profile.jobTitle || "Member"}</p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "25px" }}>
                        {profile.bio && (
                            <div style={{ fontSize: "14px", color: "var(--foreground-secondary)", lineHeight: "1.5" }}>
                                {profile.bio}
                            </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--foreground-secondary)", fontSize: "14px" }}>
                            <Mail size={16} /> {profile.email}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--foreground-secondary)", fontSize: "14px" }}>
                            <Briefcase size={16} /> EuroCom Team
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                        {profile.id !== currentUser?.id && (
                            <button
                                onClick={handleStartChat}
                                style={{
                                    flex: 1, padding: "12px", background: "var(--primary)", color: "white",
                                    border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                                }}
                            >
                                <MessageSquare size={18} /> Send Message
                            </button>
                        )}
                        <button style={{
                            padding: "12px", background: "var(--background-secondary)", border: "1px solid var(--border)",
                            borderRadius: "8px", cursor: "pointer", color: "var(--foreground-secondary)"
                        }}>
                            <Star size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
