import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Avatar } from '../Common/Avatar';
import { useFriends } from '../../hooks/useFriends';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';

const API = 'http://localhost:5000';

export const ProfileModal = ({ user, onClose, openChat }) => {
  const { token, user: currentUser } = useAuth();
  const { 
    friends, 
    friendRequests, 
    sendFriendRequest, 
    cancelFriendRequest, 
    removeFriend 
  } = useFriends();
  
  const { createChat, findExistingPrivateChat } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  // УДАЛЕНО: location
  const [editedUser, setEditedUser] = useState({ bio: '', displayName: '' });
  const [uploading, setUploading] = useState(false);
  
  const isMyProfile = user?._id === currentUser?.userId;
  const isFriend = friends.some(f => f._id === user?._id);
  const hasSentRequest = friendRequests?.some(r => r._id === user?._id);
  const existingChat = findExistingPrivateChat?.(user?._id);

  useEffect(() => {
    if (user) {
      setEditedUser({
        bio: user.bio || '',
        // УДАЛЕНО: location
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
      await axios.put(`${API}/profile`, editedUser, {
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
      await axios.post(`${API}/update-avatar`, formData, {
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
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2100 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header">
            <h5 className="modal-title">
              {isMyProfile ? 'Мой профиль' : `Профиль ${user?.displayName || user?.username}`}
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body text-center">
            <Avatar user={user} size={100} />
            
            {isMyProfile && (
              <div className="mt-2">
                <label className="btn btn-sm btn-outline-primary" style={{ cursor: 'pointer' }}>
                  <i className="bi bi-camera me-1"></i>
                  {uploading ? 'Загрузка...' : 'Изменить аватар'}
                  <input type="file" className="d-none" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>
            )}
            
            {isEditing ? (
              <div className="mt-3 text-start">
                <label className="small fw-bold text-muted">Отображаемое имя</label>
                <input
                  type="text"
                  className="form-control mb-2"
                  value={editedUser.displayName}
                  onChange={e => setEditedUser({ ...editedUser, displayName: e.target.value })}
                />
                <label className="small fw-bold text-muted">О себе</label>
                <textarea
                  className="form-control mb-3"
                  rows="3"
                  placeholder="Расскажите о себе..."
                  value={editedUser.bio}
                  onChange={e => setEditedUser({ ...editedUser, bio: e.target.value })}
                />
                <div className="d-flex gap-2">
                  <button className="btn btn-primary flex-grow-1" onClick={handleSaveProfile}>Сохранить</button>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Отмена</button>
                </div>
              </div>
            ) : (
              <>
                <h4 className="mt-3 mb-1">{user?.displayName || user?.username}</h4>
                <p className="text-muted small mb-3">@{user?.username}</p>
                
                {/* НОВЫЙ БЛОК: Отображение Био для всех */}
                <div className="text-start bg-light p-3 rounded mb-3">
                   <h6 className="small fw-bold text-uppercase text-muted mb-2">О себе</h6>
                   <p className="mb-0 small" style={{ whiteSpace: 'pre-wrap' }}>
                     {user?.bio || <span className="text-muted fst-italic">Информация отсутствует</span>}
                   </p>
                </div>

                <hr />
                
                <div className="d-flex flex-column gap-2">
                  <button className="btn btn-primary" onClick={handleStartChat}>
                    <i className="bi bi-chat-dots me-2"></i>
                    {existingChat ? 'Перейти в чат' : 'Написать сообщение'}
                  </button>

                  {!isMyProfile && (
                    <>
                      {isFriend ? (
                        <button 
                          className="btn btn-outline-danger" 
                          onClick={() => {
                            if (window.confirm(`Вы уверены, что хотите удалить ${user?.username} из друзей?`)) {
                              removeFriend(user._id);
                            }
                          }}
                        >
                          <i className="bi bi-person-x me-2"></i>Удалить из друзей
                        </button>
                      ) : hasSentRequest ? (
                        <button className="btn btn-outline-secondary" onClick={() => cancelFriendRequest(user._id)}>
                          <i className="bi bi-clock me-2"></i>Отменить заявку
                        </button>
                      ) : (
                        <button className="btn btn-success" onClick={() => sendFriendRequest(user._id)}>
                          <i className="bi bi-person-plus me-2"></i>Добавить в друзья
                        </button>
                      )}
                    </>
                  )}

                  {isMyProfile && (
                    <button className="btn btn-outline-primary" onClick={() => setIsEditing(true)}>
                      <i className="bi bi-pencil me-2"></i>Редактировать профиль
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};