const nodemailer = require("nodemailer");
require("dotenv").config();

const transport = nodemailer.createTransport({
  host: "smt.mailgun.org",
  port: 587,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const verificationEmail = async (userEmail, verificationToken) => {
  const emailOptions = {
    from: "stivensonstivi6@gmail.com",
    to: userEmail,
    subject: "E-mail verification",
    html: `Please copy the link to verify your email: http://localhost:3000/api/users/verify/${verificationToken}`,
  };

  transport.sendMail(emailOptions).catch((err) => console.log(err));
};

module.exports = { verificationEmail };
