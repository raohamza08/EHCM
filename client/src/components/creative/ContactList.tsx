"use client";

import React, { useState } from "react";
import {
    Mail,
    Phone,
    MessageSquare,
    Video,
    MoreVertical,
    ExternalLink,
    Tag,
    Star,
    Trash2
} from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import styles from "./ContactList.module.css";

export interface Contact {
    id: string;
    contactId?: string; // Links to a system User ID
    name: string;
    company: string;
    role: string;
    email: string;
    phone: string;
    status: "active" | "away" | "offline";
    category: "Work" | "Friends" | "Family" | "Professional";
    isFavorite: boolean;
    image?: string;
}

interface ContactListProps {
    contacts: Contact[];
    viewMode: "grid" | "list";
    onToggleFavorite: (id: string, current: boolean) => void;
    onDelete?: (id: string) => void;
}

export default function ContactList({ contacts, viewMode, onToggleFavorite, onDelete }: ContactListProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    const categories = ["All", "Work", "Friends", "Family", "Professional"];

    const filteredContacts = selectedCategory === "All"
        ? contacts
        : contacts.filter(c => c.category === selectedCategory);

    return (
        <div className={styles.container}>
            <div className={styles.filterBar}>
                <div className={styles.categories}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`${styles.catBtn} ${selectedCategory === cat ? styles.catActive : ""}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className={`${styles.list} ${viewMode === "grid" ? styles.gridView : styles.listView}`}>
                {filteredContacts.map(contact => (
                    <ContactCard
                        key={contact.id}
                        contact={contact}
                        viewMode={viewMode}
                        onToggleFavorite={onToggleFavorite}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </div>
    );
}

function ContactCard({ contact, viewMode, onToggleFavorite, onDelete }: {
    contact: Contact,
    viewMode: "grid" | "list",
    onToggleFavorite: (id: string, current: boolean) => void,
    onDelete?: (id: string) => void
}) {
    const { setCurrentView, setActiveChannel } = useChatStore();

    const handleMessage = () => {
        // In a real app, you'd find or create a DM channel with this contact
        // For now, we switch to chat and alert
        setCurrentView("chat");
        alert(`Starting chat with ${contact.name}. Redirecting to Messaging...`);
    };

    const handleCall = () => {
        alert(`Initiating audio call to ${contact.phone}...`);
    };

    const handleVideo = () => {
        alert(`Starting video conference with ${contact.name}...`);
    };

    return (
        <div className={`${styles.card} ${viewMode === "list" ? styles.cardList : ""}`}>
            <div className={styles.cardMain}>
                <div className={styles.avatarContainer}>
                    <div className={styles.cardAvatar}>
                        {contact.image ? (
                            <img src={contact.image} alt={contact.name} />
                        ) : (
                            contact.name.split(' ').map(n => n[0]).join('')
                        )}
                    </div>
                    <div className={`${styles.statusDot} ${styles[contact.status]}`} />
                </div>

                <div className={styles.info}>
                    <div className={styles.nameRow}>
                        <h3>{contact.name}</h3>
                        <button
                            className={styles.favBtn}
                            onClick={() => onToggleFavorite(contact.id, contact.isFavorite)}
                        >
                            <Star size={14} className={contact.isFavorite ? styles.favActive : styles.favIcon} fill={contact.isFavorite ? "currentColor" : "none"} />
                        </button>
                    </div>
                    <p className={styles.role}>{contact.role} at {contact.company}</p>
                </div>
            </div>

            {viewMode === "list" && (
                <div className={styles.contactDetails}>
                    <div className={styles.detailItem}>
                        <Mail size={14} />
                        <span>{contact.email}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <Tag size={14} />
                        <span>{contact.category}</span>
                    </div>
                </div>
            )}

            <div className={styles.cardActions}>
                <button className={styles.iconBtn} onClick={handleMessage} title="Message"><MessageSquare size={18} /></button>
                <button className={styles.iconBtn} onClick={handleCall} title="Call"><Phone size={18} /></button>
                <button className={styles.iconBtn} onClick={handleVideo} title="Video"><Video size={18} /></button>
                <div className={styles.divider} />
                <button className={styles.deleteBtn} onClick={() => onDelete?.(contact.id)} title="Delete Contact">
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
