"use client";

import { useState, useEffect } from "react";
import styles from "./manageRoles.module.css";
import { UserRecord } from "./utils/interfaces/manage-roles.interface";
import { fetchUserRoles, updateUserRole } from "./utils/services/manage-roles.service.ts";
import { ApiError } from "@/lib/api";

export default function ManageRolesPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<{ [key: string]: string }>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string>("");

  useEffect(() => {
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
    loadData();
  }, []);

  const startEditing = (user: UserRecord) => {
    setEditingUserId(user.id);
    setSelectedRoles((prev) => ({
      ...prev,
      [user.id]: user.role
    }));
  };

  const handleRoleDropdownChange = (userId: string, newRole: string) => {
    setSelectedRoles((prev) => ({
      ...prev,
      [userId]: newRole
    }));
  };

  const handleSaveRole = async (userId: string) => {
    const roleValue = selectedRoles[userId];
    if (!roleValue) return;

    try {
      setUpdatingId(userId);
      setApiError("");
      await updateUserRole(userId, roleValue);

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: roleValue } : user
        )
      );
      setEditingUserId(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError("Failed to successfully transmit altered configuration choices.");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
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
    <div className={styles.pageContainer}>
      <div className={styles.headerArea}>
        <h1 className={styles.titleText}>Manage User Roles</h1>
        <p className={styles.descriptionText}>
          Promote students to Club Leads or assign Admin privileges.
        </p>
      </div>

      {apiError && <p className={styles.apiError}>{apiError}</p>}

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
                  const currentDisplayRole = selectedRoles[user.id] !== undefined ? selectedRoles[user.id] : user.role;

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
                      <td>
                        <div className={styles.userDetails}>
                          <span className={styles.userNameText}>{user.fullName}</span>
                          <span className={styles.userEmailText}>{user.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.idColumnText}>{user.staffOrMatricId}</span>
                      </td>
                      <td>
                        {editingUserId === user.id ? (
                          <select
                            disabled={updatingId === user.id}
                            value={currentDisplayRole}
                            onChange={(e) => handleRoleDropdownChange(user.id, e.target.value)}
                            className={styles.roleSelectDropdown}
                          >
                            <option value="student">student</option>
                            <option value="member">member</option>
                            <option value="lead">club lead</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
                          <span className={`${styles.roleBadge} ${badgeClass}`}>
                            {displayBadgeText}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingUserId === user.id ? (
                          <div className={styles.actionButtonGroup}>
                            <button
                              disabled={updatingId === user.id}
                              onClick={() => handleSaveRole(user.id)}
                              className={styles.actionSaveBtn}
                            >
                              Done
                            </button>
                            <button
                              disabled={updatingId === user.id}
                              onClick={() => setEditingUserId(null)}
                              className={styles.actionCancelBtn}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(user)}
                            className={styles.actionEditBtn}
                            disabled={updatingId !== null}
                          >
                            ✏️ Edit Role
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}