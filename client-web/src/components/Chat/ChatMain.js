// components/Chat/ChatMain.js - Адаптивная версия
import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../Common/Avatar';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const ChatMain = ({ 
  currentChat, 
  messages, 
  chats, 
  onSendMessage, 
  onOpenProfile, 
  onOpenGroupInfo,
  isMobile,
  onBack
}) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentChat, isMobile]);

  const currentChatData = chats?.find(c => c._id === currentChat);
  const isGroup = currentChatData?.isGroup;
  const otherUser = isGroup 
    ? null 
    : currentChatData?.participants?.find(p => p._id !== user?.userId);

  const chatName = isGroup 
    ? currentChatData?.name 
    : (otherUser?.displayName || otherUser?.username || 'Чат');

  const handleHeaderClick = () => {
    if (isGroup) {
      onOpenGroupInfo();
    } else if (otherUser) {
      onOpenProfile(otherUser);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return;
    await onSendMessage(text, file);
    setText('');
    setFile(null);
    setFileName('');
    e.target.reset();
  };

  const getFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (!currentChat) {
    return (
      <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-chat">
        <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
          <i className="bi bi-chat-dots display-1 mb-3 d-block"></i>
          <p>Выберите чат, чтобы начать общение</p>
          {isMobile && (
            <button 
              className="btn btn-primary mt-3 rounded-pill"
              onClick={onBack}
            >
              <i className="bi bi-arrow-left me-2"></i>
              К списку чатов
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-main h-100 d-flex flex-column">
      {/* Десктопный хедер */}
      {!isMobile && (
        <div className="chat-header">
          <div className="d-flex align-items-center" style={{ cursor: 'pointer' }} onClick={handleHeaderClick}>
            <Avatar user={isGroup ? null : otherUser} size={40} isGroup={isGroup} showBadge={!isGroup} />
            <div className="ms-3">
              <h6 className="m-0 fw-bold" style={{ color: 'var(--text-primary)' }}>{chatName}</h6>
              <small style={{ color: 'var(--text-secondary)' }}>
                {isGroup 
                  ? `${currentChatData?.participants?.length || 0} участников` 
                  : (otherUser?.isOnline ? 'в сети' : 'был(а) недавно')}
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Область сообщений */}
      <div className="messages-area">
        {messages.map((msg, index) => {
          const isMe = msg.sender?._id === user?.userId || msg.sender === user?.userId;
          const fileUrl = getFileUrl(msg.fileUrl);
          const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);

          return (
            <div key={msg._id || index} className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
              {!isMe && isGroup && (
                <div 
                  className="me-2 mt-auto" 
                  onClick={() => onOpenProfile(msg.sender)} 
                  style={{ cursor: 'pointer' }}
                >
                  <Avatar user={msg.sender} size={28} />
                </div>
              )}
              <div className={`message-bubble ${isMe ? 'message-sent' : 'message-received'}`}>
                {!isMe && isGroup && (
                  <div className="fw-bold small mb-1" style={{ color: 'var(--accent)' }}>
                    {msg.sender?.displayName || msg.sender?.username}
                  </div>
                )}
                
                {msg.fileUrl && (
                  <div className="mb-2">
                    {isImage ? (
                      <img 
                        src={fileUrl} 
                        alt="attachment" 
                        className="img-fluid rounded" 
                        style={{ maxHeight: '200px', cursor: 'pointer', borderRadius: '12px' }} 
                        onClick={() => window.open(fileUrl, '_blank')}
                        loading="lazy"
                      />
                    ) : (
                      <a href={fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                        <i className="bi bi-file-earmark-arrow-down me-1"></i> Скачать файл
                      </a>
                    )}
                  </div>
                )}
                
                {msg.text && (
                  <div className="message-content" style={{ wordBreak: 'break-word' }}>
                    {msg.text}
                  </div>
                )}
                
                <div className="text-end mt-1" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Форма ввода */}
      <form className="message-input-form" onSubmit={handleSend}>
        {file && (
          <div className="position-absolute bottom-100 mb-2 p-2 bg-primary rounded d-flex gap-2 align-items-center" style={{ left: 16, right: 16 }}>
            <small className="text-white text-truncate flex-grow-1">
              <i className="bi bi-paperclip me-1"></i>{fileName}
            </small>
            <button type="button" className="btn-close btn-close-white" onClick={() => { setFile(null); setFileName(''); }}></button>
          </div>
        )}
        
        <label className="btn btn-link text-decoration-none p-0" style={{ color: 'var(--accent)' }}>
          <i className="bi bi-paperclip fs-5"></i>
          <input type="file" className="d-none" onChange={handleFileChange} />
        </label>
        
        <input
          ref={inputRef}
          className="message-input"
          placeholder="Напишите сообщение..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        
        <button 
          className="btn btn-link p-0" 
          style={{ color: 'var(--accent)' }}
          type="submit" 
          disabled={!text.trim() && !file}
        >
          <i className="bi bi-send-fill fs-5"></i>
        </button>
      </form>
    </div>
  );
};