"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import styles from "./clubDetails.module.css";

import {
    ClubDetails,
    ClubEvent,
    ClubMember,
} from "./utils/interface/clubDetails.interface";

import {
    fetchClubById,
    deleteClubById,
    fetchClubMembers,
} from "./utils/services/clubDetails.services";

export default function ClubDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const clubId = Number(params.id);

    const [club, setClub] = useState<ClubDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<"about" | "members" | "events" | "edit">("about");

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

    const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState<boolean>(false);
    const [deleteReason, setDeleteReason] = useState<string>("");
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    const [members, setMembers] = useState<ClubMember[]>([]);
    const [events, setEvents] = useState<ClubEvent[]>([]);
    const [memberSort, setMemberSort] = useState<"asc" | "desc">("asc");

    useEffect(() => {
        async function loadClub() {
            try {
                setLoading(true);

                const [clubData, membersData] = await Promise.all([
                    fetchClubById(clubId),
                    fetchClubMembers(clubId),
                ]);

                setClub(clubData);
                setMembers(membersData.members ?? []);

                setEvents([]);
            } catch (err) {
                console.error("Failed to load club:", err);
            } finally {
                setLoading(false);
            }
        }

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

    const sortedMembers = [...members].sort((a, b) => {
        if (a.role === "LEADER") return -1;
        if (b.role === "LEADER") return 1;

        return memberSort === "asc"
            ? a.fullName.localeCompare(b.fullName)
            : b.fullName.localeCompare(a.fullName);
    });

    if (loading) {
        return <div className={styles.loadingText}>Loading club details...</div>;
    }

    if (!club) {
        return (
            <div className={styles.loadingText}>
                Club not found.
            </div>
        );
    }

    const establishedDate = club.createdAt
        ? new Date(club.createdAt).toLocaleDateString()
        : "N/A";

    return (
        <div className={styles.pageShell}>
            <button
                type="button"
                className={styles.backButton}
                onClick={() => router.push("/clubs")}
            >
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

                    <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => setActiveTab("edit")}
                    >
                        📝 Edit Club
                    </button>
                </div>
            </section>

            <section className={styles.tabsBar}>
                <div className={styles.tabsGroup}>
                    <button
                        type="button"
                        className={`${styles.tabButton} ${activeTab === "about" ? styles.activeTab : ""}`}
                        onClick={() => setActiveTab("about")}
                    >
                        ℹ️ About & Info
                    </button>

                    <button
                        type="button"
                        className={`${styles.tabButton} ${activeTab === "members" ? styles.activeTab : ""}`}
                        onClick={() => setActiveTab("members")}
                    >
                        👥 Members <span>{members.length}</span>
                    </button>

                    <button
                        type="button"
                        className={`${styles.tabButton} ${activeTab === "events" ? styles.activeTab : ""}`}
                        onClick={() => setActiveTab("events")}
                    >
                        📅 Events
                    </button>
                </div>

                {activeTab === "members" && (
                    <button type="button" className={styles.yellowActionButton}>
                        + Add Member
                    </button>
                )}

                {activeTab === "events" && (
                    <button type="button" className={styles.yellowActionButton}>
                        + Add Event
                    </button>
                )}
            </section>

            {activeTab === "about" && (
                <section className={styles.aboutGrid}>
                    <div className={styles.aboutCard}>
                        <div className={styles.cardHeader}>
                            <h2>About This Club</h2>
                            <button type="button">✏️ Edit</button>
                        </div>

                        <p className={styles.aboutText}>{club.description}</p>

                        <h3>Description</h3>

                        <p className={styles.aboutText}>
                            {club.description || "No description available."}
                        </p>
                    </div>

                    <aside className={styles.detailsCard}>
                        <h2>Details</h2>

                        <div className={styles.detailItem}>
                            <span>Category</span>
                            <strong>Technology</strong>
                        </div>

                        <div className={styles.detailItem}>
                            <span>Type</span>
                            <strong>{club.type}</strong>
                        </div>

                        <div className={styles.detailItem}>
                            <span>Founded</span>
                            <strong>{establishedDate}</strong>
                        </div>

                        <div className={styles.detailItem}>
                            <span>Faculty Advisor</span>
                            <strong>Dr. Azlan Rashid</strong>
                        </div>

                        <div className={styles.detailItem}>
                            <span>Members</span>
                            <strong>{members.length} students</strong>
                        </div>

                        <button type="button" className={styles.manageButton}>
                            ⚙️ Manage Settings
                        </button>

                        <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => setIsDeleteDrawerOpen(true)}
                        >
                            ⚠️ Delete Club
                        </button>
                    </aside>
                </section>
            )}

            {activeTab === "members" && (
                <section className={styles.tableCard}>
                    <table className={styles.managementTable}>
                        <thead>
                            <tr>
                                <th>
                                    <button
                                        type="button"
                                        className={styles.sortHeaderButton}
                                        onClick={() =>
                                            setMemberSort(memberSort === "asc" ? "desc" : "asc")
                                        }
                                    >
                                        Member {memberSort === "asc" ? "↑" : "↓"}
                                    </button>
                                </th>
                                <th>Student ID</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th></th>
                            </tr>
                        </thead>

                        <tbody>
                            {sortedMembers.map((member) => (
                                <tr key={member.userId}>
                                    <td>
                                        <div className={styles.memberCell}>
                                            <span className={styles.avatar}>{getInitials(member.fullName)}</span>
                                            <div>
                                                <strong>{member.fullName}</strong>
                                            </div>
                                        </div>
                                    </td>

                                    <td>{member.staffOrMatricId}</td>
                                    <td>{member.email}</td>

                                    <td>
                                        <span
                                            className={
                                                member.role === "LEADER"
                                                    ? styles.leaderBadge
                                                    : styles.memberBadge
                                            }
                                        >
                                            {member.role === "LEADER" ? "👑 LEADER" : "✓ MEMBER"}
                                        </span>
                                    </td>

                                    <td>
                                        <button type="button" className={styles.moreButton}>
                                            •••
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className={styles.tableFooter}>
                        Showing {members.length} registered members
                    </div>
                </section>
            )}

            {activeTab === "events" && (
                <section className={styles.tableCard}>
                    <table className={styles.managementTable}>
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Date</th>
                                <th>Location</th>
                                <th>Fill Rate</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {events.map((event) => (
                                <tr key={event.id}>
                                    <td>
                                        <strong className={styles.eventName}>{event.name}</strong>
                                        <small className={styles.spotsText}>{event.spots}</small>
                                    </td>

                                    <td>{event.date}</td>
                                    <td>{event.location}</td>

                                    <td>
                                        <div className={styles.fillCell}>
                                            <div className={styles.progressTrack}>
                                                <div
                                                    className={styles.progressFill}
                                                    style={{ width: event.fill }}
                                                />
                                            </div>
                                            <span>{event.fill}</span>
                                        </div>
                                    </td>

                                    <td>
                                        <div className={styles.eventActions}>
                                            <button type="button">Edit</button>
                                            <button type="button">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {activeTab === "edit" && (
                <section className={styles.aboutGrid}>
                    <div className={styles.aboutCard}>
                        <div className={styles.cardHeader}>
                            <h2>Edit Club</h2>
                        </div>

                        <p className={styles.aboutText}>
                            Edit form will be added here later.
                        </p>
                    </div>

                    <aside className={styles.detailsCard}>
                        <h2>Editing Panel</h2>

                        <div className={styles.detailItem}>
                            <span>Club Name</span>
                            <strong>{club.name}</strong>
                        </div>

                        <div className={styles.detailItem}>
                            <span>Type</span>
                            <strong>{club.type}</strong>
                        </div>

                        <button type="button" className={styles.manageButton}>
                            Save Changes
                        </button>
                    </aside>
                </section>
            )}

            {isDeleteDrawerOpen && (
                <button
                    type="button"
                    className={styles.drawerOverlay}
                    onClick={closeDeleteDrawer}
                    aria-label="Close delete drawer"
                />
            )}

            <aside className={`${styles.drawer} ${isDeleteDrawerOpen ? styles.drawerOpen : ""}`}>
                <div className={styles.drawerInner}>
                    <div className={styles.drawerHeader}>
                        <div>
                            <span>Delete Club</span>
                            <h2>{club.name}</h2>
                        </div>

                        <button type="button" onClick={closeDeleteDrawer}>
                            ×
                        </button>
                    </div>

                    <div className={styles.drawerBody}>
                        <div className={styles.drawerSection}>
                            <h3>Are you sure?</h3>
                            <p>
                                This club will be removed from the active clubs list. Please write
                                the deletion reason before confirming.
                            </p>
                        </div>

                        <div className={styles.drawerSection}>
                            <h3>Deletion Reason</h3>
                            <textarea
                                placeholder="Write why this club is being deleted..."
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.drawerActions}>
                        <button type="button" onClick={closeDeleteDrawer}>
                            Cancel
                        </button>

                        <button type="button" onClick={handleDeleteClub} disabled={actionLoading}>
                            {actionLoading ? "Deleting..." : "Delete Club"}
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}