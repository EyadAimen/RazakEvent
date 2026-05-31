"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import styles from "./clubDetails.module.css";

import {
    AvailableUser,
    ClubDetails,
    ClubEvent,
    ClubMember,
} from "./utils/interface/clubDetails.interface";

import {
    addClubMember,
    changeClubLead,
    createApprovedEvent,
    deleteApprovedEvent,
    deleteClubById,
    fetchAvailableUsers,
    fetchClubById,
    fetchClubEvents,
    fetchClubMembers,
    removeClubMember,
    updateApprovedEvent,
    updateClubDetails,
} from "./utils/services/clubDetails.services";

export default function ClubDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const clubId = Number(params.id);

    const [club, setClub] = useState<ClubDetails | null>(null);
    const [members, setMembers] = useState<ClubMember[]>([]);
    const [events, setEvents] = useState<ClubEvent[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"about" | "members" | "events" | "edit">("about");
    const [memberSort, setMemberSort] = useState<"asc" | "desc">("asc");

    const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState<boolean>(false);
    const [deleteReason, setDeleteReason] = useState<string>("");

    const [isAddMemberDrawerOpen, setIsAddMemberDrawerOpen] = useState<boolean>(false);
    const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
    const [userSearch, setUserSearch] = useState<string>("");

    const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState<boolean>(false);
    const [editName, setEditName] = useState<string>("");
    const [editType, setEditType] = useState<"club" | "community">("club");
    const [editDescription, setEditDescription] = useState<string>("");

    const [isAddEventDrawerOpen, setIsAddEventDrawerOpen] = useState<boolean>(false);
    const [eventName, setEventName] = useState<string>("");
    const [eventDescription, setEventDescription] = useState<string>("");
    const [eventDate, setEventDate] = useState<string>("");
    const [eventVenueId, setEventVenueId] = useState<string>("");
    const [eventBudget, setEventBudget] = useState<string>("");

    const [isEditEventDrawerOpen, setIsEditEventDrawerOpen] = useState<boolean>(false);
    const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);
    const [editEventName, setEditEventName] = useState<string>("");
    const [editEventDescription, setEditEventDescription] = useState<string>("");
    const [editEventDate, setEditEventDate] = useState<string>("");
    const [editEventVenueId, setEditEventVenueId] = useState<string>("");

    useEffect(() => {
        const tab = searchParams.get("tab");

        if (tab === "members") {
            setActiveTab("members");
        } else if (tab === "events") {
            setActiveTab("events");
        } else if (tab === "edit") {
            setActiveTab("edit");
        } else {
            setActiveTab("about");
        }
    }, [searchParams]);

    const loadClub = async () => {
        try {
            setLoading(true);

            const [clubData, membersData, eventsData] = await Promise.all([
                fetchClubById(clubId),
                fetchClubMembers(clubId),
                fetchClubEvents(clubId),
            ]);

            setClub(clubData);
            setMembers(membersData.members ?? []);
            setEvents(eventsData.events ?? []);

            if (clubData) {
                setEditName(clubData.name);
                setEditType(clubData.type);
                setEditDescription(clubData.description);
            }
        } catch (err) {
            console.error("Failed to load club:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (clubId) {
            loadClub();
        }
    }, [clubId]);

    const getInitials = (name?: string) => {
        if (!name) return "??";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    };

    const formatDateForInput = (value?: string) => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toISOString().slice(0, 16);
    };

    const closeAllDrawers = () => {
        setIsDeleteDrawerOpen(false);
        setIsAddMemberDrawerOpen(false);
        setIsSettingsDrawerOpen(false);
        setIsAddEventDrawerOpen(false);
        setIsEditEventDrawerOpen(false);
    };

    const closeDeleteDrawer = () => {
        setIsDeleteDrawerOpen(false);
        setDeleteReason("");
    };

    const handleDeleteClub = async () => {
        if (!club) return;
        if (!deleteReason.trim()) {
            alert("Delete reason is required.");
            return;
        }

        try {
            setActionLoading(true);
            await deleteClubById(club.id, deleteReason);
            router.push("/clubs");
        } catch (err: any) {
            alert(err.message || "Failed to delete club.");
        } finally {
            setActionLoading(false);
        }
    };

    const openAddMemberDrawer = async () => {
        try {
            setIsAddMemberDrawerOpen(true);
            setUserSearch("");
            const data = await fetchAvailableUsers("");
            setAvailableUsers(data.users ?? []);
        } catch (err: any) {
            alert(err.message || "Failed to load available users.");
        }
    };

    const searchUsers = async (value: string) => {
        try {
            setUserSearch(value);
            const data = await fetchAvailableUsers(value);
            setAvailableUsers(data.users ?? []);
        } catch (err) {
            console.error("Failed to search users:", err);
        }
    };

    const handleAddMember = async (userId: string) => {
        try {
            setActionLoading(true);
            await addClubMember(clubId, userId);
            setIsAddMemberDrawerOpen(false);
            setUserSearch("");
            await loadClub();
        } catch (err: any) {
            alert(err.message || "Failed to add member.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveMember = async (member: ClubMember) => {
        if (member.role === "LEADER") {
            alert("Assign another lead before removing the current lead.");
            return;
        }
        if (!confirm(`Remove ${member.fullName} from this club?`)) return;

        try {
            setActionLoading(true);
            await removeClubMember(clubId, member.userId);
            await loadClub();
        } catch (err: any) {
            alert(err.message || "Failed to remove member.");
        } finally {
            setActionLoading(false);
        }
    };

    const handlePromoteLead = async (member: ClubMember) => {
        if (member.role === "LEADER") return;
        if (!confirm(`Make ${member.fullName} the new club lead?`)) return;

        try {
            setActionLoading(true);
            await changeClubLead(clubId, member.userId);
            await loadClub();
        } catch (err: any) {
            alert(err.message || "Failed to change club lead.");
        } finally {
            setActionLoading(false);
        }
    };

    const openSettingsDrawer = () => {
        if (club) {
            setEditName(club.name);
            setEditType(club.type);
            setEditDescription(club.description);
        }
        setIsSettingsDrawerOpen(true);
    };

    const handleSaveSettings = async () => {
        if (!editName.trim()) {
            alert("Club name is required.");
            return;
        }
        if (!editDescription.trim()) {
            alert("Description is required.");
            return;
        }

        try {
            setActionLoading(true);
            await updateClubDetails(clubId, {
                name: editName,
                type: editType,
                description: editDescription,
            });
            setIsSettingsDrawerOpen(false);
            await loadClub();
        } catch (err: any) {
            alert(err.message || "Failed to update club details.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateEvent = async () => {
        if (!eventName.trim()) {
            alert("Event name is required.");
            return;
        }
        if (!eventDescription.trim()) {
            alert("Event description is required.");
            return;
        }
        if (!eventDate) {
            alert("Event date is required.");
            return;
        }
        if (!eventVenueId.trim()) {
            alert("Venue ID is required.");
            return;
        }

        try {
            setActionLoading(true);
            await createApprovedEvent({
                clubId,
                venueId: Number(eventVenueId),
                name: eventName,
                description: eventDescription,
                eventDate,
                estimatedBudget: Number(eventBudget || 0),
            });
            setEventName("");
            setEventDescription("");
            setEventDate("");
            setEventVenueId("");
            setEventBudget("");
            setIsAddEventDrawerOpen(false);
            await loadClub();
        } catch (err: any) {
            alert(err.message || "Failed to create event.");
        } finally {
            setActionLoading(false);
        }
    };

    const openEditEventDrawer = (event: ClubEvent) => {
        setSelectedEvent(event);
        setEditEventName(event.name);
        setEditEventDescription(event.description);
        setEditEventDate(formatDateForInput(event.eventDate));
        setEditEventVenueId(String(event.venueId || ""));
        setIsEditEventDrawerOpen(true);
    };

    const closeEditEventDrawer = () => {
        setSelectedEvent(null);
        setEditEventName("");
        setEditEventDescription("");
        setEditEventDate("");
        setEditEventVenueId("");
        setIsEditEventDrawerOpen(false);
    };

    const handleUpdateEvent = async () => {
        if (!selectedEvent) return;
        if (!editEventName.trim()) {
            alert("Event name is required.");
            return;
        }
        if (!editEventDescription.trim()) {
            alert("Description is required.");
            return;
        }
        if (!editEventDate) {
            alert("Event date is required.");
            return;
        }
        if (!editEventVenueId.trim()) {
            alert("Venue ID is required.");
            return;
        }

        try {
            setActionLoading(true);
            await updateApprovedEvent(selectedEvent.id, {
                name: editEventName,
                description: editEventDescription,
                eventDate: editEventDate,
                venueId: Number(editEventVenueId),
            });
            closeEditEventDrawer();
            await loadClub();
        } catch (err: any) {
            alert(err.message || "Failed to update event.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId: number) => {
        if (!confirm("Delete this event?")) return;

        try {
            setActionLoading(true);
            await deleteApprovedEvent(eventId);
            await loadClub();
        } catch (err: any) {
            alert(err.message || "Failed to delete event.");
        } finally {
            setActionLoading(false);
        }
    };

    const sortedMembers = [...members].sort((a, b) => {
        if (a.role === "LEADER") return -1;
        if (b.role === "LEADER") return 1;
        return memberSort === "asc"
            ? a.fullName.localeCompare(b.fullName)
            : b.fullName.localeCompare(a.fullName);
    });

    if (loading) return <div className={styles.loadingText}>Loading club details...</div>;
    if (!club) return <div className={styles.loadingText}>Club not found.</div>;

    const establishedDate = club.createdAt ? new Date(club.createdAt).toLocaleDateString() : "N/A";
    const isAnyDrawerOpen = isDeleteDrawerOpen || isAddMemberDrawerOpen || isSettingsDrawerOpen || isAddEventDrawerOpen || isEditEventDrawerOpen;

    return (
        <div className={styles.pageShell}>
            <button type="button" className={styles.backButton} onClick={() => router.push("/clubs")}>
                ← Back to All Clubs
            </button>

            <section className={styles.heroPanel}>
                <div className={styles.heroLeft}>
                    <div className={styles.badgeRow}>
                        <span className={styles.typeBadge}>{club.type}</span>
                        <span className={styles.categoryText}>Technology</span>
                    </div>
                    <h1>{club.name}</h1>
                    <p>Est. {establishedDate} · Advisor: Dr. Azlan Rashid</p>
                </div>

                <div className={styles.heroStats}>
                    <div className={styles.statCard}>
                        <strong>{members.length}</strong>
                        <span>Members</span>
                    </div>
                    <div className={styles.statCard}>
                        <strong>{events.length}</strong>
                        <span>Events</span>
                    </div>
                    <button type="button" className={styles.editButton} onClick={() => setActiveTab("edit")}>
                        📝 Edit Club
                    </button>
                </div>
            </section>

            <section className={styles.tabsBar}>
                <div className={styles.tabsGroup}>
                    <button type="button" className={`${styles.tabButton} ${activeTab === "about" ? styles.activeTab : ""}`} onClick={() => setActiveTab("about")}>ℹ️ About & Info</button>
                    <button type="button" className={`${styles.tabButton} ${activeTab === "members" ? styles.activeTab : ""}`} onClick={() => setActiveTab("members")}>👥 Members <span>{members.length}</span></button>
                    <button type="button" className={`${styles.tabButton} ${activeTab === "events" ? styles.activeTab : ""}`} onClick={() => setActiveTab("events")}>📅 Events</button>
                </div>

                {activeTab === "members" && <button type="button" className={styles.yellowActionButton} onClick={openAddMemberDrawer}>+ Add Member</button>}
                {activeTab === "events" && <button type="button" className={styles.yellowActionButton} onClick={() => setIsAddEventDrawerOpen(true)}>+ Add Event</button>}
            </section>

            {activeTab === "about" && (
                <section className={styles.aboutGrid}>
                    <div className={styles.aboutCard}>
                        <div className={styles.cardHeader}>
                            <h2>About This Club</h2>
                            <button type="button" onClick={openSettingsDrawer}>✏️ Edit</button>
                        </div>
                        <p className={styles.aboutText}>{club.description || "No description available."}</p>
                    </div>

                    <aside className={styles.detailsCard}>
                        <h2>Details</h2>
                        <div className={styles.detailItem}><span>Category</span><strong>Technology</strong></div>
                        <div className={styles.detailItem}><span>Type</span><strong>{club.type}</strong></div>
                        <div className={styles.detailItem}><span>Founded</span><strong>{establishedDate}</strong></div>
                        <div className={styles.detailItem}><span>Faculty Advisor</span><strong>Dr. Azlan Rashid</strong></div>
                        <div className={styles.detailItem}><span>Members</span><strong>{members.length} students</strong></div>
                        <button type="button" className={styles.manageButton} onClick={openSettingsDrawer}>⚙️ Manage Settings</button>
                        <button type="button" className={styles.deleteButton} onClick={() => setIsDeleteDrawerOpen(true)}>⚠️ Delete Club</button>
                    </aside>
                </section>
            )}

            {activeTab === "members" && (
                <section className={styles.tableCard}>
                    <table className={styles.managementTable}>
                        <thead>
                            <tr>
                                <th><button type="button" className={styles.sortHeaderButton} onClick={() => setMemberSort(memberSort === "asc" ? "desc" : "asc")}>Member {memberSort === "asc" ? "↑" : "↓"}</button></th>
                                <th>Student ID</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedMembers.length === 0 ? (
                                <tr><td colSpan={5}>No members found.</td></tr>
                            ) : (
                                sortedMembers.map((member) => (
                                    <tr key={member.userId}>
                                        <td><div className={styles.memberCell}><span className={styles.avatar}>{getInitials(member.fullName)}</span><div><strong>{member.fullName}</strong></div></div></td>
                                        <td>{member.staffOrMatricId || "N/A"}</td>
                                        <td>{member.email || "N/A"}</td>
                                        <td><span className={member.role === "LEADER" ? styles.leaderBadge : styles.memberBadge}>{member.role === "LEADER" ? "👑 LEADER" : "✓ MEMBER"}</span></td>
                                        <td>
                                            {member.role !== "LEADER" ? (
                                                <div className={styles.rowActionGroup}>
                                                    <button type="button" onClick={() => handlePromoteLead(member)}>Make Lead</button>
                                                    <button type="button" onClick={() => handleRemoveMember(member)}>Remove</button>
                                                </div>
                                            ) : (
                                                <span>Current Lead</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <div className={styles.tableFooter}>Showing {members.length} registered members</div>
                </section>
            )}

            {activeTab === "events" && (
                <section className={styles.tableCard}>
                    <table className={styles.managementTable}>
                        <thead><tr><th>Event</th><th>Date</th><th>Venue</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {events.length === 0 ? (
                                <tr><td colSpan={5}>No events found.</td></tr>
                            ) : (
                                events.map((event) => (
                                    <tr key={event.id}>
                                        <td><strong className={styles.eventName}>{event.name}</strong><small className={styles.spotsText}>{event.description}</small></td>
                                        <td>{event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "N/A"}</td>
                                        <td>Venue #{event.venueId}</td>
                                        <td>{event.status}</td>
                                        <td><div className={styles.eventActions}><button type="button" onClick={() => openEditEventDrawer(event)}>Edit</button><button type="button" onClick={() => handleDeleteEvent(event.id)}>Delete</button></div></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </section>
            )}

            {activeTab === "edit" && (
                <section className={styles.aboutGrid}>
                    <div className={styles.aboutCard}>
                        <div className={styles.cardHeader}><h2>Edit Club Members</h2></div>
                        <p className={styles.aboutText}>Use the Members tab to add members, remove members, or promote a member to lead. The club must always keep one lead.</p>
                        <button type="button" className={styles.manageButton} onClick={() => setActiveTab("members")}>Go to Members Management</button>
                    </div>
                    <aside className={styles.detailsCard}>
                        <h2>Editing Panel</h2>
                        <div className={styles.detailItem}><span>Club Name</span><strong>{club.name}</strong></div>
                        <div className={styles.detailItem}><span>Type</span><strong>{club.type}</strong></div>
                        <button type="button" className={styles.manageButton} onClick={openSettingsDrawer}>Edit Club Details</button>
                    </aside>
                </section>
            )}

            {isAnyDrawerOpen && <button type="button" className={styles.drawerOverlay} onClick={closeAllDrawers} aria-label="Close drawer" />}

            <aside className={`${styles.drawer} ${isDeleteDrawerOpen ? styles.drawerOpen : ""}`}>
                <div className={styles.drawerInner}>
                    <div className={styles.drawerHeader}><div><span>Delete Club</span><h2>{club.name}</h2></div><button type="button" onClick={closeDeleteDrawer}>×</button></div>
                    <div className={styles.drawerBody}><div className={styles.drawerSection}><h3>Are you sure?</h3><p>This club will be removed from the active clubs list.</p></div><div className={styles.drawerSection}><h3>Deletion Reason</h3><textarea placeholder="Write why this club is being deleted..." value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} /></div></div>
                    <div className={styles.drawerActions}><button type="button" onClick={closeDeleteDrawer}>Cancel</button><button type="button" onClick={handleDeleteClub} disabled={actionLoading}>{actionLoading ? "Deleting..." : "Delete Club"}</button></div>
                </div>
            </aside>

            <aside className={`${styles.drawer} ${isAddMemberDrawerOpen ? styles.drawerOpen : ""}`}>
                <div className={styles.drawerInner}>
                    <div className={styles.drawerHeader}><div><span>Add Member</span><h2>{club.name}</h2></div><button type="button" onClick={() => setIsAddMemberDrawerOpen(false)}>×</button></div>
                    <div className={styles.drawerBody}>
                        <div className={styles.drawerSection}><h3>Search available users</h3><input className={styles.drawerInput} type="text" placeholder="Search by name, email, or ID..." value={userSearch} onChange={(e) => searchUsers(e.target.value)} /></div>
                        <div className={styles.drawerSection}><h3>Available Users</h3>{availableUsers.length === 0 ? <p>No available users found.</p> : <div className={styles.availableUserList}>{availableUsers.map((user) => <button key={user.id} type="button" className={styles.availableUserCard} onClick={() => handleAddMember(user.id)}><div className={styles.availableUserInfo}><strong>{user.fullName}</strong><span>{user.staffOrMatricId || "No ID"}</span><span>{user.email}</span></div><span className={styles.addUserBadge}>+ Add</span></button>)}</div>}</div>
                    </div>
                </div>
            </aside>

            <aside className={`${styles.drawer} ${isSettingsDrawerOpen ? styles.drawerOpen : ""}`}>
                <div className={styles.drawerInner}>
                    <div className={styles.drawerHeader}><div><span>Manage Settings</span><h2>{club.name}</h2></div><button type="button" onClick={() => setIsSettingsDrawerOpen(false)}>×</button></div>
                    <div className={styles.drawerBody}>
                        <div className={styles.drawerSection}><h3>Club Name</h3><input className={styles.drawerInput} type="text" value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
                        <div className={styles.drawerSection}><h3>Type</h3><select className={styles.drawerInput} value={editType} onChange={(e) => setEditType(e.target.value as "club" | "community")}><option value="club">Club</option><option value="community">Community</option></select></div>
                        <div className={styles.drawerSection}><h3>Description</h3><textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} /></div>
                    </div>
                    <div className={styles.drawerActions}><button type="button" onClick={() => setIsSettingsDrawerOpen(false)}>Cancel</button><button type="button" onClick={handleSaveSettings} disabled={actionLoading}>{actionLoading ? "Saving..." : "Save Changes"}</button></div>
                </div>
            </aside>

            <aside className={`${styles.drawer} ${isAddEventDrawerOpen ? styles.drawerOpen : ""}`}>
                <div className={styles.drawerInner}>
                    <div className={styles.drawerHeader}><div><span>Add Event</span><h2>{club.name}</h2></div><button type="button" onClick={() => setIsAddEventDrawerOpen(false)}>×</button></div>
                    <div className={styles.drawerBody}>
                        <div className={styles.drawerSection}><h3>Event Name</h3><input className={styles.drawerInput} type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} /></div>
                        <div className={styles.drawerSection}><h3>Description</h3><textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} /></div>
                        <div className={styles.drawerSection}><h3>Date</h3><input className={styles.drawerInput} type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></div>
                        <div className={styles.drawerSection}><h3>Venue ID</h3><input className={styles.drawerInput} type="number" value={eventVenueId} onChange={(e) => setEventVenueId(e.target.value)} /></div>
                        <div className={styles.drawerSection}><h3>Estimated Budget</h3><input className={styles.drawerInput} type="number" value={eventBudget} onChange={(e) => setEventBudget(e.target.value)} /></div>
                    </div>
                    <div className={styles.drawerActions}><button type="button" onClick={() => setIsAddEventDrawerOpen(false)}>Cancel</button><button type="button" onClick={handleCreateEvent} disabled={actionLoading}>{actionLoading ? "Creating..." : "Create Event"}</button></div>
                </div>
            </aside>

            <aside className={`${styles.drawer} ${isEditEventDrawerOpen ? styles.drawerOpen : ""}`}>
                <div className={styles.drawerInner}>
                    <div className={styles.drawerHeader}><div><span>Edit Event</span><h2>{selectedEvent?.name}</h2></div><button type="button" onClick={closeEditEventDrawer}>×</button></div>
                    <div className={styles.drawerBody}>
                        <div className={styles.drawerSection}><h3>Event Name</h3><input className={styles.drawerInput} type="text" value={editEventName} onChange={(e) => setEditEventName(e.target.value)} /></div>
                        <div className={styles.drawerSection}><h3>Description</h3><textarea value={editEventDescription} onChange={(e) => setEditEventDescription(e.target.value)} /></div>
                        <div className={styles.drawerSection}><h3>Date</h3><input className={styles.drawerInput} type="datetime-local" value={editEventDate} onChange={(e) => setEditEventDate(e.target.value)} /></div>
                        <div className={styles.drawerSection}><h3>Venue ID</h3><input className={styles.drawerInput} type="number" value={editEventVenueId} onChange={(e) => setEditEventVenueId(e.target.value)} /></div>
                    </div>
                    <div className={styles.drawerActions}><button type="button" onClick={closeEditEventDrawer}>Cancel</button><button type="button" onClick={handleUpdateEvent} disabled={actionLoading}>{actionLoading ? "Saving..." : "Save Changes"}</button></div>
                </div>
            </aside>
        </div>
    );
}
