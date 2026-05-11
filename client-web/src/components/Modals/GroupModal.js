import React, { useState } from 'react';
import { Avatar } from '../Common/Avatar';
import { useFriends } from '../../hooks/useFriends';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';

export const GroupModal = ({ onClose }) => {
  const { user } = useAuth();
  const { friends } = useFriends();
  const { createChat } = useChat();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      alert("Введите название группы и выберите хотя бы одного участника");
      return;
    }

    // ВАЖНО: создаем массив участников, включая текущего пользователя
    const allParticipants = [user?.userId, ...selectedUsers];
    console.log('👥 Создание группы с участниками:', allParticipants);
    console.log('👤 Текущий пользователь:', user?.userId);
    console.log('📋 Выбранные друзья:', selectedUsers);

    try {
      const chat = await createChat(allParticipants, true, groupName);
      console.log('✅ Группа создана:', chat);
      onClose();
    } catch (error) {
      console.error("❌ Ошибка при создании группы:", error);
      alert("Ошибка при создании группы");
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2100 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 text-dark">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Создание группы</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <label className="small fw-bold mb-1">Название группы:</label>
            <input
              className="form-control mb-3"
              placeholder="Введите название..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <label className="small fw-bold mb-1">Выберите участников:</label>
            <div className="overflow-auto" style={{ maxHeight: '200px' }}>
              {friends.length > 0 ? (
                friends.map(f => (
                  <div
                    key={f._id}
                    className={`d-flex align-items-center p-2 mb-1 rounded cursor-pointer ${selectedUsers.includes(f._id) ? 'bg-primary text-white' : 'bg-light'}`}
                    onClick={() => toggleUserSelection(f._id)}
                  >
                    <Avatar user={f} size={30} />
                    <div className="ms-2">{f.displayName || f.username}</div>
                    {selectedUsers.includes(f._id) && <i className="bi bi-check-lg ms-auto"></i>}
                  </div>
                ))
              ) : (
                <p className="text-muted small">Сначала добавьте кого-нибудь в друзья</p>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={!groupName.trim() || selectedUsers.length === 0}
            >
              Создать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};