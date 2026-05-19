// utils/services/manage-roles.service.ts

import { useState, useEffect } from "react";
import { UserRecord, UserRole } from "../interfaces/manage-roles.interface";
import { apiFetch, ApiError } from "@/lib/api";

// ----- raw API functions (already existed) -----
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken") || localStorage.getItem("token") || localStorage.getItem("jwt");
}

export async function fetchUserRoles(): Promise<UserRecord[]> {
  const token = getAccessToken();
  const result = await apiFetch<any>("/users", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return result.data || (Array.isArray(result) ? result : []);
}

export async function updateUserRole(userId: string, roleValue: UserRole): Promise<void> {
  const token = getAccessToken();
  await apiFetch<void>(`/users/${userId}/role`, {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ role: roleValue })
  });
}

// ----- custom hook with all page logic -----
export function useManageRoles() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<{ [key: string]: string }>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string>("");

  // Load users on mount
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

  // Start editing a user
  const startEditing = (user: UserRecord) => {
    setEditingUserId(user.id);
    setSelectedRoles((prev) => ({
      ...prev,
      [user.id]: user.role
    }));
  };

  // Handle dropdown change
  const handleRoleChange = (userId: string, newRole: string) => {
    setSelectedRoles((prev) => ({
      ...prev,
      [userId]: newRole
    }));
  };

  // Save role update
  const saveRole = async (userId: string) => {
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

  // Cancel editing
  const cancelEditing = () => {
    setEditingUserId(null);
  };

  // Filtered users based on search query
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      (u.fullName || "").toLowerCase().includes(query) ||
      (u.staffOrMatricId || "").toLowerCase().includes(query)
    );
  });

  return {
    // State
    loading,
    apiError,
    editingUserId,
    updatingId,
    searchQuery,
    selectedRoles,
    filteredUsers,
    // Actions
    setSearchQuery,
    startEditing,
    handleRoleChange,
    saveRole,
    cancelEditing,
    // Raw users if needed (optional)
    users,
  };
}