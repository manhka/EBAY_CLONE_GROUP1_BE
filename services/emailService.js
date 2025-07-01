const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || null,
  port: process.env.EMAIL_PORT || null,
  service: process.env.EMAIL_SERVICE || null,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  secure:
    process.env.NODE_ENV === "production" && process.env.EMAIL_PORT === "465",
});

/**
 * Send a verification email with a PIN
 * @param {string} email - Recipient's email address
 * @param {string} verificationPin - The PIN to send for verification
 */
const sendVerificationPinEmail = async (email, verificationPin) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Account Verification Code",
    html: `
            <p>Hello,</p>
            <p>Thank you for registering. Please use the PIN below to verify your email address:</p>
            <h2 style="color: #007bff; font-size: 24px; text-align: center; background-color: #f0f8ff; padding: 10px; border-radius: 5px;">${verificationPin}</h2>
            <p>This PIN will expire in ${
              process.env.PIN_EXPIRES_IN_MINUTES || "5"
            } minutes.</p>
            <p>If you did not request this registration, please disregard this email.</p>
            <p>Regards,</p>
            <p>Your Team</p>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification PIN email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send verification PIN email to ${email}:`, error);
    throw new Error(
      "Failed to send verification PIN email. Please try again later."
    );
  }
};

module.exports = {
  sendVerificationPinEmail,
};
