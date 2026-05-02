require("fs")
  .readFileSync(".env.local", "utf8")
  .split("\n")
  .forEach((line) => {
    const [key, ...val] = line.split("=");
    if (key && val.length) process.env[key.trim()] = val.join("=").trim();
  });

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function test() {
  console.log("Sending test email to:", process.env.EMAIL_USER);
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "PropertyCRM - Email Test ✓",
      html: `
        <div style="font-family:Arial;padding:20px;background:#f4f4f4">
          <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:8px">
            <h2 style="color:#4f46e5">✅ Email is working!</h2>
            <p>Your PropertyCRM email notifications are configured correctly.</p>
          </div>
        </div>
      `,
    });
    console.log("✓ Email sent successfully! Check your inbox.");
  } catch (err) {
    console.error("✗ Email failed:", err.message);
  }
  process.exit();
}

test();