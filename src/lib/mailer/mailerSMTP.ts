import nodemailer from "nodemailer";
import { getAllSettings } from "@/modules/setting/settings.service";
import { errorLog } from "@/lib/logger";
import config from "@/config";

let cachedTransporter: nodemailer.Transporter | null = null;

export interface MailAttachment {
  filename?: string;
  content?: string;
  path?: string;
  contentType?: string;
  cid?: string;
}

export interface MailOptions {
  from?: string;
  to: string;
  subject: string;
  text?: string;
  html: string;
  attachments?: MailAttachment[];
}

async function createTransporter() {
  const settings = await getAllSettings();

  const host = settings["smtp_host"] || "";
  const port = Number(settings["smtp_port"] || 587);
  const user = settings["smtp_username"] || "";
  const pass = settings["smtp_password"] || "";
  const encryption = settings["smtp_encryption"] || "tls";

  if (!host || !port || !user || !pass) {
    errorLog("SMTP configuration missing");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: encryption.toLowerCase() === "ssl",
    auth: { user, pass },
    pool: true,
  });

  transporter.verify().catch((error: unknown) => {
    errorLog("SMTP verification failed", { error });
  });

  return transporter;
}

async function getTransporter() {
  if (!cachedTransporter) {
    cachedTransporter = await createTransporter();
  }
  return cachedTransporter;
}

export async function sendMailSMTP(
  options: MailOptions,
): Promise<{ status: number; message: string }> {
  try {
    const settings = await getAllSettings();
    const siteName = config.APP_NAME;
    const mailFrom =
      settings["mail_from_address"] || settings["smtp_username"] || "";
    const mailFromName = settings["mail_from_name"] || siteName;
    const transporter = await getTransporter();

    await transporter.sendMail({
      from: options.from ?? `"${mailFromName}" <${mailFrom}>`,
      to: options.to,
      subject: options.subject,
      text: options.text ?? options.html.replace(/<[^>]*>/g, ""),
      html: options.html,
      attachments: options.attachments,
    });

    return { status: 1, message: "Email sent successfully" };
  } catch (error) {
    errorLog("Failed to send email", { error, to: options.to });
    return {
      status: 0,
      message: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
