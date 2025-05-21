"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { deleteAccount } from "../../../lib/profile-api";
import { Button } from "@repo/ui";
import Link from "next/link";

export default function DeleteAccountPage() {
  const { logout } = useAuth();
  const [password, setPassword] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Show confirmation step
  const handleInitialSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password) {
      setError("Password is required to delete your account");
      return;
    }
    setIsConfirming(true);
    setError(null);
  };

  // Handle final account deletion
  const handleConfirmDelete = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await deleteAccount(password);

      // Log the user out after successful account deletion
      await logout();

      // Redirect to home page
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete account. Please try again.",
      );
      setIsConfirming(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto pt-8 pb-16 px-4 sm:px-6">
      <div className="mb-6">
        <Link
          href="/profile"
          className="text-primary hover:text-primary/80 inline-flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Profile
        </Link>
      </div>

      <div className="bg-card shadow-md rounded-lg overflow-hidden border border-border">
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold mb-2 text-destructive">
            Delete Account
          </h1>
          <p className="text-muted-foreground mb-6">
            This action is permanent and cannot be undone. All your data will be
            permanently deleted.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
              {error}
            </div>
          )}

          {!isConfirming ? (
            <form onSubmit={handleInitialSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-1"
                >
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="pt-4">
                <Button type="submit" variant="destructive" className="w-full">
                  Continue
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full mt-3"
                  onClick={() => router.push("/profile")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-destructive/10 p-4 rounded-md border border-destructive">
                <h3 className="font-medium text-destructive mb-2">
                  Final Confirmation
                </h3>
                <p className="text-sm">
                  Are you absolutely sure you want to delete your account? This
                  action cannot be undone and will:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Delete all your personal data</li>
                  <li>Remove your profile from Devovia</li>
                  <li>Cancel any subscriptions or services</li>
                  <li>Delete all your projects, snippets, and other content</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsConfirming(false)}
                  disabled={isLoading}
                >
                  I've changed my mind
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleConfirmDelete}
                  disabled={isLoading}
                >
                  {isLoading ? "Deleting Account..." : "Yes, Delete My Account"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
