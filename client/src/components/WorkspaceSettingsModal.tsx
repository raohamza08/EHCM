"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { User, Shield, Trash2 } from "lucide-react";
import styles from "./WorkspaceModal.module.css";

interface Member {
    id: string;
    role: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
}

export default function WorkspaceSettingsModal({
    workspaceId,
    onClose
}: {
    workspaceId: string;
    onClose: () => void;
}) {
    const [name, setName] = useState("");
    const [members, setMembers] = useState<Member[]>([]);
    const [activeTab, setActiveTab] = useState<"general" | "members">("general");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get<any>(`/workspaces/${workspaceId}/members`)
            .then(setMembers)
            .catch(console.error);

        // Assume we have workspace data or fetch it
        api.get<any[]>("/workspaces").then(wss => {
            const ws = wss.find(w => w.id === workspaceId);
            if (ws) setName(ws.name);
        });
    }, [workspaceId]);

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await api.patch(`/workspaces/${workspaceId}`, { name });
            window.location.reload(); // Quick way to update UI
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateRole = async (memberId: string, role: string) => {
        try {
            await api.patch(`/workspaces/${workspaceId}/members/${memberId}`, { role });
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
        } catch (err) {
            alert("Failed to update role");
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ maxWidth: "600px", minHeight: "400px" }}>
                <header className={styles.tabs}>
                    <button
                        className={activeTab === "general" ? styles.activeTab : ""}
                        onClick={() => setActiveTab("general")}
                    >
                        General Settings
                    </button>
                    <button
                        className={activeTab === "members" ? styles.activeTab : ""}
                        onClick={() => setActiveTab("members")}
                    >
                        Members
                    </button>
                </header>

                <div className={styles.tabContent}>
                    {activeTab === "general" ? (
                        <form onSubmit={handleUpdateSettings} className={styles.form}>
                            <div className={styles.field}>
                                <label>Workspace Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <div className={styles.error}>{error}</div>}
                            <button type="submit" className={styles.submit} disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    ) : (
                        <div className={styles.membersList}>
                            {members.map(member => (
                                <div key={member.id} className={styles.memberItem}>
                                    <div className={styles.memberInfo}>
                                        <div className={styles.avatar}>
                                            {member.user.avatar ? <img src={member.user.avatar} /> : <User size={20} />}
                                        </div>
                                        <div>
                                            <div className={member.user.name}>{member.user.name}</div>
                                            <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{member.user.email}</div>
                                        </div>
                                    </div>
                                    <div className={styles.memberActions}>
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                            className={styles.roleSelect}
                                            disabled={member.role === "OWNER"}
                                        >
                                            <option value="OWNER" disabled>Owner</option>
                                            <option value="ADMIN">Admin</option>
                                            <option value="MEMBER">Member</option>
                                            <option value="GUEST">Guest</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.actions} style={{ marginTop: "auto", paddingTop: "20px" }}>
                    <button onClick={onClose} className={styles.cancel}>Close</button>
                </div>
            </div>
        </div>
    );
}
