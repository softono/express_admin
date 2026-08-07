export interface EmailTemplate {
  id: number | string;
  name?: string;
  key?: string;
  title?: string;
  slug?: string;
  subject: string;
  body?: string;
  params?: string;
  status?: number;
  created_at?: string;
}
