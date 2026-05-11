import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export const Verify = ({ onBackToLogin }) => {
  const { email, verify, resendCode } = useAuth();
  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleVerify = async () => {
    const result = await verify(code);
    if (!result.success) {
      setError(result.error);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    const result = await resendCode();
    if (result.success) {
      setResendTimer(60);
    } else {
      setError(result.error);
    }
  };

  return (
    <>
      <div className="auth-image-verify"></div>
      <h4 className="auth-title">{email}</h4>
      <p className="auth-subtitle">Мы отправили код подтверждения на вашу почту. Введите его ниже.</p>
      <input
        className="tg-input code-input"
        placeholder="Код"
        maxLength="6"
        value={code}
        onChange={e => setCode(e.target.value)}
      />
      {error && <div className="text-danger small mb-2">{error}</div>}
      <button className="tg-btn-primary" onClick={handleVerify}>ПОДТВЕРДИТЬ</button>

      <div className="mt-3">
        <button
          className="tg-btn-link d-block w-100"
          onClick={handleResend}
          disabled={resendTimer > 0}
        >
          {resendTimer > 0 ? `Отправить снова через ${resendTimer}с` : "Отправить код еще раз"}
        </button>
        <button className="tg-btn-link text-danger" onClick={onBackToLogin}>Отмена</button>
      </div>
    </>
  );
};