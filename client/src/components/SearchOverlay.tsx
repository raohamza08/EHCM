"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, MessageSquare, User, Calendar, Hash, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useChatStore } from "@/store/useChatStore";
import styles from "./SearchOverlay.module.css";

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<{ messages: any[], contacts: any[], events: any[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { activeWorkspaceId, setActiveChannel, setActiveWorkspace } = useChatStore();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (query.length < 2) {
            setResults(null);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsLoading(true);
            try {
                const data = await api.get<any>(`/search?q=${query}${activeWorkspaceId ? `&workspaceId=${activeWorkspaceId}` : ""}`);
                setResults(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query, activeWorkspaceId]);

    const handleResultClick = (type: string, item: any) => {
        if (type === "message") {
            setActiveChannel(item.channelId);
            onClose();
        } else if (type === "contact") {
            // Logic to open DM with contact
            alert(`Opening DM with ${item.name}`);
            onClose();
        } else if (type === "event") {
            useChatStore.getState().setCurrentView("creative");
            onClose();
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.container} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search for messages, contacts, or events..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className={styles.input}
                    />
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>}
                </header>

                <div className={styles.content}>
                    {!results && !isLoading && (
                        <div className={styles.empty}>
                            <p>Type at least 2 characters to search across EuroCom</p>
                            <div className={styles.hints}>
                                <div className={styles.hint}><MessageSquare size={14} /> Messages</div>
                                <div className={styles.hint}><Hash size={14} /> Channels</div>
                                <div className={styles.hint}><User size={14} /> Contacts</div>
                                <div className={styles.hint}><Calendar size={14} /> Events</div>
                            </div>
                        </div>
                    )}

                    {results && (
                        <div className={styles.results}>
                            {results.messages.length > 0 && (
                                <section className={styles.section}>
                                    <h5>Messages</h5>
                                    {results.messages.map(m => (
                                        <div key={m.id} className={styles.resultItem} onClick={() => handleResultClick("message", m)}>
                                            <MessageSquare size={16} className={styles.typeIcon} />
                                            <div className={styles.details}>
                                                <div className={styles.title}>{m.content}</div>
                                                <div className={styles.meta}>#{m.channel.name} • {m.sender.name}</div>
                                            </div>
                                            <ArrowRight size={14} className={styles.arrow} />
                                        </div>
                                    ))}
                                </section>
                            )}

                            {results.contacts.length > 0 && (
                                <section className={styles.section}>
                                    <h5>Contacts</h5>
                                    {results.contacts.map(c => (
                                        <div key={c.id} className={styles.resultItem} onClick={() => handleResultClick("contact", c)}>
                                            <User size={16} className={styles.typeIcon} />
                                            <div className={styles.details}>
                                                <div className={styles.title}>{c.name}</div>
                                                <div className={styles.meta}>{c.company || "No Company"} • {c.email}</div>
                                            </div>
                                            <ArrowRight size={14} className={styles.arrow} />
                                        </div>
                                    ))}
                                </section>
                            )}

                            {results.events.length > 0 && (
                                <section className={styles.section}>
                                    <h5>Events</h5>
                                    {results.events.map(e => (
                                        <div key={e.id} className={styles.resultItem} onClick={() => handleResultClick("event", e)}>
                                            <Calendar size={16} className={styles.typeIcon} />
                                            <div className={styles.details}>
                                                <div className={styles.title}>{e.title}</div>
                                                <div className={styles.meta}>{new Date(e.startTime).toLocaleDateString()} • {e.location || "Online"}</div>
                                            </div>
                                            <ArrowRight size={14} className={styles.arrow} />
                                        </div>
                                    ))}
                                </section>
                            )}

                            {results.messages.length === 0 && results.contacts.length === 0 && results.events.length === 0 && (
                                <div className={styles.noResults}>No matches found for "{query}"</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
