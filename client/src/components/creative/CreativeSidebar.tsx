"use client";

import React, { useState } from "react";
import {
    Users,
    Star,
    Calendar,
    Globe,
    ChevronLeft,
    ChevronRight,
    Search,
    MessageSquare,
    Phone,
    Video,
    Bell,
    Settings,
    Plus,
    MessageCircle
} from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import styles from "./CreativeSidebar.module.css";

export type NavItem = "contacts" | "favorites" | "events" | "calendar";

interface CreativeSidebarProps {
    activeItem: NavItem;
    onNavItemChange: (item: NavItem) => void;
    onSearch?: (query: string) => void;
    user: any;
}

export default function CreativeSidebar({ activeItem, onNavItemChange, onSearch, user }: CreativeSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const navItems = [
        { id: "contacts", label: "Contacts", icon: Users },
        { id: "favorites", label: "Favorites", icon: Star },
        { id: "events", label: "Public Events", icon: Globe },
        { id: "calendar", label: "Calendar", icon: Calendar },
    ];

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (onSearch) onSearch(val);
    };

    return (
        <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
            <div className={styles.header}>
                {!isCollapsed && <span className={styles.logo}>EuroCom</span>}
                <button
                    className={styles.collapseBtn}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            <div className={styles.searchContainer}>
                <div className={styles.searchWrapper}>
                    <Search size={16} className={styles.searchIcon} />
                    {!isCollapsed && (
                        <input
                            type="text"
                            placeholder="Quick Search..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    )}
                </div>
            </div>

            <div className={styles.modeSwitch}>
                <button
                    className={styles.chatModeBtn}
                    onClick={() => useChatStore.getState().setCurrentView("chat")}
                >
                    <MessageCircle size={18} />
                    {!isCollapsed && <span>Switch to Chat</span>}
                </button>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            className={`${styles.navItem} ${activeItem === item.id ? styles.active : ""}`}
                            onClick={() => onNavItemChange(item.id as NavItem)}
                            title={isCollapsed ? item.label : ""}
                        >
                            <Icon size={20} />
                            {!isCollapsed && <span>{item.label}</span>}
                            {activeItem === item.id && <div className={styles.activeIndicator} />}
                        </button>
                    );
                })}
            </nav>

            <div className={styles.footer}>
                <div className={styles.actions}>
                    <button className={styles.actionBtn} title="Notifications">
                        <Bell size={20} />
                        <span className={styles.notifBadge} />
                    </button>
                    <button className={styles.actionBtn} title="Settings">
                        <Settings size={20} />
                    </button>
                </div>
                {!isCollapsed && (
                    <div className={styles.profile}>
                        <div className={styles.avatar}>
                            {user?.name?.split(' ').map((n: string) => n[0]).join('') || "U"}
                        </div>
                        <div className={styles.profileInfo}>
                            <span className={styles.profileName}>{user?.name || "User"}</span>
                            <span className={styles.profileStatus}>Online</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
