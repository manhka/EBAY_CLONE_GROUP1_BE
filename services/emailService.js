const nodemailer = require("nodemailer");

exports.sendVerificationEmail = async (to, token) => {
  const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const url = `${process.env.CLIENT_URL}/auth/verify-email?token=${token}`;

  await transport.sendMail({
    from: `"Xác thực tài khoản" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Xác thực tài khoản của bạn",
    html: `<h3>Xác thực tài khoản</h3><p>Bấm vào: <a href="${url}">${url}</a></p>`,
  });
};
