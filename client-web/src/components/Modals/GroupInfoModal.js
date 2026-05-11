import React, { useState } from 'react';
import { Avatar } from '../Common/Avatar';
import { useFriends } from '../../hooks/useFriends';
import { chatService } from '../../services/chatService';

export const GroupInfoModal = ({ chat, onClose, onOpenProfile, onRefresh }) => {
  const { friends } = useFriends();
  const [showAddSection, setShowAddSection] = useState(false);

  const friendsNotInGroup = friends.filter(
    f => !chat.participants.some(p => p._id === f._id)
  );

  const handleAddUser = async (userId) => {
    try {
      const response = await chatService.addParticipant(chat._id, userId);
      if (response.status === 200) {
        // Оповещаем MainApp, что нужно перезагрузить чаты
        if (onRefresh) await onRefresh(); 
        alert("Пользователь успешно добавлен в группу!");
      }
    } catch (err) {
      console.error("Ошибка при добавлении:", err);
      alert(err.response?.data?.error || "Не удалось добавить пользователя");
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2200 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header">
            <h5 className="modal-title">Участники: {chat.name}</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-0">
            <div className="list-group list-group-flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {chat.participants.map(p => (
                <div key={p._id} className="list-group-item d-flex align-items-center justify-content-between">
                  <div 
                    className="d-flex align-items-center" 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => { onClose(); onOpenProfile(p); }}
                  >
                    <Avatar user={p} size={35} />
                    <span className="ms-2">{p.displayName || p.username}</span>
                  </div>
                  <button className="btn btn-sm btn-light" onClick={() => { onClose(); onOpenProfile(p); }}>
                    Профиль
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3">
              <button className="btn btn-outline-primary w-100" onClick={() => setShowAddSection(!showAddSection)}>
                {showAddSection ? "Закрыть поиск" : "Добавить участников"}
              </button>
              
              {showAddSection && (
                <div className="mt-3 border rounded p-2">
                  <p className="small text-muted">Ваши друзья:</p>
                  {friendsNotInGroup.map(f => (
                    <div key={f._id} className="d-flex align-items-center justify-content-between mb-2">
                      <span>{f.displayName || f.username}</span>
                      <button className="btn btn-sm btn-success" onClick={() => handleAddUser(f._id)}>Добавить</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};