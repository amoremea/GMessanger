const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Функция для проверки, является ли строка корректным email
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const sendVerificationCode = async (email, code) => {
  // 1. Проверяем адрес ПЕРЕД отправкой
  if (!email || !isValidEmail(email)) {
    console.error(`❌ Ошибка: Попытка отправить код на некорректный адрес: "${email}"`);
    return { success: false, message: 'Invalid email format' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'GigaMessage <onboarding@resend.dev>',
      to: email.trim(), // Убираем лишние пробелы, если они есть
      subject: 'Код подтверждения GigaMessage',
      html: `<strong>Ваш код: ${code}</strong>. Введите его для входа в чат.`,
    });

    if (error) {
      console.error('❌ Ошибка Resend:', error);
      return { success: false, error };
    }

    console.log(`✅ Письмо успешно отправлено на ${email}! ID: ${data.id}`);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('❌ Системная ошибка отправки:', err);
    return { success: false, error: err };
  }
};

const sendResendCode = async (email, code) => {
  return await sendVerificationCode(email, code);
};

module.exports = { sendVerificationCode, sendResendCode };