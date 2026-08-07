import type { UserStatus } from "@/modules/account/user.types";

export interface Page {
  id: number | string;
  title: string;
  slug: string;
  content?: string;
  body?: string;
  meta_title?: string | null;
  meta_description?: string | null;
  status?: UserStatus;
  created_at?: string;
  updated_at?: string;
}
