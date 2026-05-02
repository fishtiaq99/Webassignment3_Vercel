import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("⚠ Email not configured, skipping:", subject);
      return;
    }
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log("✓ Email sent:", subject);
  } catch (error: any) {
    console.error("✗ Email error:", error.message);
  }
}

export function newLeadEmailTemplate(leadName: string, leadDetails: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; padding: 30px; text-align: center; }
        .body { padding: 30px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .high { background: #fee2e2; color: #dc2626; }
        .medium { background: #fef3c7; color: #d97706; }
        .low { background: #d1fae5; color: #059669; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0">🏠 New Lead Alert</h1>
          <p style="margin:8px 0 0;opacity:0.9">A new lead has been added to the CRM</p>
        </div>
        <div class="body">
          <h2 style="margin:0 0 4px;color:#1e293b">${leadName}</h2>
          <span class="badge ${leadDetails.priority?.toLowerCase()}">${leadDetails.priority} Priority</span>
          <br/><br/>
          <div class="detail-row"><strong>Phone</strong><span>${leadDetails.phone}</span></div>
          <div class="detail-row"><strong>Property Interest</strong><span>${leadDetails.propertyInterest}</span></div>
          <div class="detail-row"><strong>Budget</strong><span>${leadDetails.budgetFormatted}</span></div>
          <div class="detail-row"><strong>Source</strong><span>${leadDetails.source}</span></div>
          <div class="detail-row"><strong>Status</strong><span>${leadDetails.status}</span></div>
          ${leadDetails.location ? `<div class="detail-row"><strong>Location</strong><span>${leadDetails.location}</span></div>` : ""}
        </div>
        <div class="footer">PropertyCRM &bull; Automated Notification</div>
      </div>
    </body>
    </html>
  `;
}

export function assignmentEmailTemplate(
  agentName: string,
  leadName: string,
  leadDetails: any
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; }
        .body { padding: 30px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
        .cta { display: inline-block; background: #4f46e5; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; margin-top: 20px; font-weight: bold; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0">✅ Lead Assigned to You</h1>
          <p style="margin:8px 0 0;opacity:0.9">You have a new lead to handle</p>
        </div>
        <div class="body">
          <p style="color:#1e293b">Hi <strong>${agentName}</strong>,</p>
          <p style="color:#475569">A lead has been assigned to you. Please follow up as soon as possible.</p>
          <div class="detail-row"><strong>Lead Name</strong><span>${leadName}</span></div>
          <div class="detail-row"><strong>Phone</strong><span>${leadDetails.phone}</span></div>
          <div class="detail-row"><strong>Property</strong><span>${leadDetails.propertyInterest}</span></div>
          <div class="detail-row"><strong>Budget</strong><span>${leadDetails.budgetFormatted}</span></div>
          <div class="detail-row"><strong>Priority</strong><span>${leadDetails.priority}</span></div>
          ${leadDetails.location ? `<div class="detail-row"><strong>Location</strong><span>${leadDetails.location}</span></div>` : ""}
          <br/>
          <a href="${process.env.NEXTAUTH_URL}/agent/leads" class="cta">View Lead in CRM</a>
        </div>
        <div class="footer">PropertyCRM &bull; Automated Notification</div>
      </div>
    </body>
    </html>
  `;
}