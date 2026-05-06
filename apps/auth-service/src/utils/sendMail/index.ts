import nodemailer from "nodemailer";
import dotenv from "dotenv";
import ejs from "ejs"; // Corrected ejs import
import path from "path";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  // Corrected MSTP_PORT to SMTP_PORT
  port: Number(process.env.SMTP_PORT) || 587,
  service: process.env.SMTP_SERVICE,
  auth: {
    user: process.env.SMTP_USER,
    // Corrected PASS to pass (lowercase)
    pass: process.env.SMTP_PASS,
  }
});

// Assuming Template is the string name of the template file (e.g., "verification")
const renderEmailTemplate = async (templateName: string, data: Record<string, any>): Promise<string> => {
  const templatePath = path.join(
    process.cwd(),
    "apps",
    "auth-service",
    "src",
    "utils",
    "email-templates",
    // Corrected TemplateName to Template
    `${templateName}.ejs`
  );

  return ejs.renderFile(templatePath, data);
};


//send an email using nodemailer
export const sendEmail = async (to: string, subject: string, templateName: string, data: Record<string, any>) => {
  try {
    const html = await renderEmailTemplate(templateName, data);
    await transporter.sendMail({
      from: `<$process.env.SMTP_USER}`,
      to, subject, html,
    });
    return true;
  } catch (err) {
    console.log(err);
    console.log("error sending email")
    return false;
  }

}