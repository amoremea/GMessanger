// components/Modals/ProfileModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Avatar } from '../Common/Avatar';
import { useFriends } from '../../hooks/useFriends';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { API_URL } from '../../services/api';

export const ProfileModal = ({ user, onClose, openChat }) => {
  const { token, user: currentUser } = useAuth();
  const { 
    friends, 
    friendRequests, 
    sendFriendRequest, 
    cancelFriendRequest, 
    removeFriend 
  } = useFriends();
  
  const { createChat } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ bio: '', displayName: '' });
  const [uploading, setUploading] = useState(false);
  
  const isMyProfile = user?._id === currentUser?.userId;
  const isFriend = friends.some(f => f._id === user?._id);
  const hasSentRequest = friendRequests?.some(r => r._id === user?._id);

  useEffect(() => {
    if (user) {
      setEditedUser({
        bio: user.bio || '',
        displayName: user.displayName || user.username || ''
      });
    }
  }, [user]);

  const handleStartChat = async () => {
    try {
      const chat = await createChat([user._id], false);
      if (chat && chat._id) {
        if (openChat) await openChat(chat._id);
        onClose();
      }
    } catch (err) {
      console.error('Ошибка при переходе в чат:', err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await axios.put(`${API_URL}/profile`, editedUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Профиль обновлен');
      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      console.error('Ошибка обновления профиля:', err);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${API_URL}/update-avatar`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Аватар обновлен!');
      window.location.reload();
    } catch (err) {
      console.error('Ошибка загрузки аватара:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-modal" onClick={onClose}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="profile-modal-close" onClick={onClose}>
          <i className="bi bi-x-lg"></i>
        </button>
        
        <div className="profile-modal-body">
          <div className="profile-avatar-section">
            <Avatar user={user} size={100} />
            {isMyProfile && (
              <label className="profile-avatar-upload">
                <i className="bi bi-camera"></i>
                {uploading ? '...' : ''}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            )}
          </div>
          
          {isEditing ? (
            // Режим редактирования - только для своего профиля
            <div className="profile-edit-form">
              <div className="profile-field">
                <label>Отображаемое имя</label>
                <input
                  type="text"
                  value={editedUser.displayName}
                  onChange={e => setEditedUser({ ...editedUser, displayName: e.target.value })}
                />
              </div>
              <div className="profile-field">
                <label>О себе</label>
                <textarea
                  rows="3"
                  placeholder="Расскажите о себе..."
                  value={editedUser.bio}
                  onChange={e => setEditedUser({ ...editedUser, bio: e.target.value })}
                />
              </div>
              <div className="profile-edit-buttons">
                <button className="profile-btn primary" onClick={handleSaveProfile}>Сохранить</button>
                <button className="profile-btn secondary" onClick={() => setIsEditing(false)}>Отмена</button>
              </div>
            </div>
          ) : (
            // Режим просмотра
            <>
              <h3 className="profile-name">{user?.displayName || user?.username}</h3>
              <p className="profile-username">@{user?.username}</p>
              
              <div className="profile-bio">
                <div className="profile-bio-label">О себе</div>
                <p>{user?.bio || <span className="profile-bio-empty">Информация отсутствует</span>}</p>
              </div>

              <div className="profile-actions">
                {/* Кнопка написания сообщения - только для чужих профилей */}
                {!isMyProfile && (
                  <button className="profile-btn primary" onClick={handleStartChat}>
                    <i className="bi bi-chat-dots"></i>
                    Написать сообщение
                  </button>
                )}

                {/* Кнопки управления дружбой - только для чужих профилей */}
                {!isMyProfile && (
                  <>
                    {isFriend ? (
                      <button className="profile-btn danger" onClick={() => {
                        if (window.confirm(`Удалить ${user?.username} из друзей?`)) {
                          removeFriend(user._id);
                          onClose();
                        }
                      }}>
                        <i className="bi bi-person-x"></i>
                        Удалить из друзей
                      </button>
                    ) : hasSentRequest ? (
                      <button className="profile-btn secondary" onClick={() => cancelFriendRequest(user._id)}>
                        <i className="bi bi-clock"></i>
                        Отменить заявку
                      </button>
                    ) : (
                      <button className="profile-btn success" onClick={() => sendFriendRequest(user._id)}>
                        <i className="bi bi-person-plus"></i>
                        Добавить в друзья
                      </button>
                    )}
                  </>
                )}

                {/* Кнопка редактирования - только для своего профиля */}
                {isMyProfile && (
                  <button className="profile-btn secondary" onClick={() => setIsEditing(true)}>
                    <i className="bi bi-pencil"></i>
                    Редактировать профиль
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};