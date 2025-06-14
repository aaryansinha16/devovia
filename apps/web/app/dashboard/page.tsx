"use client";

// This ensures the page is always rendered at request time, not build time
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { CardSpotlight } from "@repo/ui/components";
import { IconPlus, IconEdit, IconUser } from "@tabler/icons-react";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name || user?.username || 'Developer'}
        </h1>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardSpotlight className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
              <IconPlus size={24} className="text-primary" />
            </div>
            <h3 className="text-xl font-medium">Create Blog</h3>
            <p className="text-muted-foreground">Write a new blog post to share with your audience.</p>
            <div className="pt-4">
              <Link href="/dashboard/blogs/create" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background px-4 py-2">
                Create New Blog
              </Link>
            </div>
          </div>
        </CardSpotlight>

        <CardSpotlight className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
              <IconEdit size={24} className="text-primary" />
            </div>
            <h3 className="text-xl font-medium">Manage Blogs</h3>
            <p className="text-muted-foreground">View, edit or delete your existing blog posts.</p>
            <div className="pt-4">
              <Link href="/dashboard/blogs" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background px-4 py-2">
                View All Blogs
              </Link>
            </div>
          </div>
        </CardSpotlight>

        <CardSpotlight className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
              <IconUser size={24} className="text-primary" />
            </div>
            <h3 className="text-xl font-medium">Profile</h3>
            <p className="text-muted-foreground">Update your profile information and preferences.</p>
            <div className="pt-4">
              <Link href="/dashboard/profile" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background px-4 py-2">
                Edit Profile
              </Link>
            </div>
          </div>
        </CardSpotlight>
      </div>

      {/* User Info */}
      <div className="rounded-lg overflow-hidden border border-border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-md bg-background">
              <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
              <div className="font-medium">{user?.email}</div>
            </div>
            
            <div className="p-4 rounded-md bg-background">
              <div className="text-sm font-medium text-muted-foreground mb-1">Username</div>
              <div className="font-medium">{user?.username}</div>
            </div>
            
            <div className="p-4 rounded-md bg-background">
              <div className="text-sm font-medium text-muted-foreground mb-1">Role</div>
              <div className="font-medium">
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary">
                  {user?.role || 'USER'}
                </span>
              </div>
            </div>
            
            <div className="p-4 rounded-md bg-background">
              <div className="text-sm font-medium text-muted-foreground mb-1">Verification Status</div>
              <div className="font-medium">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user?.isVerified 
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500"
                }`}>
                  {user?.isVerified ? "Verified" : "Unverified"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
