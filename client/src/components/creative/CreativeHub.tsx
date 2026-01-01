"use client";

import React, { useState, useEffect } from "react";
import CreativeSidebar, { NavItem } from "./CreativeSidebar";
import ContactList, { Contact } from "./ContactList";
import CalendarView, { Event } from "./CalendarView";
import PublicEvents from "./PublicEvents";
import CreativeModal from "./CreativeModal";
import AddContactForm from "./AddContactForm";
import ScheduleEventForm from "./ScheduleEventForm";
import { Grid, List, Bell, Search, Layout as LayoutIcon, UserPlus, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { socketService } from "@/lib/socket";
import styles from "./CreativeHub.module.css";

export default function CreativeHub() {
    const { user } = useAuthStore();
    const [activeNavItem, setActiveNavItem] = useState<NavItem>("contacts");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    // Modal States
    const [activeModal, setActiveModal] = useState<"contact" | "event" | null>(null);

    useEffect(() => {
        fetchContacts();
        fetchEvents();

        socketService.socket?.on("presence-update", (data: { userId: string, status: string }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                if (data.status === "online") next.add(data.userId);
                else next.delete(data.userId);
                return next;
            });
        });

        return () => {
            socketService.socket?.off("presence-update");
        };
    }, []);

    const fetchContacts = async (query = searchQuery, category = "All") => {
        setIsLoading(true);
        try {
            const data = await api.get<Contact[]>(`/contacts?search=${query}&category=${category}`);
            setContacts(data);
        } catch (error) {
            console.error("Failed to fetch contacts", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEvents = async (type = "All") => {
        try {
            const data = await api.get<Event[]>(`/events?type=${type}`);
            setEvents(data);
        } catch (error) {
            console.error("Failed to fetch events", error);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        fetchContacts(query);
    };

    const handleToggleFavorite = async (contactId: string, isFavorite: boolean) => {
        try {
            await api.patch(`/contacts/${contactId}/favorite`, { isFavorite: !isFavorite });
            setContacts(prev => prev.map(c => c.id === contactId ? { ...c, isFavorite: !isFavorite } : c));
        } catch (error) {
            console.error("Failed to toggle favorite", error);
        }
    };

    const handleDeleteContact = async (contactId: string) => {
        if (confirm("Are you sure you want to delete this contact?")) {
            try {
                await api.delete(`/contacts/${contactId}`);
                fetchContacts();
            } catch (error) {
                console.error("Failed to delete contact", error);
            }
        }
    };

    const renderContent = () => {
        if (isLoading && activeNavItem === "contacts") {
            return (
                <div className={styles.loaderContainer}>
                    <div className="spinner" />
                    <p>Syncing with your network...</p>
                </div>
            );
        }

        switch (activeNavItem) {
            case "contacts":
            case "favorites":
                const displayContacts = activeNavItem === "favorites"
                    ? contacts.filter(c => c.isFavorite)
                    : contacts;

                return (
                    <ContactList
                        contacts={displayContacts.map(c => ({
                            ...c,
                            status: onlineUsers.has(c.contactId || "") ? "active" : "offline"
                        }))}
                        viewMode={viewMode}
                        onToggleFavorite={handleToggleFavorite}
                        onDelete={handleDeleteContact}
                    />
                );
            case "calendar":
                return <CalendarView events={events} onEventUpdate={fetchEvents} />;
            case "events":
                return <PublicEvents events={events.filter(e => e.type === "Public")} />;
            default:
                return <div>Select an item from the sidebar</div>;
        }
    };

    return (
        <div className={styles.container}>
            <CreativeSidebar
                activeItem={activeNavItem}
                onNavItemChange={setActiveNavItem}
                onSearch={handleSearch}
                user={user}
            />

            <main className={styles.main}>
                <header className={styles.header}>
                    <div className={styles.titleArea}>
                        <h1>{activeNavItem.charAt(0).toUpperCase() + activeNavItem.slice(1)}</h1>
                        {activeNavItem === "contacts" && (
                            <div className={styles.stats}>
                                <span className={styles.stat}>{contacts.length} Contacts</span>
                                <span className={styles.statDot} />
                                <span className={styles.stat}>{Array.from(onlineUsers).length} Online</span>
                            </div>
                        )}
                    </div>

                    <div className={styles.topActions}>
                        {(activeNavItem === "contacts" || activeNavItem === "favorites") && (
                            <div className={styles.viewModes}>
                                <button
                                    className={`${styles.modeBtn} ${viewMode === "grid" ? styles.modeActive : ""}`}
                                    onClick={() => setViewMode("grid")}
                                    title="Grid View"
                                >
                                    <Grid size={18} />
                                </button>
                                <button
                                    className={`${styles.modeBtn} ${viewMode === "list" ? styles.modeActive : ""}`}
                                    onClick={() => setViewMode("list")}
                                    title="List View"
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        )}
                        <button className={styles.addBtn} onClick={() => setActiveModal(activeNavItem === "calendar" ? "event" : "contact")}>
                            <Plus size={18} />
                            <span>{activeNavItem === "calendar" ? "New Event" : "Add Contact"}</span>
                        </button>
                        <button className={styles.headerIconBtn}><Bell size={20} /></button>
                        <div className={styles.userProfile}>
                            <div className={styles.headerAvatar}>
                                {user?.name?.charAt(0) || "U"}
                            </div>
                        </div>
                    </div>
                </header>

                <div className={styles.content}>
                    {renderContent()}
                </div>
            </main>

            {/* Modals */}
            {activeModal === "contact" && (
                <CreativeModal title="Add New Contact" onClose={() => setActiveModal(null)}>
                    <AddContactForm
                        onSuccess={() => {
                            setActiveModal(null);
                            fetchContacts();
                        }}
                        onCancel={() => setActiveModal(null)}
                    />
                </CreativeModal>
            )}

            {activeModal === "event" && (
                <CreativeModal title="Schedule New Event" onClose={() => setActiveModal(null)}>
                    <ScheduleEventForm
                        onSuccess={() => {
                            setActiveModal(null);
                            fetchEvents();
                        }}
                        onCancel={() => setActiveModal(null)}
                    />
                </CreativeModal>
            )}
        </div>
    );
}
