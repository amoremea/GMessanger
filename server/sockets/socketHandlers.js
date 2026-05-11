const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

const setupSocketHandlers = (io) => {
  // Middleware для авторизации
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error: No token provided'));
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    console.log('🔌 Пользователь подключился:', socket.userId);

    // 1. При подключении сразу заходим в личную комнату
    socket.join(socket.userId);

    try {
      await User.findByIdAndUpdate(socket.userId, { isOnline: true });

      // Оповещаем друзей/чаты об онлайне
      const userChats = await Chat.find({ participants: socket.userId });
      userChats.forEach(chat => {
        // Используем io.to вместо socket.to для надежности
        io.to(chat._id.toString()).emit('userStatusUpdate', { 
          userId: socket.userId, 
          isOnline: true 
        });
      });
    } catch (error) {
      console.error('Ошибка при статусе online:', error);
    }

    // 2. Вход в чат (клиент вызывает это при открытии окна чата)
    socket.on('joinChat', (chatId) => {
      console.log(`👤 Пользователь ${socket.userId} вошел в чат ${chatId}`);
      socket.join(chatId);
    });

    // 3. Выход из чата
    socket.on('leaveChat', (chatId) => {
      console.log(`👤 Пользователь ${socket.userId} покинул чат ${chatId}`);
      socket.leave(chatId);
    });

    // 4. Отправка сообщения
    socket.on('sendMessage', async ({ chatId, text, fileUrl }) => {
      try {
        // Простая валидация, чтобы не падал сервер
        if (!chatId || (!text && !fileUrl)) return;

        let msg = await Message.create({ 
          chatId, 
          sender: socket.userId, 
          text, 
          fileUrl 
        });
        
        const populatedMsg = await msg.populate('sender', 'username avatarUrl displayName');

        // Обновляем время чата
        await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });

        // Важно: отправляем ВСЕМ в комнате через io.to
        // Это гарантирует, что сообщение появится у всех участников мгновенно
        io.to(chatId).emit('newMessage', populatedMsg);

      } catch (error) {
        console.error('Ошибка sendMessage:', error);
        socket.emit('error_message', { message: 'Не удалось отправить сообщение' });
      }
    });

    socket.on('disconnect', async () => {
      console.log('🔌 Пользователь отключился:', socket.userId);
      try {
        // Небольшая задержка перед оффлайном (защита от случайных миганий связи)
        setTimeout(async () => {
            // Проверяем, не переподключился ли пользователь под тем же ID
            const activeSockets = await io.in(socket.userId).fetchSockets();
            if (activeSockets.length === 0) {
                await User.findByIdAndUpdate(socket.userId, { 
                  isOnline: false, 
                  lastSeen: new Date() 
                });

                const userChats = await Chat.find({ participants: socket.userId });
                userChats.forEach(chat => {
                  io.to(chat._id.toString()).emit('userStatusUpdate', { 
                    userId: socket.userId, 
                    isOnline: false 
                  });
                });
            }
        }, 5000); 
      } catch (error) {
        console.error('Ошибка при отключении:', error);
      }
    });
  });
};

module.exports = setupSocketHandlers;