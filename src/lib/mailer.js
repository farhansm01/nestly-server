const nodemailer = require("nodemailer");
const Subscriber = require("../models/Subscriber");

function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

async function sendNewPropertyAlert(property) {
  try {
    const activeSubscribers = await Subscriber.find({ status: "active" }).select("email");
    if (!activeSubscribers || activeSubscribers.length === 0) {
      console.log("[Mailer]: No active subscribers to notify.");
      return;
    }

    const recipientEmails = activeSubscribers.map((s) => s.email);
    console.log(`[Mailer]: Preparing property alert for ${recipientEmails.length} subscribers:`, recipientEmails);

    const transporter = createTransporter();

    if (!transporter) {
      console.log("\n=======================================================");
      console.log("💌 [AUTOMATED EMAIL ALERTS SIMULATION]");
      console.log(`To (${recipientEmails.length} subscribers): ${recipientEmails.join(", ")}`);
      console.log(`Subject: ✨ New Property Alert: ${property.title}`);
      console.log(`Property Details: ${property.location} | Price: $${Number(property.price).toLocaleString()}`);
      console.log("(Add EMAIL_USER & EMAIL_PASS to nestly-server/.env to send real emails to inboxes)");
      console.log("=======================================================\n");
      return { simulated: true, count: recipientEmails.length };
    }

    const clientUrl = process.env.CLIENT_URL || process.env.ALLOWED_ORIGIN || "https://nestly-client-silk.vercel.app";
    const propertyLink = `${clientUrl}/items/${property._id || property.id}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; padding: 24px; border-radius: 16px; border: 1px solid #334155;">
          <span style="background-color: #0d9488; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
            ✨ New Property Alert
          </span>
          <h1 style="color: #ffffff; font-size: 24px; margin-top: 16px;">${property.title}</h1>
          <p style="color: #94a3b8; font-size: 14px;">📍 ${property.location || "Prime Location"}</p>
          
          ${
            property.image
              ? `<img src="${property.image}" alt="${property.title}" style="width: 100%; height: 260px; object-fit: cover; border-radius: 12px; margin: 16px 0;" />`
              : ""
          }

          <div style="background-color: #0f172a; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
            <p style="margin: 0; color: #14b8a6; font-size: 22px; font-weight: bold;">
              $${typeof property.price === "number" ? property.price.toLocaleString("en-US") : property.price}
            </p>
            <p style="margin: 6px 0 0 0; color: #cbd5e1; font-size: 13px;">
              ${property.beds || 0} Beds • ${property.baths || 0} Baths ${property.sqft ? `• ${property.sqft}` : ""}
            </p>
            ${property.shortDesc ? `<p style="color: #94a3b8; font-size: 13px; margin-top: 8px;">${property.shortDesc}</p>` : ""}
          </div>

          <a href="${propertyLink}" style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 10px; font-size: 14px;">
            View Full Listing Details →
          </a>

          <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0 16px 0;" />
          <p style="color: #64748b; font-size: 11px; text-align: center;">
            You received this email because you subscribed to Nestly AI Real Estate Market Alerts.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Nestly AI Market Alerts" <${process.env.EMAIL_USER}>`,
      to: recipientEmails.join(", "),
      subject: `✨ New Property Alert: ${property.title} in ${property.location || "Nestly"}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[Mailer]: Property alert email sent successfully!", info.messageId);
    return { success: true, messageId: info.messageId, count: recipientEmails.length };
  } catch (error) {
    console.error("[Mailer Error]: Failed to send property alert email:", error);
    return { error: error.message };
  }
}

module.exports = { sendNewPropertyAlert };
