import React from 'react';

export const SettingsMenu = ({ user, theme, onThemeChange, onLogout, onOpenProfile }) => {
  return (
    <div className="card position-absolute shadow-lg" style={{ bottom: '60px', left: '0', width: '220px', zIndex: 1050 }}>
      <div className="card-body p-3 text-dark">
        <h6 className="small fw-bold mb-2">АККАУНТ</h6>
        <button className="btn btn-sm btn-primary w-100 mb-2" onClick={onOpenProfile}>
          Мой профиль
        </button>

        <h6 className="card-title small fw-bold mb-3 text-muted">ТЕМА</h6>
        <div className="d-flex gap-2 mb-3">
          <button className={`btn btn-sm ${theme === 'theme-light' ? 'btn-primary' : 'btn-outline-secondary'} flex-grow-1`} onClick={() => onThemeChange('theme-light')}>☀️</button>
          <button className={`btn btn-sm ${theme === 'theme-dark' ? 'btn-primary' : 'btn-outline-dark'} flex-grow-1`} onClick={() => onThemeChange('theme-dark')}>🌙</button>
          <button className={`btn btn-sm ${theme === 'theme-matrix' ? 'btn-primary' : 'btn-outline-success'} flex-grow-1`} onClick={() => onThemeChange('theme-matrix')}>📟</button>
        </div>

        <button className="btn btn-danger btn-sm w-100" onClick={onLogout}>Выход</button>
      </div>
    </div>
  );
};