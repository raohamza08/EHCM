"use client";

import React, { useState } from "react";
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Plus,
    Tag,
    ChevronLeft,
    ChevronRight,
    Users,
    Video,
    Phone,
    Trash2
} from "lucide-react";
import { api } from "@/lib/api";
import styles from "./CalendarView.module.css";

export interface Event {
    id: string;
    title: string;
    type: "Work" | "Personal" | "Public";
    date: string; // ISO or human readable string
    startTime: string | Date;
    duration: string;
    priority: "Low" | "Medium" | "High";
    participants: any[]; // User objects
    location?: string;
    description?: string;
}

interface CalendarViewProps {
    events: Event[];
    onEventUpdate: () => void;
}

export default function CalendarView({ events, onEventUpdate }: CalendarViewProps) {
    const [viewType, setViewType] = useState<"timeline" | "grid">("timeline");
    const [filterType, setFilterType] = useState<string>("All");

    const filteredEvents = filterType === "All"
        ? events
        : events.filter(e => e.type === filterType);

    const categories = ["All", "Work", "Personal", "Public"];

    const handleDeleteEvent = async (id: string) => {
        if (confirm("Are you sure you want to delete this event?")) {
            try {
                await api.delete(`/events/${id}`);
                onEventUpdate();
            } catch (error) {
                console.error("Failed to delete event", error);
            }
        }
    };

    const handleJoinCall = (event: Event) => {
        alert(`Joining call for "${event.title}"...`);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.left}>
                    <div className={styles.dateNav}>
                        <button className={styles.navBtn}><ChevronLeft size={20} /></button>
                        <h2>January 2026</h2>
                        <button className={styles.navBtn}><ChevronRight size={20} /></button>
                    </div>
                </div>

                <div className={styles.actions}>
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.toggleBtn} ${viewType === "timeline" ? styles.toggleActive : ""}`}
                            onClick={() => setViewType("timeline")}
                        >
                            Timeline
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${viewType === "grid" ? styles.toggleActive : ""}`}
                            onClick={() => setViewType("grid")}
                        >
                            Grid
                        </button>
                    </div>
                    <button className={styles.scheduleBtn} onClick={() => alert("Schedule Event Modal Coming Soon!")}>
                        <Plus size={18} />
                        <span>Schedule a Call</span>
                    </button>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.filterSidebar}>
                    <h4 className={styles.sidebarTitle}>Categories</h4>
                    <div className={styles.filterList}>
                        {categories.map(cat => (
                            <label key={cat} className={styles.filterItem}>
                                <input
                                    type="radio"
                                    name="eventFilter"
                                    checked={filterType === cat}
                                    onChange={() => setFilterType(cat)}
                                />
                                <span className={styles.filterLabel}>
                                    <div className={`${styles.typeIndicator} ${styles[cat.toLowerCase()]}`} />
                                    {cat}
                                </span>
                            </label>
                        ))}
                    </div>

                    <div className={styles.quickMiniCalendar}>
                        <div className={styles.miniCalPlaceholder}>
                            Mini Calendar Sync Active
                        </div>
                    </div>
                </div>

                <div className={styles.mainView}>
                    {viewType === "timeline" ? (
                        <div className={styles.timeline}>
                            {filteredEvents.length > 0 ? (
                                filteredEvents.map((event, idx) => (
                                    <TimelineEvent
                                        key={event.id}
                                        event={event}
                                        isFirst={idx === 0}
                                        onDelete={handleDeleteEvent}
                                        onJoin={handleJoinCall}
                                    />
                                ))
                            ) : (
                                <div className={styles.emptyState}>No events scheduled for this period.</div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.gridView}>
                            <div className={styles.gridPlaceholder}>
                                Monthly Grid View Implementation [Beta]
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TimelineEvent({ event, isFirst, onDelete, onJoin }: {
    event: Event,
    isFirst: boolean,
    onDelete: (id: string) => void,
    onJoin: (event: Event) => void
}) {
    const priorityColors = {
        High: "var(--error)",
        Medium: "var(--accent-orange)",
        Low: "var(--accent-blue)"
    };

    const startTimeFormatted = typeof event.startTime === 'string'
        ? event.startTime
        : new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={styles.timelineItem}>
            <div className={styles.timeColumn}>
                <span className={styles.time}>{startTimeFormatted}</span>
                <span className={styles.duration}>{event.duration}</span>
                <div className={styles.line} />
                {isFirst && <div className={styles.timeDot} />}
            </div>

            <div className={`${styles.eventCard} ${styles[event.type.toLowerCase() + 'Card']}`}>
                <div className={styles.eventHeader}>
                    <div className={styles.titleRow}>
                        <h3 className={styles.eventTitle}>{event.title}</h3>
                        <div className={styles.cardHeaderActions}>
                            <div
                                className={styles.priorityBadge}
                                style={{ borderColor: priorityColors[event.priority], color: priorityColors[event.priority] }}
                            >
                                {event.priority}
                            </div>
                            <button className={styles.deleteEventBtn} onClick={() => onDelete(event.id)}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    <div className={styles.eventMeta}>
                        <div className={styles.metaItem}><Clock size={14} /> {event.date}</div>
                        {event.location && <div className={styles.metaItem}><MapPin size={14} /> {event.location}</div>}
                    </div>
                </div>

                <div className={styles.eventBody}>
                    <p>{event.description || "No description provided."}</p>
                </div>

                <div className={styles.eventFooter}>
                    <div className={styles.participants}>
                        {event.participants?.slice(0, 3).map((p, i) => (
                            <div key={i} className={styles.miniAvatar} title={p.user?.name || "User"}>
                                {p.user?.name?.[0] || "?"}
                            </div>
                        ))}
                        {event.participants?.length > 3 && <div className={styles.moreParticipants}>+{event.participants.length - 3}</div>}
                    </div>
                    <div className={styles.cardActions}>
                        <button className={styles.joinBtn} onClick={() => onJoin(event)}><Video size={14} /> Join Call</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
