import PERMISSIONS from "@/modules/account/permission.constants";
import type { IUser } from "@/models/user";
import { USER_ROLES } from "@/modules/account/user.constants";

// Frontend route → permission key (for ProtectedRoute)
const ROUTE_PERMISSIONS: Record<string, string> = {};

// API method+path patterns → permission key (for withAdminAuth)
const API_PERMISSION_MAP: Array<{
  pattern: RegExp;
  method: string;
  permission: string;
}> = [];

for (const group of PERMISSIONS) {
  if (!group.list) continue;
  for (const item of group.list) {
    if (item.route) {
      ROUTE_PERMISSIONS[item.route] = item.key;
    }
    if (item.apis) {
      for (const api of item.apis) {
        const spaceIdx = api.indexOf(" ");
        const method = api.slice(0, spaceIdx);
        const path = api.slice(spaceIdx + 1);
        // Convert Next.js dynamic segments [param] to regex
        const regexStr = "^" + path.replace(/\[[\w]+\]/g, "[^/]+") + "$";
        API_PERMISSION_MAP.push({
          pattern: new RegExp(regexStr),
          method,
          permission: item.key,
        });
      }
    }
  }
}

// Match an incoming request against the API permission map
function getApiPermission(method: string, pathname: string): string | null {
  const entry = API_PERMISSION_MAP.find(
    (e) => e.method === method && e.pattern.test(pathname),
  );
  return entry ? entry.permission : null;
}

// Check if a user has a specific permission
export function hasPermission(
  user: IUser,
  permissionOrMethod: string,
  pathname?: string,
): boolean {
  // Super admin has all permissions
  if (user.role === USER_ROLES.SUPER_ADMIN) {
    return true;
  }

  // If pathname is provided, look up the permission first
  const permission = pathname
    ? getApiPermission(permissionOrMethod, pathname) || ""
    : permissionOrMethod;

  // No permission requirement for this endpoint
  if (!permission) {
    return true;
  }

  // Check user's permission string
  if (!user.permission) {
    return false;
  }

  const userPermissions = user.permission
    .split(",")
    .map((p: string) => p.trim())
    .filter(Boolean);

  return userPermissions.includes(permission);
}
