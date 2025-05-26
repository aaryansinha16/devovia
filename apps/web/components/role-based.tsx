import { useAuth } from "../lib/auth-context";
import { ReactNode } from "react";

type Role = "USER" | "ADMIN" | "MODERATOR";

interface RoleBasedComponentProps {
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that conditionally renders content based on the user's role
 *
 * @param allowedRoles - Array of roles that are allowed to see the content
 * @param children - Content to show if the user has one of the allowed roles
 * @param fallback - Optional content to show if the user doesn't have permission
 */
export function RoleBasedComponent({
  allowedRoles,
  children,
  fallback = null,
}: RoleBasedComponentProps) {
  const { user } = useAuth();

  // If no user is logged in, show nothing
  if (!user) return null;

  // Check if the user's role is in the allowed roles
  const hasPermission = allowedRoles.includes(user.role as Role);

  // Render the children if the user has permission, otherwise render the fallback
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * A component that only renders content for admin users
 */
export function AdminOnly({
  children,
  fallback = null,
}: Omit<RoleBasedComponentProps, "allowedRoles">) {
  return (
    <RoleBasedComponent allowedRoles={["ADMIN"]} fallback={fallback}>
      {children}
    </RoleBasedComponent>
  );
}

/**
 * A component that only renders content for moderator or admin users
 */
export function ModeratorOrAdmin({
  children,
  fallback = null,
}: Omit<RoleBasedComponentProps, "allowedRoles">) {
  return (
    <RoleBasedComponent
      allowedRoles={["ADMIN", "MODERATOR"]}
      fallback={fallback}
    >
      {children}
    </RoleBasedComponent>
  );
}
