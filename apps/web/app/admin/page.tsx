"use client";

import React, { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import AdminOnly from "../../components/admin-only";
import Loader from "../../components/ui/loader";
import {
  getAllUsers,
  updateUserRole,
  updateUserVerification,
} from "../../lib/admin-api";

// Define user type for admin dashboard
interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  role: "USER" | "ADMIN" | "MODERATOR";
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch users when the component mounts or when the tab changes to 'users'
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  // Function to fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllUsers();
      setUsers(response.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to update a user's role
  const handleRoleChange = async (
    userId: string,
    newRole: "USER" | "ADMIN" | "MODERATOR",
  ) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      await updateUserRole(userId, newRole);

      // Update the local state
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );

      setSuccessMessage(`User role updated to ${newRole} successfully`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update user role",
      );
      console.error("Error updating user role:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to update a user's verification status
  const handleVerificationChange = async (
    userId: string,
    isVerified: boolean,
  ) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      await updateUserVerification(userId, isVerified);

      // Update the local state
      setUsers(users.map((u) => (u.id === userId ? { ...u, isVerified } : u)));

      setSuccessMessage(
        `User ${isVerified ? "verified" : "unverified"} successfully`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update verification status",
      );
      console.error("Error updating verification status:", err);
    } finally {
      setLoading(false);
    }
  };

  // Redirect to login if not authenticated is handled by the AdminOnly component
  if (isLoading) {
    return <Loader />;
  }

  return (
    <AdminOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full p-6 bg-card rounded-xl shadow-lg border border-border text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              Access Denied
            </h2>
            <p className="text-foreground mb-4">
              You don't have permission to access the admin dashboard.
            </p>
            <p className="text-muted-foreground">
              This area is restricted to administrators only.
            </p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-background">
        <header className="bg-card shadow border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-primary">
                    Admin Dashboard
                  </h1>
                </div>
              </div>
              <div className="flex items-center">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border border-border rounded-lg bg-card">
              <div className="border-b border-border">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab("users")}
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === "users"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Users
                  </button>
                  <button
                    onClick={() => setActiveTab("roles")}
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === "roles"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Role Management
                  </button>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === "settings"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Settings
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === "users" && (
                  <div>
                    <h2 className="text-lg font-medium text-foreground mb-4">
                      User Management
                    </h2>

                    {/* Success message */}
                    {successMessage && (
                      <div className="mb-4 p-4 bg-green-500/10 border-l-4 border-green-500 rounded">
                        <p className="text-green-600">{successMessage}</p>
                      </div>
                    )}

                    {/* Error message */}
                    {error && (
                      <div className="mb-4 p-4 bg-red-500/10 border-l-4 border-red-500 rounded">
                        <p className="text-red-600">{error}</p>
                      </div>
                    )}

                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : users.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-muted-foreground">No users found</p>
                        <button
                          onClick={fetchUsers}
                          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                          Refresh
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                          <thead className="bg-accent">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                              >
                                User
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                              >
                                Role
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                              >
                                Verification
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                              >
                                Created
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-card divide-y divide-border">
                            {users.map((user) => (
                              <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div>
                                      <div className="text-sm font-medium text-foreground">
                                        {user.name || user.username}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {user.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <select
                                    value={user.role}
                                    onChange={(e) =>
                                      handleRoleChange(
                                        user.id,
                                        e.target.value as
                                          | "USER"
                                          | "ADMIN"
                                          | "MODERATOR",
                                      )
                                    }
                                    className="block w-full py-2 px-3 border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background text-foreground"
                                    disabled={loading}
                                  >
                                    <option value="USER">USER</option>
                                    <option value="MODERATOR">MODERATOR</option>
                                    <option value="ADMIN">ADMIN</option>
                                  </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isVerified ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}
                                  >
                                    {user.isVerified
                                      ? "Verified"
                                      : "Not Verified"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                  {new Date(
                                    user.createdAt,
                                  ).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() =>
                                      handleVerificationChange(
                                        user.id,
                                        !user.isVerified,
                                      )
                                    }
                                    className={`mr-2 px-3 py-1 rounded-md text-xs ${user.isVerified ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" : "bg-green-500/10 text-green-500 hover:bg-green-500/20"}`}
                                    disabled={loading}
                                  >
                                    {user.isVerified ? "Unverify" : "Verify"}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "roles" && (
                  <div>
                    <h2 className="text-lg font-medium text-foreground mb-4">
                      Role Management
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      This section will allow administrators to manage roles and
                      permissions:
                    </p>
                    <ul className="list-disc pl-5 text-foreground space-y-2">
                      <li>Assign roles to users</li>
                      <li>Define permissions for each role</li>
                      <li>Create custom roles with specific permissions</li>
                    </ul>
                    <div className="mt-6 p-4 bg-accent rounded-md">
                      <p className="text-muted-foreground italic">
                        Role management functionality will be implemented in a
                        future update.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "settings" && (
                  <div>
                    <h2 className="text-lg font-medium text-foreground mb-4">
                      Admin Settings
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      This section will allow administrators to configure system
                      settings:
                    </p>
                    <ul className="list-disc pl-5 text-foreground space-y-2">
                      <li>Configure authentication settings</li>
                      <li>Manage OAuth providers</li>
                      <li>Set up email templates</li>
                      <li>Configure system-wide preferences</li>
                    </ul>
                    <div className="mt-6 p-4 bg-accent rounded-md">
                      <p className="text-muted-foreground italic">
                        Settings functionality will be implemented in a future
                        update.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}
