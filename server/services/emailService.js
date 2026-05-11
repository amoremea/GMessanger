const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true, // Держать соединение открытым
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationCode = async (email, code) => {
  const mailOptions = {
    from: `"GigaMessage" <${process.env.GMAIL_USER}>`,
    to: email.trim(),
    subject: 'Код подтверждения GigaMessage',
    html: `<strong>Ваш код: ${code}</strong>`,
  };

  try {
    // Мы всё еще используем await здесь, чтобы поймать ошибку в логах
    await transporter.sendMail(mailOptions);
    console.log(`✅ Письмо отправлено на ${email}`);
  } catch (err) {
    console.error('❌ Ошибка Gmail:', err);
  }
};

module.exports = { sendVerificationCode };