const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, text) => {
  const msg = {
    to,
    from: process.env.SENDGRID_SENDER_EMAIL, // ✅ Your verified SendGrid sender email
    subject: `OTP is valid only for 10 min `,
    text: `Your OTP is ${subject}`,
    html: `<strong>Your OTP is ${subject}</strong>`,
  };
  console.log("msg ", msg);
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Email could not be sent.");
  }
};

module.exports = sendEmail;
