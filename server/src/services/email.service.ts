import * as nodemailer from "nodemailer";
import { promises as dnsPromises } from "dns";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

function isRealEmailConfigured(): boolean {
  return (
    !!process.env.EMAIL_USER &&
    !!process.env.EMAIL_PASS &&
    process.env.EMAIL_USER !== "your_gmail@gmail.com" &&
    process.env.EMAIL_PASS !== "your_16_char_app_password"
  );
}

type TransporterState = {
  transport: nodemailer.Transporter;
  fromAddress: string;
  isTest: boolean;
};

// Cached transporter — created once, reused for every email.
let transporterState: TransporterState | null = null;

async function getTransporterState(): Promise<TransporterState> {
  if (transporterState) return transporterState;

  if (isRealEmailConfigured()) {
    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_HOST ?? "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT ?? 587),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!,
      },
    });

    try {
      await transport.verify();
      console.log(
        `[email] SMTP ready — ${process.env.EMAIL_HOST ?? "smtp.gmail.com"} as ${process.env.EMAIL_USER}`,
      );
    } catch (error) {
      console.error(
        "[email] SMTP verification failed, falling back to Ethereal:",
        error,
      );
      return createEtherealTransporter();
    }

    transporterState = {
      transport,
      fromAddress: process.env.EMAIL_USER!,
      isTest: false,
    };
  } else {
    await createEtherealTransporter();
  }

  return transporterState!;
}

async function createEtherealTransporter(): Promise<TransporterState> {
  const testAccount = await nodemailer.createTestAccount();
  transporterState = {
    transport: nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    }),
    fromAddress: testAccount.user,
    isTest: true,
  };
  console.log(
    `[email] No SMTP configured — using Ethereal test account: ${testAccount.user}\n` +
    `[email] Emails are NOT delivered to inboxes. Open the preview URL printed after each send.`,
  );

  return transporterState;
}

async function sendMail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  const { transport, fromAddress, isTest } = await getTransporterState();

  console.debug(`[email] Sending email to ${to} via ${fromAddress} (test=${isTest})`);

  try {
    const info = await transport.sendMail({
      from: `"Swipe2Work" <${fromAddress}>`,
      to,
      subject,
      text,
      html,
    });

    if (isTest) {
      // Print the Ethereal preview URL — open it in a browser to see the email.
      console.log(`[email] Preview → ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    console.error("[email] sendMail error:", error);
    throw error;
  }
}

// ── Email templates ───────────────────────────────────────────────────────────

function baseTemplate(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <tr>
          <td style="background:#6c47ff;padding:28px;text-align:center;">
            <span style="font-size:20px;font-weight:bold;color:#fff;letter-spacing:1px;">Swipe2Work</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 24px;">
            <h2 style="margin:0 0 14px;color:#111827;font-size:20px;">${title}</h2>
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; 2026 Swipe2Work. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  toEmail: string,
  otp: string,
): Promise<void> {
  const html = baseTemplate(
    "Verify your email address",
    `
    <p style="margin:0 0 16px;color:#6b7280;font-size:15px;line-height:1.6;">
      Thanks for signing up! Enter the code below in the app to verify your
      email address. It expires in <strong>10 minutes</strong>.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <span style="display:inline-block;background:#f3f0ff;border:2px dashed #6c47ff;
                   border-radius:12px;padding:18px 36px;font-size:36px;font-weight:bold;
                   color:#6c47ff;letter-spacing:10px;">${otp}</span>
    </div>
    <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
      If you did not create a Swipe2Work account, you can safely ignore this email.
    </p>`,
  );

  await sendMail(
    toEmail,
    "Your Swipe2Work verification code",
    html,
    `Your Swipe2Work verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
  );
}

export async function sendPasswordResetEmail(
  toEmail: string,
  rawToken: string,
): Promise<void> {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${rawToken}`;

  const html = baseTemplate(
    "Reset your password",
    `
    <p style="margin:0 0 16px;color:#6b7280;font-size:15px;line-height:1.6;">
      We received a request to reset your Swipe2Work password.
      Click the button below — the link expires in <strong>1 hour</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:#6c47ff;border-radius:8px;">
          <a href="${resetLink}"
            style="display:inline-block;padding:14px 32px;color:#fff;
                   font-size:15px;font-weight:bold;text-decoration:none;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
      If the button doesn't work, copy this link:
    </p>
    <p style="margin:0 0 20px;word-break:break-all;">
      <a href="${resetLink}" style="color:#6c47ff;font-size:13px;">${resetLink}</a>
    </p>
    <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
      If you did not request this, you can safely ignore this email.
    </p>`,
  );

  await sendMail(
    toEmail,
    "Reset your Swipe2Work password",
    html,
    `Reset your password: ${resetLink}\n\nExpires in 1 hour.`,
  );
}

export async function verifyEmailExistence(email: string): Promise<{ isValid: boolean; reason?: string }> {
  // 1. Basic Format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, reason: "Please enter a valid email address." };
  }

  const parts = email.split("@");
  if (parts.length !== 2) {
    return { isValid: false, reason: "Please enter a valid email address." };
  }
  const [localPart, domain] = parts;
  if (!localPart || !domain) {
    return { isValid: false, reason: "Please enter a valid email address." };
  }

  // 2. Disposable domain check
  const disposableDomains = new Set([
    "mailinator.com", "yopmail.com", "10minutemail.com", "tempmail.com", 
    "dispostable.com", "sharklasers.com", "guerrillamail.com", "trashmail.com", 
    "getairmail.com", "fakeinbox.com", "maildrop.cc", "temp-mail.org",
    "disposable.com", "throwawaymail.com", "mailnesia.com", "mailcatch.com"
  ]);

  if (disposableDomains.has(domain.toLowerCase())) {
    return { isValid: false, reason: "Please use a real email account." };
  }

  // Bypassing DNS MX record checks in test mode so tests run fast and offline
  if (process.env.NODE_ENV === "test") {
    return { isValid: true };
  }

  // 3. MX Record check
  try {
    const mxRecords = await dnsPromises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { isValid: false, reason: "This email address does not exist." };
    }
  } catch (error: any) {
    console.error(`[email-val] DNS MX lookup failed for ${domain}:`, error);
    // If it's a structural error like ENOTFOUND or ENODATA, it means the domain/MX records don't exist
    if (error.code === "ENOTFOUND" || error.code === "ENODATA") {
      return { isValid: false, reason: "This email address does not exist." };
    }
    // Fallback or treat transient network errors
    return { isValid: false, reason: "This email address does not exist." };
  }

  return { isValid: true };
}
