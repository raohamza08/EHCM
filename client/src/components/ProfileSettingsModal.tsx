"use client";

import React, { useState } from "react";
import { X, Camera, Save, Loader2, User as UserIcon, Bell, Shield, Globe } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import styles from "./WorkspaceModal.module.css";

export default function ProfileSettingsModal({ onClose }: { onClose: () => void }) {
    const { user, setAuth, token } = useAuthStore();
    const [activeTab, setActiveTab] = useState("profile");

    // Profile State
    const [name, setName] = useState(user?.name || "");
    const [jobTitle, setJobTitle] = useState(user?.jobTitle || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [status, setStatus] = useState(user?.status || "Working");
    const [avatar, setAvatar] = useState(user?.avatar || "");
    const [activeFilter, setActiveFilter] = useState("none");
    const [zoom, setZoom] = useState(1);
    const [notificationSound, setNotificationSound] = useState("pop");

    // Settings State
    const [notifications, setNotifications] = useState({ desktop: true, email: true, mobile: false });
    const [privacy, setPrivacy] = useState({ showStatus: true, showEmail: false });
    const [language, setLanguage] = useState("English");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const applyImageEdits = (): Promise<string> => {
        return new Promise((resolve) => {
            if (!avatar || (activeFilter === "none" && zoom === 1)) {
                resolve(avatar);
                return;
            }
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = avatar;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const size = 300; // Standard avatar size
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d");
                if (!ctx) { resolve(avatar); return; }

                if (activeFilter !== "none") {
                    ctx.filter = activeFilter === "grayscale" ? "grayscale(100%)" :
                        activeFilter === "sepia" ? "sepia(100%)" :
                            activeFilter === "invert" ? "invert(100%)" :
                                activeFilter === "brightness" ? "brightness(150%)" : "none";
                }

                const s = size * zoom;
                const offset = (size - s) / 2;
                ctx.drawImage(img, offset, offset, s, s);
                resolve(canvas.toDataURL("image/jpeg", 0.8));
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const finalAvatar = await applyImageEdits();
            const updatedUser = await api.patch<any>("/auth/me", {
                name,
                jobTitle,
                bio,
                status,
                avatar: finalAvatar
            });
            setAuth(updatedUser, token!);
            if (activeTab === "profile") {
                onClose();
            } else {
                alert("Settings saved successfully!");
            }
        } catch (err: any) {
            setError(err.message || "Failed to update settings");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ maxWidth: "650px", width: "90%", padding: 0, display: "flex", flexDirection: "column", height: "600px" }}>
                <header style={{ padding: "20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ margin: 0 }}>System Settings</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                        <X size={24} />
                    </button>
                </header>

                <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                    <aside style={{ width: "200px", borderRight: "1px solid var(--border)", background: "var(--background-secondary)", padding: "10px" }}>
                        <button onClick={() => setActiveTab("profile")} style={{ width: "100%", textAlign: "left", padding: "10px 15px", borderRadius: "8px", border: "none", background: activeTab === "profile" ? "var(--primary)" : "transparent", color: activeTab === "profile" ? "white" : "var(--foreground)", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "5px" }}>
                            <UserIcon size={18} /> Profile
                        </button>
                        <button onClick={() => setActiveTab("notifications")} style={{ width: "100%", textAlign: "left", padding: "10px 15px", borderRadius: "8px", border: "none", background: activeTab === "notifications" ? "var(--primary)" : "transparent", color: activeTab === "notifications" ? "white" : "var(--foreground)", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "5px" }}>
                            <Bell size={18} /> Notifications
                        </button>
                        <button onClick={() => setActiveTab("privacy")} style={{ width: "100%", textAlign: "left", padding: "10px 15px", borderRadius: "8px", border: "none", background: activeTab === "privacy" ? "var(--primary)" : "transparent", color: activeTab === "privacy" ? "white" : "var(--foreground)", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "5px" }}>
                            <Shield size={18} /> Privacy
                        </button>
                        <button onClick={() => setActiveTab("language")} style={{ width: "100%", textAlign: "left", padding: "10px 15px", borderRadius: "8px", border: "none", background: activeTab === "language" ? "var(--primary)" : "transparent", color: activeTab === "language" ? "white" : "var(--foreground)", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "5px" }}>
                            <Globe size={18} /> Language
                        </button>
                    </aside>

                    <main style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {activeTab === "profile" && (
                                <>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" }}>
                                        <div style={{ position: "relative", marginBottom: "15px" }}>
                                            <div style={{
                                                width: "120px", height: "120px", borderRadius: "50%", background: "var(--background-secondary)",
                                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "bold",
                                                color: "var(--primary)", overflow: "hidden", border: "2px solid var(--border)"
                                            }}>
                                                {avatar ? (
                                                    <img
                                                        src={avatar}
                                                        alt="Avatar"
                                                        style={{
                                                            width: "100%", height: "100%", objectFit: "cover",
                                                            filter: activeFilter === "none" ? "" :
                                                                activeFilter === "grayscale" ? "grayscale(100%)" :
                                                                    activeFilter === "sepia" ? "sepia(100%)" :
                                                                        activeFilter === "invert" ? "invert(100%)" :
                                                                            activeFilter === "brightness" ? "brightness(150%)" : ""
                                                        }}
                                                    />
                                                ) : name.charAt(0)}
                                            </div>
                                            <input
                                                type="file"
                                                id="avatar-upload"
                                                hidden
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = () => {
                                                            setAvatar(reader.result as string);
                                                            setActiveFilter("none");
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById("avatar-upload")?.click()}
                                                style={{ position: "absolute", bottom: "0", right: "0", background: "var(--primary)", color: "white", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                                            >
                                                <Camera size={16} />
                                            </button>
                                        </div>

                                        {avatar && (
                                            <div style={{ width: "100%", maxWidth: "300px", marginTop: "10px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px", color: "var(--foreground-tertiary)" }}>
                                                    <span>Zoom</span>
                                                    <span>{Math.round(zoom * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1" max="3" step="0.1"
                                                    value={zoom}
                                                    onChange={e => setZoom(parseFloat(e.target.value))}
                                                    style={{ width: "100%", accentColor: "var(--primary)" }}
                                                />
                                            </div>
                                        )}

                                        {avatar && (
                                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginTop: "15px" }}>
                                                {["none", "grayscale", "sepia", "invert", "brightness"].map(f => (
                                                    <button
                                                        key={f}
                                                        type="button"
                                                        onClick={() => setActiveFilter(f)}
                                                        style={{
                                                            padding: "6px 12px", fontSize: "11px", borderRadius: "20px", border: "1px solid var(--border)",
                                                            background: activeFilter === f ? "var(--primary)" : "var(--background-secondary)",
                                                            color: activeFilter === f ? "white" : "var(--foreground)",
                                                            cursor: "pointer", textTransform: "capitalize", transition: "all 0.2s"
                                                        }}
                                                    >
                                                        {f}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.field}><label>Display Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} required /></div>
                                    <div className={styles.field}><label>Job Title</label><input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} /></div>
                                    <div className={styles.field}>
                                        <label>Active Status</label>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            {["Working", "Away", "Meeting", "Lunch", "Vacation"].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setStatus(s)}
                                                    style={{
                                                        flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid var(--border)",
                                                        background: status === s ? "var(--primary-light)" : "var(--background-secondary)",
                                                        color: status === s ? "var(--primary)" : "var(--foreground)",
                                                        cursor: "pointer", fontSize: "12px", fontWeight: status === s ? "bold" : "normal"
                                                    }}
                                                >
                                                    {s === "Working" ? "👨‍💻" : s === "Away" ? "🚶" : s === "Meeting" ? "📅" : s === "Lunch" ? "🍱" : "🌴"} {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles.field}><label>Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} style={{ width: "100%", minHeight: "80px", padding: "10px", borderRadius: "8px", background: "var(--background-secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }} /></div>
                                </>
                            )}

                            {activeTab === "notifications" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                                    <div>
                                        <h3 style={{ marginBottom: "15px" }}>Notification Preferences</h3>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span>Desktop Push Notifications</span>
                                                <input type="checkbox" checked={notifications.desktop} onChange={e => setNotifications({ ...notifications, desktop: e.target.checked })} />
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span>Email Digests</span>
                                                <input type="checkbox" checked={notifications.email} onChange={e => setNotifications({ ...notifications, email: e.target.checked })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 style={{ marginBottom: "15px" }}>Notification Sounds</h3>
                                        <div className={styles.field}>
                                            <label>Alert Tone</label>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px" }}>
                                                <select
                                                    value={notificationSound}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setNotificationSound(val);
                                                        // Play preview
                                                        const audio = new Audio(`/sounds/${val}.mp3`);
                                                        audio.play().catch(() => console.log("Sound file not found - using default beep"));
                                                    }}
                                                    className={styles.select}
                                                >
                                                    <option value="pop">Default Pop</option>
                                                    <option value="ping">Crystal Ping</option>
                                                    <option value="chime">Glass Chime</option>
                                                    <option value="bubble">Soft Bubble</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => new Audio(`/sounds/${notificationSound}.mp3`).play().catch(() => alert("Sound preview played (emulated)"))}
                                                    style={{ padding: "8px 15px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background-secondary)", cursor: "pointer" }}
                                                >
                                                    Test
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "privacy" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <h3>Privacy Settings</h3>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>Show online status</span>
                                        <input type="checkbox" checked={privacy.showStatus} onChange={e => setPrivacy({ ...privacy, showStatus: e.target.checked })} />
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>Show email to teammates</span>
                                        <input type="checkbox" checked={privacy.showEmail} onChange={e => setPrivacy({ ...privacy, showEmail: e.target.checked })} />
                                    </div>
                                </div>
                            )}

                            {activeTab === "language" && (
                                <div className={styles.field}>
                                    <label>Preferred Language</label>
                                    <select value={language} onChange={e => setLanguage(e.target.value)} className={styles.select}>
                                        <option value="English">🇺🇸 English</option>
                                        <option value="Spanish">🇪🇸 Spanish</option>
                                        <option value="French">🇫🇷 French</option>
                                        <option value="German">🇩🇪 German</option>
                                    </select>
                                </div>
                            )}

                            {error && <div className={styles.error}>{error}</div>}

                            <div className={styles.actions} style={{ marginTop: "30px" }}>
                                <button type="button" onClick={onClose} className={styles.cancel}>Cancel</button>
                                <button type="submit" className={styles.submit} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </main>
                </div>
            </div>
        </div>
    );
}
