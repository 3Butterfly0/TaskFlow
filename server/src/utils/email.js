import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

let transporter = null;

const createTransporter = async () => {
  if (transporter) return transporter;

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
    // Fallback to Ethereal test account when no SMTP is configured
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info("No SMTP settings found. Using Ethereal Mail for testing.");
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const tp = await createTransporter();

    const fromAddress = process.env.SMTP_FROM || '"TaskFlow" <noreply@taskflow.app>';

    const info = await tp.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });

    logger.info(`Email sent: ${info.messageId}`);

    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (error) {
    logger.error("Error sending email:", error);
    throw error;
  }
};
