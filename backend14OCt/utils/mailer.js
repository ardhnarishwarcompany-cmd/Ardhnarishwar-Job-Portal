import nodemailer from "nodemailer";

// Lazily build the transporter so the app can still boot if GMAIL_USER/GMAIL_PASS
// aren't set yet (email features just fall back to mock mode in that case).
let transporter = null;
export const isEmailConfigured = () => Boolean(process.env.GMAIL_USER && process.env.GMAIL_PASS);

const getTransporter = () => {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED || "true").toLowerCase() !== "false",
      },
    });
  }
  return transporter;
};

const FROM_SENDER = `"${process.env.FROM_NAME || "Ardhnarishwar"}" <${process.env.GMAIL_USER}>`;

const brandHeader = `
  <div style="border-bottom:2px solid #38bdf8;padding-bottom:16px;margin-bottom:20px;text-align:left;">
    <div style="font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">Ardhnarishwar</div>
    <div style="font-size:11px;font-weight:700;color:#0284c7;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Company Ardhnarishwar · Official Notification</div>
  </div>`;

const brandFooter = `
  <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:left;">
    <p style="margin:0 0 4px;color:#475569;font-size:12px;font-weight:600;">
      Company Ardhnarishwar
    </p>
    <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.5;">
      This email was sent by Ardhnarishwar. This is an automated message, please do not reply directly to this email.
    </p>
  </div>`;

export const sendOtpEmail = async (toEmail, otp) => {
  const t = getTransporter();
  if (!t) return { sent: false, mocked: true };

  await t.sendMail({
    from: FROM_SENDER,
    to: toEmail,
    subject: "Your verification code — Ardhnarishwar",
    html: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:28px;border-radius:18px;border:1px solid #e2e8f0;background:#ffffff;">
        ${brandHeader}
        <h2 style="color:#0f172a;margin:0 0 10px;font-size:18px;font-weight:800;">Verify Your Email Address</h2>
        <p style="color:#334155;font-size:14px;line-height:1.6;margin:0 0 16px;">
          Use the verification code below to proceed with your request on <strong>Ardhnarishwar</strong>. This code is confidential and expires in <strong>10 minutes</strong>.
        </p>
        <div style="font-size:32px;font-weight:900;letter-spacing:8px;color:#0284c7;background:#f0f9ff;border:1px dashed #7dd3fc;border-radius:14px;padding:18px;text-align:center;margin:18px 0;">
          ${otp}
        </div>
        <p style="color:#64748b;font-size:12px;margin:0 0 8px;">If you did not request this verification code, please disregard this email.</p>
        ${brandFooter}
      </div>
    `,
  });
  return { sent: true, mocked: false };
};

export const sendWelcomeEmail = async (toEmail, name, role) => {
  const t = getTransporter();
  if (!t) return { sent: false, mocked: true };

  await t.sendMail({
    from: FROM_SENDER,
    to: toEmail,
    subject: "Welcome to Ardhnarishwar",
    html: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:500px;margin:0 auto;padding:28px;border-radius:18px;border:1px solid #e2e8f0;background:#ffffff;">
        ${brandHeader}
        <h2 style="color:#0f172a;margin:0 0 10px;font-size:18px;font-weight:800;">Welcome, ${name || "there"} 👋</h2>
        <p style="color:#334155;font-size:14px;line-height:1.6;margin:0 0 14px;">
          Your ${role === "Recruiter" ? "employer" : "candidate"} account has been created successfully with <strong>Company Ardhnarishwar</strong>.
        </p>
        <p style="color:#334155;font-size:14px;line-height:1.6;margin:0 0 14px;">
          ${role === "Recruiter" 
            ? "Your company profile is under verification by the Ardhnarishwar team — we will notify you once it has been approved." 
            : "You can now complete your profile, explore opportunities, and start applying for jobs."}
        </p>
        ${brandFooter}
      </div>
    `,
  });
  return { sent: true, mocked: false };
};

