"use client";

import { useState, useEffect } from "react";
import styles from "./manageRoles.module.css";

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  staffOrMatricId: string;
  role: string;
}

export default function ManageRolesPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<{ [key: string]: string }>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserRoles() {
      try {
        setLoading(true);
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt");

        const response = await fetch("http://localhost:5000/api/users", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          }
        });

        if (response.ok) {
          const result = await response.json();
          const recordsArray = result.data || (Array.isArray(result) ? result : []);
          setUsers(recordsArray);
        } else {
          console.error("Failed to fetch user roles:", response.statusText);
        }
      } catch (err) {
        console.error("Failed loading user records from database endpoint:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserRoles();
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
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

      const response = await fetch(`http://localhost:5000/api/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ role: roleValue })
      });

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, role: roleValue } : user
          )
        );
        setEditingUserId(null);
      } else {
        const errData = await response.json();
        alert(`Error updating role: ${errData.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Role update failed:", err);
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

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerArea}>
        <h1 className={styles.titleText}>Manage User Roles</h1>
        <p className={styles.descriptionText}>
          Promote students to Club Leads or assign Admin privileges.
        </p>
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