import React from 'react';
import { API } from '../../services/api';

export const Avatar = ({ user, size = 40, isGroup = false, showBadge = false }) => {
  
  const getAvatarUrl = () => {
    if (isGroup) return null;
    if (!user?.avatarUrl) return null;
    
    const url = user.avatarUrl.trim();
    // Если ссылка полная (Cloudinary), возвращаем её
    if (url.startsWith('http')) return url;
    
    // Если локальная, клеим адрес сервера (убираем /api из конца для папки uploads)
    const base = API.replace(/\/api$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const avatarUrl = getAvatarUrl();
  const initials = !isGroup && user?.username ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <div 
      className="position-relative d-inline-block"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="avatar"
          className="rounded-circle object-fit-cover w-100 h-100 border"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div 
          className={`rounded-circle d-flex align-items-center justify-content-center border ${isGroup ? 'bg-secondary' : 'bg-primary text-white'}`}
          style={{ width: '100%', height: '100%', fontSize: size * 0.4 }}
        >
          {isGroup ? <i className="bi bi-people-fill text-white"></i> : initials}
        </div>
      )}
      
      {showBadge && user?.isOnline && (
        <span 
          className="position-absolute bottom-0 end-0 border border-white rounded-circle bg-success"
          style={{ width: size * 0.25, height: size * 0.25, padding: 0 }}
        ></span>
      )}
    </div>
  );
};