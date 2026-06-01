"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./clubsList.module.css";

import {
    fetchAdminClubsDashboard,
    fetchPendingClubRequests,
    submitClubRequestDecision,
    deleteClubById,
} from "./utils/services/clubsList.services";

import {
    ClubListItem,
    ClubRequestItem,
} from "./utils/interface/clubsList.interface";

export default function AdminClubsPage() {
    const router = useRouter();

    const [clubs, setClubs] = useState<ClubListItem[]>([]);
    const [requests, setRequests] = useState<ClubRequestItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    const [searchQuery, setSearchQuery] = useState<string>("");

    const [selectedRequest, setSelectedRequest] = useState<ClubRequestItem | null>(null);
    const [isRequestDrawerOpen, setIsRequestDrawerOpen] = useState<boolean>(false);

    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState<boolean>(false);
    const [rejectionReason, setRejectionReason] = useState<string>("");

    const [selectedDeleteClub, setSelectedDeleteClub] = useState<ClubListItem | null>(null);
    const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState<boolean>(false);
    const [deleteReason, setDeleteReason] = useState<string>("");

    const loadAllData = async () => {
        try {
            setLoading(true);

            const [clubsData, requestsData] = await Promise.all([
                fetchAdminClubsDashboard(),
                fetchPendingClubRequests(),
            ]);

            setClubs(clubsData);
            setRequests(requestsData);
        } catch (err) {
            console.error("Failed to load clubs page:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const getInitials = (name?: string) => {
        if (!name) return "??";

        const parts = name.trim().split(" ");

        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }

        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    };

    const openRequestDrawer = (request: ClubRequestItem) => {
        setSelectedRequest(request);
        setIsRequestDrawerOpen(true);
    };

    const closeRequestDrawer = () => {
        setSelectedRequest(null);
        setIsRequestDrawerOpen(false);
        setIsRejectionModalOpen(false);
        setRejectionReason("");
    };

    const handleApproveRequest = async () => {
        if (!selectedRequest) return;

        try {
            setActionLoading(true);

            await submitClubRequestDecision(
                selectedRequest.id,
                "approved",
                "Approved by admin."
            );

            closeRequestDrawer();
            await loadAllData();
        } catch (err: any) {
            alert(err.message || "Failed to approve club request.");
        } finally {
            setActionLoading(false);
        }
    };

    const openRejectionModal = () => {
        setRejectionReason("");
        setIsRejectionModalOpen(true);
    };

    const submitRejection = async () => {
        if (!selectedRequest) return;

        if (!rejectionReason.trim()) {
            alert("Rejection reason is required.");
            return;
        }

        try {
            setActionLoading(true);

            await submitClubRequestDecision(
                selectedRequest.id,
                "rejected",
                rejectionReason
            );

            closeRequestDrawer();
            await loadAllData();
        } catch (err: any) {
            alert(err.message || "Failed to reject club request.");
        } finally {
            setActionLoading(false);
        }
    };

    const openDeleteDrawer = (club: ClubListItem) => {
        setSelectedDeleteClub(club);
        setDeleteReason("");
        setIsDeleteDrawerOpen(true);
    };

    const closeDeleteDrawer = () => {
        setSelectedDeleteClub(null);
        setDeleteReason("");
        setIsDeleteDrawerOpen(false);
    };

    const handleDeleteClub = async () => {
        if (!selectedDeleteClub) return;

        if (!deleteReason.trim()) {
            alert("Delete reason is required.");
            return;
        }

        try {
            setActionLoading(true);

            await deleteClubById(selectedDeleteClub.id, deleteReason);

            closeDeleteDrawer();
            await loadAllData();
        } catch (err: any) {
            alert(err.message || "Failed to delete club.");
        } finally {
            setActionLoading(false);
        }
    };

    const filteredClubs = clubs.filter((club) => {
        const query = searchQuery.toLowerCase();

        return (
            club.name.toLowerCase().includes(query) ||
            club.type.toLowerCase().includes(query) ||
            club.leadId?.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <div className={styles.loadingText}>
                Loading clubs dashboard...
            </div>
        );
    }

    return (
        <div className={styles.pageShell}>
            <main
                className={`${styles.mainContent} ${isRequestDrawerOpen || isDeleteDrawerOpen ? styles.mainContentDimmed : ""
                    }`}
            >
                <section className={styles.heroPanel}>
                    <div className={styles.heroTextBlock}>
                        <span className={styles.eyebrow}>Admin Control Panel</span>
                        <h1 className={styles.heroTitle}>Club & Community Management</h1>
                        <p className={styles.heroSubtitle}>
                            Review proposals · Manage active clubs · Oversee membership
                        </p>
                    </div>

                    <div className={styles.heroActionsArea}>
                        <div className={styles.statCard}>
                            <strong>{clubs.length}</strong>
                            <span>Active Clubs</span>
                        </div>

                        <div className={`${styles.statCard} ${styles.statCardPending}`}>
                            <strong>{requests.length}</strong>
                            <span>Pending Review</span>
                        </div>

                        <button type="button" className={styles.createButton}>
                            + Create Official Club
                        </button>
                    </div>
                </section>

                <section className={styles.pendingSection}>
                    <div className={styles.sectionHeaderCompact}>
                        <div className={styles.titleWithDot}>
                            <span className={styles.yellowDot}></span>
                            <h2>Pending Approvals</h2>
                        </div>

                        <span className={styles.reviewBadge}>
                            {requests.length} awaiting review
                        </span>
                    </div>

                    <div className={styles.pendingGrid}>
                        {requests.length === 0 ? (
                            <div className={styles.emptyBox}>
                                No pending club registrations.
                            </div>
                        ) : (
                            requests.map((request) => {
                                const studentName = request.student?.fullName || "Unknown Student";
                                const matricId = request.student?.staffOrMatricId || "N/A";

                                return (
                                    <article key={request.id} className={styles.pendingCard}>
                                        <div className={styles.cardTopLine}>
                                            <span
                                                className={`${styles.typeBadge} ${request.clubType === "club"
                                                    ? styles.clubBadge
                                                    : styles.communityBadge
                                                    }`}
                                            >
                                                {request.clubType}
                                            </span>

                                            <span className={styles.timeBadge}>
                                                {request.submittedAt
                                                    ? new Date(request.submittedAt).toLocaleDateString()
                                                    : "Recent"}
                                            </span>
                                        </div>

                                        <h3 className={styles.cardTitle}>{request.clubName}</h3>

                                        <p className={styles.cardDescription}>
                                            {request.description}
                                        </p>

                                        <button
                                            type="button"
                                            className={styles.readMoreButton}
                                            onClick={() => openRequestDrawer(request)}
                                        >
                                            Read more
                                        </button>

                                        <div className={styles.requesterRow}>
                                            <span className={styles.avatar}>
                                                {getInitials(studentName)}
                                            </span>

                                            <div>
                                                <strong>{studentName}</strong>
                                                <small>{matricId}</small>
                                            </div>
                                        </div>

                                        <div className={styles.cardActionRow}>
                                            <button
                                                type="button"
                                                className={styles.approveButton}
                                                onClick={() => openRequestDrawer(request)}
                                            >
                                                ✓ Approve
                                            </button>

                                            <button
                                                type="button"
                                                className={styles.rejectButton}
                                                onClick={() => openRequestDrawer(request)}
                                            >
                                                ✕ Reject
                                            </button>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </section>

                <section className={styles.activeSection}>
                    <div className={styles.tableToolbar}>
                        <div className={styles.titleWithCount}>
                            <h2>Active Clubs & Communities</h2>
                            <span>{filteredClubs.length}</span>
                        </div>

                        <div className={styles.searchBox}>
                            <input
                                type="text"
                                placeholder="Search clubs, leads..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span>🔍</span>
                        </div>
                    </div>

                    <div className={styles.tableCard}>
                        <table className={styles.managementTable}>
                            <thead>
                                <tr>
                                    <th>Club Name</th>
                                    <th>Type</th>
                                    <th>Category</th>
                                    <th>Club Lead</th>
                                    <th>Members</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredClubs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className={styles.emptyTableCell}>
                                            No active clubs found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClubs.map((club) => (
                                        <tr key={club.id}>
                                            <td>
                                                <span className={styles.clubNameText}>{club.name}</span>
                                                <span className={styles.estText}>
                                                    Est.{" "}
                                                    {club.createdAt
                                                        ? new Date(club.createdAt).toLocaleDateString()
                                                        : "N/A"}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`${styles.typeBadge} ${club.type === "club"
                                                        ? styles.clubBadge
                                                        : styles.communityBadge
                                                        }`}
                                                >
                                                    {club.type}
                                                </span>
                                            </td>

                                            <td className={styles.categoryText}>
                                                {club.type === "club" ? "Technology" : "Community"}
                                            </td>

                                            <td>
                                                <div className={styles.leadCell}>
                                                    <span className={styles.avatarSmall}>
                                                        {getInitials(club.lead?.fullName || "CL")}
                                                    </span>

                                                    <span>
                                                        {club.lead?.fullName || "No lead assigned"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className={styles.membersCell}>
                                                <button
                                                    type="button"
                                                    className={styles.membersCellButton}
                                                    onClick={() => router.push(`/clubs/${club.id}?tab=members`)}
                                                >
                                                    👥 {club.memberCount ?? 0}
                                                </button>
                                            </td>

                                            <td>
                                                <div className={styles.actionIcons}>
                                                    <button
                                                        type="button"
                                                        title="View club"
                                                        onClick={() => router.push(`/clubs/${club.id}`)}
                                                    >
                                                        👁️
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title="Edit club"
                                                        onClick={() => router.push(`/clubs/${club.id}?tab=edit`)}
                                                    >
                                                        ✏️
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title="Delete club"
                                                        onClick={() => openDeleteDrawer(club)}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {isRequestDrawerOpen && (
                <button
                    type="button"
                    className={styles.drawerOverlay}
                    onClick={closeRequestDrawer}
                    aria-label="Close request drawer"
                />
            )}

            <aside
                className={`${styles.drawer} ${isRequestDrawerOpen ? styles.drawerOpen : ""
                    }`}
            >
                {selectedRequest && (
                    <div className={styles.drawerInner}>
                        <div className={styles.drawerHeader}>
                            <div>
                                <span className={styles.drawerEyebrow}>
                                    {selectedRequest.clubType} Request
                                </span>
                                <h2>{selectedRequest.clubName}</h2>
                            </div>

                            <button
                                type="button"
                                className={styles.closeButton}
                                onClick={closeRequestDrawer}
                            >
                                ×
                            </button>
                        </div>

                        <div className={styles.drawerBody}>
                            <div className={styles.drawerSection}>
                                <h3>Description</h3>
                                <p>{selectedRequest.description}</p>
                            </div>

                            <div className={styles.drawerGrid}>
                                <div>
                                    <h3>Requester</h3>
                                    <p>{selectedRequest.student?.fullName || "Unknown Student"}</p>
                                </div>

                                <div>
                                    <h3>Status</h3>
                                    <span className={styles.statusBadge}>
                                        {selectedRequest.status}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.drawerGrid}>
                                <div>
                                    <h3>Matric / Staff ID</h3>
                                    <p>{selectedRequest.student?.staffOrMatricId || "N/A"}</p>
                                </div>

                                <div>
                                    <h3>Submitted</h3>
                                    <p>
                                        {selectedRequest.submittedAt
                                            ? new Date(selectedRequest.submittedAt).toLocaleDateString()
                                            : "N/A"}
                                    </p>
                                </div>
                            </div>

                            <div className={styles.drawerSection}>
                                <h3>Objectives</h3>
                                <ul className={styles.objectiveList}>
                                    <li>Build a registered student organization.</li>
                                    <li>Support campus activities and student engagement.</li>
                                    <li>Provide structured events and membership opportunities.</li>
                                </ul>
                            </div>
                        </div>

                        {selectedRequest.status === "pending" && (
                            <div className={styles.drawerActions}>
                                <button
                                    type="button"
                                    className={styles.drawerApproveButton}
                                    onClick={handleApproveRequest}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? "Processing..." : "✓ Approve"}
                                </button>

                                <button
                                    type="button"
                                    className={styles.drawerRejectButton}
                                    onClick={openRejectionModal}
                                    disabled={actionLoading}
                                >
                                    ✕ Reject
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </aside>

            {isDeleteDrawerOpen && (
                <button
                    type="button"
                    className={styles.drawerOverlay}
                    onClick={closeDeleteDrawer}
                    aria-label="Close delete drawer"
                />
            )}

            <aside
                className={`${styles.drawer} ${isDeleteDrawerOpen ? styles.drawerOpen : ""
                    }`}
            >
                {selectedDeleteClub && (
                    <div className={styles.drawerInner}>
                        <div className={styles.drawerHeader}>
                            <div>
                                <span className={styles.drawerEyebrow}>Delete Club</span>
                                <h2>{selectedDeleteClub.name}</h2>
                            </div>

                            <button
                                type="button"
                                className={styles.closeButton}
                                onClick={closeDeleteDrawer}
                            >
                                ×
                            </button>
                        </div>

                        <div className={styles.drawerBody}>
                            <div className={styles.drawerSection}>
                                <h3>Are you sure?</h3>
                                <p>
                                    This club will be removed from the active clubs list. Please
                                    write the deletion reason before confirming.
                                </p>
                            </div>

                            <div className={styles.drawerSection}>
                                <h3>Deletion Reason</h3>
                                <textarea
                                    className={styles.rejectionTextarea}
                                    placeholder="Write why this club is being deleted..."
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.drawerActions}>
                            <button
                                type="button"
                                className={styles.modalCancelButton}
                                onClick={closeDeleteDrawer}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className={styles.drawerRejectButton}
                                onClick={handleDeleteClub}
                                disabled={actionLoading}
                            >
                                {actionLoading ? "Deleting..." : "Delete Club"}
                            </button>
                        </div>
                    </div>
                )}
            </aside>

            {isRejectionModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.rejectionModal}>
                        <h2>Specify Rejection Reason</h2>

                        <textarea
                            className={styles.rejectionTextarea}
                            placeholder="Write the reason for rejecting this club request..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />

                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                className={styles.modalCancelButton}
                                onClick={() => {
                                    setIsRejectionModalOpen(false);
                                    setRejectionReason("");
                                }}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className={styles.modalRejectButton}
                                onClick={submitRejection}
                                disabled={actionLoading}
                            >
                                {actionLoading ? "Submitting..." : "Submit Rejection"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

