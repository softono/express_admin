import type { USER_STATUS, USER_ROLES } from "@/modules/account/user.constants";

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export interface UserSummary {
  total: number;
  active: number;
  inactive: number;
}

export interface IUser {
  id: string;
  email: string;
  image?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  country?: string | null;
  timezone?: string | null;
  role?: string | null;
  status?: number | null;
  permission?: string | null;
  two_factor_enabled?: boolean | null;
}

export interface UserActivity {
  id: number | string;
  user_id?: number | string;
  device_id?: string;
  type: string | number;
  data?: string;
  ip?: string;
  client?: string;
  created_at?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  location?: string;
  role?: number;
}

export interface UserProfile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  country?: string | null;
  image?: string | null;
  status?: string | null;
  two_factor_enabled?: boolean | null;
  email_verified?: boolean;
  timezone?: string | null;
  role?: UserRole | string | null;
  permission?: string | null;
  registered_ip?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface User extends UserProfile {
  role?: UserRole | string | null;
  permission?: string | null;
}

export interface UserSession {
  id: string;
  device_uid?: string | null;
  user_id?: string;
  user_agent?: string | null;
  ip_address?: string | null;
  is_current_device?: boolean;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}
