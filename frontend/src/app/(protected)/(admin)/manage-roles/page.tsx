"use client";

import styles from "./manage-roles.module.css";
import { useManageRoles } from "./utils/services/manage-roles.service.";

export default function ManageRolesPage() {
  const {
    loading,
    apiError,
    editingUserId,
    updatingId,
    searchQuery,
    filteredUsers,
    selectedRoles, 
    setSearchQuery,
    startEditing,
    handleRoleChange,
    saveRole,
    cancelEditing,
  } = useManageRoles();

  const getRoleBadge = (role: string) => {
    let badgeClass = styles.role_student;
    let displayText = role;

    if (role === "admin") {
      badgeClass = styles.role_admin;
    } else if (role === "lead" || role === "clublead") {
      badgeClass = styles.role_clublead;
      displayText = "club lead";
    } else if (role === "member") {
      displayText = "member";
    }
    return { badgeClass, displayText };
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <p>Loading user roles from database...</p>
      </div>
    );
  }

  if (apiError && filteredUsers.length === 0) {
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
                  const currentDisplayRole =
                    editingUserId === user.id && selectedRoles[user.id] !== undefined
                      ? selectedRoles[user.id]
                      : user.role;

                  const { badgeClass, displayText } = getRoleBadge(user.role);

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
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className={styles.roleSelectDropdown}
                          >
                            <option value="student">student</option>
                            <option value="member">member</option>
                            <option value="lead">club lead</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
                          <span className={`${styles.roleBadge} ${badgeClass}`}>
                            {displayText}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingUserId === user.id ? (
                          <div className={styles.actionButtonGroup}>
                            <button
                              disabled={updatingId === user.id}
                              onClick={() => saveRole(user.id)}
                              className={styles.actionSaveBtn}
                            >
                              Done
                            </button>
                            <button
                              disabled={updatingId === user.id}
                              onClick={cancelEditing}
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