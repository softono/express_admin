import { findEmailTemplateByKey } from "@/models/email-template.repository";

export async function getEmailTemplateByKey(
  key: string,
  data: Record<string, unknown> = {},
): Promise<{ subject: string; body: string } | null> {
  const template = await findEmailTemplateByKey(key);
  if (!template) return null;

  let subject = template.subject;
  let body = template.body;
  for (const [k, v] of Object.entries(data)) {
    const re = new RegExp(`{{\\s*${k}\\s*}}`, "g");
    subject = subject.replace(re, String(v));
    body = body.replace(re, String(v));
  }
  return { subject, body };
}