export const sendPasswordResetEmail = async (toEmail, resetLink) => {
  const t = getTransporter();
  if (!t) {
    throw new Error("SMTP is not configured. Cannot send password reset email.");
  }

  await t.sendMail({
    from: FROM_SENDER,
    to: toEmail,
    subject: "Reset your password — Ardhnarishwar",
    html: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:500px;margin:0 auto;padding:28px;border-radius:18px;border:1px solid #e2e8f0;background:#ffffff;">
        ${brandHeader}
        <h2 style="color:#0f172a;margin:0 0 10px;font-size:18px;font-weight:800;">Reset Your Password 🔑</h2>
        <p style="color:#334155;font-size:14px;line-height:1.6;margin:0 0 18px;">
          You requested to reset your password for your <strong>Ardhnarishwar</strong> account. Click the button below to choose a new password. This link remains valid for <strong>1 hour</strong>.
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${resetLink}" style="background-gradient:linear-gradient(to right, #0284c7, #2563eb);background-color:#0284c7;color:#ffffff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px;display:inline-block;box-shadow:0 4px 12px rgba(2,132,199,0.25);">Reset Password</a>
        </div>
        <p style="color:#64748b;font-size:12px;margin:16px 0 6px;">
          If the button does not work, copy and paste this URL into your browser: <br/>
          <a href="${resetLink}" style="color:#0284c7;word-break:break-all;">${resetLink}</a>
        </p>
        <p style="color:#94a3b8;font-size:12px;margin-top:14px;">If you did not request a password reset, you can safely ignore this email.</p>
        ${brandFooter}
      </div>
    `,
  });
  return { sent: true, mocked: false };
};

export const sendInterviewDecisionEmail = async (toEmail, name, jobTitle, decision, score = null) => {
  const t = getTransporter();
  if (!t) return { sent: false, mocked: true };

  const hired = String(decision || "").toUpperCase() === "HIRE";
  const subject = hired
    ? `🎉 Congratulations ${name || ""} — You are selected for ${jobTitle || "the position"} | Ardhnarishwar`
    : `Interview result: ${jobTitle || "the position"} — Ardhnarishwar`;

  await t.sendMail({
    from: FROM_SENDER,
    to: toEmail,
    subject,
    html: hired ? `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px;border-radius:18px;border:1px solid #bbf7d0;background:#ffffff;">
        ${brandHeader}
        <h2 style="color:#047857;margin:0 0 12px;font-size:20px;font-weight:900;">🎉 Congratulations, ${name || "Candidate"}!</h2>
        <p style="color:#334155;font-size:15px;line-height:1.7;">
          We are pleased to inform you that you have been <strong>selected for ${jobTitle || "the position"}</strong> through <strong>Company Ardhnarishwar</strong>.
        </p>
        <p style="color:#334155;font-size:15px;line-height:1.7;">
          Your NOVA AI interview evaluation has been completed and the final decision is <strong>HIRE</strong>.
        </p>
        <p style="color:#334155;font-size:14px;line-height:1.7;">
          Please log in to your Ardhnarishwar account to view next steps and updates from the hiring team.
        </p>
        <p style="font-size:18px;font-weight:900;color:#047857;margin-top:20px;">Welcome aboard! 🚀</p>
        ${brandFooter}
      </div>
    ` : `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px;border-radius:18px;border:1px solid #fecdd3;background:#ffffff;">
        ${brandHeader}
        <h2 style="color:#334155;margin:0 0 12px;font-size:18px;font-weight:800;">Interview Result Update</h2>
        <p style="color:#334155;font-size:15px;line-height:1.7;">
          Dear ${name || "Candidate"}, thank you for completing your NOVA AI interview for <strong>${jobTitle || "the position"}</strong> on Ardhnarishwar.
        </p>
        <p style="color:#334155;font-size:15px;line-height:1.7;">
          After review, we regret to inform you that you were not selected for this role at this time.
        </p>
        <p style="color:#64748b;font-size:14px;line-height:1.7;">
          We appreciate your time and effort and encourage you to explore other matching opportunities on Ardhnarishwar.
        </p>
        ${brandFooter}
      </div>
    `,
  });
  return { sent: true, mocked: false };
};

export const sendPaymentConfirmationEmail = async (toEmail, name, planName, billingCycle, amountInr) => {
  const t = getTransporter();
  if (!t) return { sent: false, mocked: true };
  await t.sendMail({
    from: FROM_SENDER,
    to: toEmail,
    subject: `Payment successful — ${planName} plan | Ardhnarishwar`,
    html: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px;border:1px solid #dbeafe;border-radius:18px;background:#ffffff;">
        ${brandHeader}
        <h2 style="color:#047857;margin:0 0 12px;font-size:18px;font-weight:800;">Payment Successful 🎉</h2>
        <p style="color:#334155;font-size:15px;line-height:1.7;">
          Hello ${name || "there"}, your payment for the <strong>${planName}</strong> plan has been processed successfully for the <strong>${billingCycle}</strong> billing cycle.
        </p>
        <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:16px 0;border:1px solid #e2e8f0;">
          <p style="margin:0 0 6px;color:#64748b;font-size:13px;">Plan: <strong style="color:#0f172a;">${planName}</strong></p>
          <p style="margin:0;color:#64748b;font-size:13px;">Amount Paid: <strong style="color:#047857;">₹${Number(amountInr || 0).toFixed(2)}</strong></p>
        </div>
        <p style="color:#64748b;font-size:14px;">Thank you for partnering with Company Ardhnarishwar.</p>
        ${brandFooter}
      </div>`
  });
  return { sent: true, mocked: false };
};
