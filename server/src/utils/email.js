import nodemailer from "nodemailer";
import { logger } from "../utils/logger.js";

// Setup transporter for ethereal email for development purposes, assuming real SMTP info not present yet.
// Usually we'd configure this with host, port, user, pass from env.

let transporter = null;

const createTransporter = async () => {
  if (transporter) return transporter;

  // For testing, let's use Ethereal Email if no credentials are provided.
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    logger.info("No SMTP settings in .env. Falling back to Ethereal Mail...");
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const tp = await createTransporter();

    const info = await tp.sendMail({
      from: '"TaskFlow System" <noreply@taskflow.local>', // sender address
      to,
      subject,
      html,
    });

    logger.info(`Message sent: ${info.messageId}`);

    // Preview URL available only when using Ethereal account
    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (error) {
    logger.error("Error sending email:", error);
    throw error;
  }
};
