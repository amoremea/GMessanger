import React, { useState } from 'react';
import { API } from '../../services/api';

export const Avatar = ({ user, size = 38, showBadge = false, onClick, isGroup = false }) => {
  const [imgError, setImgError] = useState(false);

  // Для группы показываем иконку
  if (isGroup) {
    return (
      <div className="avatar-wrapper" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <div 
          className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center"
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          <i className="bi bi-people-fill"></i>
        </div>
      </div>
    );
  }

  // Проверка наличия аватара. 
  // Убираем лишний слеш, если он есть в начале avatarUrl, чтобы не было // в URL
  const hasAvatar = user?.avatarUrl && user.avatarUrl !== '' && !imgError;
  const avatarSrc = hasAvatar ? `${API}${user.avatarUrl.startsWith('/') ? '' : '/'}${user.avatarUrl}` : null;

  return (
    <div className="avatar-wrapper" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {hasAvatar ? (
        <img
          src={avatarSrc}
          alt="avatar"
          className="avatar-img"
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div 
          className="rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center"
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          {(user?.displayName || user?.username || '?')[0].toUpperCase()}
        </div>
      )}
      {showBadge && user?.isOnline && <div className="online-badge"></div>}
    </div>
  );
};