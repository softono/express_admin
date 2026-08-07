import config from "@/config";
import { getEmailTemplateByKey } from "@/modules/public/email-template.service";
import { renderEmailLayout } from "@/lib/mailer/layout";
import { errorLog } from "@/lib/logger";
import {
  sendMailSMTP,
  MailOptions,
  MailAttachment,
} from "@/lib/mailer/mailerSMTP";

export type { MailOptions, MailAttachment };

export async function sendMail(
  to: string,
  subject: string,
  html: string,
  options: Omit<MailOptions, "to" | "subject" | "html"> = {},
): Promise<{ status: number; message: string }> {
  return sendMailSMTP({
    ...options,
    to,
    subject,
    html,
  });
}

export async function sendEmail(
  to: string,
  template: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any> = {},
  options?: Omit<MailOptions, "to" | "subject" | "html">,
): Promise<{ status: number; message: string }> {
  try {
    const payload: Record<string, unknown> = {
      app_name: config.APP_NAME,
      first_name: data.first_name || data.user?.first_name || "",
      last_name: data.last_name || data.user?.last_name || "",
      email: data.email || data.user?.email || "",
      ...data,
    };

    const templateData = await getEmailTemplateByKey(template, payload);
    if (!templateData) {
      errorLog("Email template not found", { template });
      return { status: 0, message: "Email template not found" };
    }

    const htmlContent = await renderEmailLayout(templateData.body);
    return sendMailSMTP({
      ...options,
      to,
      subject: templateData.subject || "Notification",
      html: htmlContent,
    });
  } catch (error) {
    errorLog("Failed to build/send templated email", { error, template, to });
    return {
      status: 0,
      message: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
