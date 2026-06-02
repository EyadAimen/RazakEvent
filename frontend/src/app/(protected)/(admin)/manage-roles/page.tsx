"use client";

import { useState, useEffect } from "react";
import styles from "./manageRoles.module.css";
import { UserRecord } from "./utils/interfaces/manage-roles.interface";
import { fetchUserRoles } from "./utils/services/manage-roles.service.ts";
import { ApiError } from "@/lib/api";
import Alert from "@/components/shared/alertComponent/alert";
import MemberLeadRoleModal from "@/components/admin/MemberLeadRoleModal/MemberLeadRoleModal";
import LeadRequestsPanel from "@/components/admin/LeadRequestsPanel/LeadRequestsPanel";

export default function ManageRolesPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [apiError, setApiError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"admin" | "student" | "member">("student");
  const [modalUser, setModalUser] = useState<UserRecord | null>(null);
  const [modalAlert, setModalAlert] = useState<{ type: "none" | "loading" | "success" | "error"; message?: string }>({ type: "none" });

  async function loadData() {
    try {
      setLoading(true);
      setApiError("");
      const data = await fetchUserRoles();
      setUsers(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError("Unable to connect and retrieve system data roles.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const tabUsers = users.filter((u) => {
    if (activeTab === "admin") return u.role === "admin";
    if (activeTab === "student") return u.role === "student";
    return u.role === "member" || u.role === "lead";
  });

  const filteredUsers = tabUsers.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      (u.fullName || "").toLowerCase().includes(query) ||
      (u.staffOrMatricId || "").toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <p>Loading user roles from database...</p>
      </div>
    );
  }

  if (apiError && users.length === 0) {
    return (
      <div className={`${styles.loadingWrapper} ${styles.errorTextContainer}`}>
        <p>System Error Encountered: {apiError}</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.headerArea}>
          <h1 className={styles.titleText}>Manage User Roles</h1>
          <p className={styles.descriptionText}>
            Promote students to Club Leads or assign Admin privileges.
          </p>
        </div>

        <div className={styles.bodyLayout}>
        <div className={styles.leftCol}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "student" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("student")}
          >
            Students
            <span className={styles.tabCount}>{users.filter(u => u.role === "student").length}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === "member" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("member")}
          >
            Members &amp; Leads
            <span className={styles.tabCount}>{users.filter(u => u.role === "member" || u.role === "lead").length}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === "admin" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            Admins
            <span className={styles.tabCount}>{users.filter(u => u.role === "admin").length}</span>
          </button>
        </div>

        <div className={styles.contentCard}>
          <div className={styles.searchRow}>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                placeholder="Search by name or Student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Student/Staff ID</th>
                  <th>Current Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyState}>
                      No registered accounts match your query criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    let badgeClass = styles.role_student;
                    let displayBadgeText = user.role;

                    if (user.role === "admin") {
                      badgeClass = styles.role_admin;
                    } else if (user.role === "lead" || user.role === "clublead") {
                      badgeClass = styles.role_clublead;
                      displayBadgeText = "club lead";
                    } else if (user.role === "member") {
                      displayBadgeText = "member";
                    }

                    return (
                      <tr key={user.id}>
                        <td data-label="User">
                          <div className={styles.userDetails}>
                            <span className={styles.userNameText}>{user.fullName}</span>
                            <span className={styles.userEmailText}>{user.email}</span>
                          </div>
                        </td>
                        <td data-label="ID">
                          <span className={styles.idColumnText}>{user.staffOrMatricId}</span>
                        </td>
                        <td data-label="Role">
                          <span className={`${styles.roleBadge} ${badgeClass}`}>
                            {displayBadgeText}
                          </span>
                        </td>
                        <td data-label="Actions">
                          <button
                            onClick={() => setModalUser(user)}
                            className={styles.actionEditBtn}
                          >
                            ✏️ Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div> {/* leftCol */}

        <LeadRequestsPanel onRolesChanged={loadData} />

        </div> {/* bodyLayout */}
      </div>

      <Alert variant="loading" isOpen={modalAlert.type === "loading"} onClose={() => {}} />
      <Alert variant="error"   isOpen={modalAlert.type === "error"}   message={modalAlert.message ?? ""} onClose={() => setModalAlert({ type: "none" })} />
      <Alert variant="success" isOpen={modalAlert.type === "success"} message={modalAlert.message ?? ""} onClose={() => setModalAlert({ type: "none" })} />

      {modalUser && (
        <MemberLeadRoleModal
          user={modalUser}
          onClose={() => setModalUser(null)}
          onChanged={loadData}
          onAlert={setModalAlert}
        />
      )}
    </>
  );
}
