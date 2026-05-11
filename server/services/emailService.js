const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationCode = async (email, code) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Подтверждение входа',
    text: `Ваш код для активации аккаунта: ${code}`
  });
};

const sendResendCode = async (email, code) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Повторная отправка кода',
    text: `Ваш новый код подтверждения: ${code}`
  });
};

module.exports = { sendVerificationCode, sendResendCode };