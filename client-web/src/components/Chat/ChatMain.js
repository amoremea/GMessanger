import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../Common/Avatar';

const API = 'http://localhost:5000';

export const ChatMain = ({ 
  currentChat, 
  messages, 
  chats, 
  onSendMessage, 
  onOpenProfile, 
  onOpenGroupInfo 
}) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const messagesEndRef = useRef(null);

  // Автопрокрутка вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Находим данные текущего выбранного чата
  const currentChatData = chats?.find(c => c._id === currentChat);
  const isGroup = currentChatData?.isGroup;

  // Логика определения имени и собеседника
  const otherUser = isGroup 
    ? null 
    : currentChatData?.participants?.find(p => p._id !== user?.userId);

  const chatName = isGroup 
    ? currentChatData?.name 
    : (otherUser?.displayName || otherUser?.username || 'Чат');

  // Обработка клика по шапке
  const handleHeaderClick = () => {
    if (isGroup) {
      onOpenGroupInfo(); // Открываем список участников группы
    } else if (otherUser) {
      onOpenProfile(otherUser); // Открываем профиль собеседника
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

  if (!currentChat) {
    return (
      <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center text-muted">
          <i className="bi bi-chat-dots display-1 mb-3 d-block"></i>
          <p>Выберите чат, чтобы начать общение</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow-1 chat-main h-100 d-flex flex-column bg-light">
      {/* Заголовок чата (Header) */}
      <div className="p-3 bg-white border-bottom d-flex align-items-center shadow-sm" style={{ zIndex: 5 }}>
        <div 
          className="d-flex align-items-center" 
          style={{ cursor: 'pointer' }} 
          onClick={handleHeaderClick}
        >
          <Avatar 
            user={isGroup ? null : otherUser} 
            size={38} 
            isGroup={isGroup} 
            showBadge={!isGroup} 
          />
          <div className="ms-3">
            <h6 className="m-0 fw-bold text-dark">{chatName}</h6>
            <small className="text-muted">
              {isGroup 
                ? `${currentChatData?.participants?.length || 0} участников` 
                : (otherUser?.isOnline ? 'в сети' : 'был(а) недавно')}
            </small>
          </div>
        </div>
      </div>

      {/* Список сообщений */}
      <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-3">
        {messages.map((msg, index) => {
          const isMe = msg.sender?._id === user?.userId || msg.sender === user?.userId;
          return (
            <div key={msg._id || index} className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
              {!isMe && isGroup && (
                <div className="me-2 mt-auto" onClick={() => onOpenProfile(msg.sender)} style={{ cursor: 'pointer' }}>
                  <Avatar user={msg.sender} size={28} />
                </div>
              )}
              <div className={`message-bubble p-3 shadow-sm ${isMe ? 'bg-primary text-white sender' : 'bg-white text-dark recipient'}`}
                   style={{ 
                     maxWidth: '70%', 
                     borderRadius: isMe ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                     position: 'relative'
                   }}>
                {!isMe && isGroup && (
                  <div className="fw-bold small mb-1 text-primary">
                    {msg.sender?.displayName || msg.sender?.username}
                  </div>
                )}
                
                {msg.fileUrl && (
                  <div className="mb-2">
                    {msg.fileUrl.match(/\.(jpeg|jpg|gif|png)$/) ? (
                      <img src={`${API}${msg.fileUrl}`} alt="attachment" className="img-fluid rounded" style={{ maxHeight: '200px' }} />
                    ) : (
                      <a href={`${API}${msg.fileUrl}`} target="_blank" rel="noreferrer" className={isMe ? 'text-white' : 'text-primary'}>
                        <i className="bi bi-file-earmark-arrow-down me-1"></i>
                        Документ
                      </a>
                    )}
                  </div>
                )}
                
                <div className="message-text" style={{ wordBreak: 'break-word' }}>{msg.text}</div>
                <div className={`text-end mt-1 ${isMe ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.7rem' }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Панель ввода (Input Area) */}
      <div className="p-3 bg-white border-top">
        {file && (
          <div className="mb-2 p-2 bg-light rounded d-flex justify-content-between align-items-center">
            <small className="text-muted text-truncate">
              <i className="bi bi-paperclip me-1"></i>{fileName}
            </small>
            <button type="button" className="btn-close btn-sm" onClick={() => { setFile(null); setFileName(''); }}></button>
          </div>
        )}
        
        <form className="d-flex gap-2 align-items-center" onSubmit={handleSend}>
          <label className="btn btn-outline-secondary rounded-circle m-0 d-flex align-items-center justify-content-center" style={{ width: 42, height: 42, cursor: 'pointer' }}>
            <i className="bi bi-paperclip"></i>
            <input type="file" className="d-none" onChange={handleFileChange} />
          </label>
          
          <input
            className="form-control rounded-pill px-4 shadow-sm border-0 bg-light"
            placeholder="Напишите сообщение..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
          
          <button 
            className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center shadow" 
            style={{ width: 42, height: 42 }} 
            type="submit"
            disabled={!text.trim() && !file}
          >
            <i className="bi bi-send-fill"></i>
          </button>
        </form>
      </div>
    </div>
  );
};