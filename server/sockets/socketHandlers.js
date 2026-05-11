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

    try {
      socket.join(socket.userId);
      await User.findByIdAndUpdate(socket.userId, { isOnline: true });

      const userChats = await Chat.find({ participants: socket.userId });
      userChats.forEach(chat => {
        socket.to(chat._id.toString()).emit('userStatusUpdate', { 
          userId: socket.userId, 
          isOnline: true 
        });
      });
    } catch (error) {
      console.error('Ошибка при подключении сокета:', error);
    }

    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
    });

    socket.on('leaveChat', (chatId) => {
      socket.leave(chatId);
    });

    socket.on('sendMessage', async ({ chatId, text, fileUrl }) => {
      try {
        let msg = await Message.create({ 
          chatId, 
          sender: socket.userId, 
          text, 
          fileUrl 
        });
        const populatedMsg = await msg.populate('sender', 'username avatarUrl displayName');

        // Обновляем время чата в БД
        Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() }).exec();

        // Отправляем сообщение всем участникам
        io.to(chatId).emit('newMessage', populatedMsg);

      } catch (error) {
        console.error('Ошибка sendMessage:', error);
        socket.emit('error_message', { message: 'Не удалось отправить сообщение' });
      }
    });

    socket.on('disconnect', async () => {
      console.log('🔌 Пользователь отключился:', socket.userId);
      try {
        await User.findByIdAndUpdate(socket.userId, { 
          isOnline: false, 
          lastSeen: new Date() 
        });

        const userChats = await Chat.find({ participants: socket.userId });
        userChats.forEach(chat => {
          socket.to(chat._id.toString()).emit('userStatusUpdate', { 
            userId: socket.userId, 
            isOnline: false 
          });
        });
      } catch (error) {
        console.error('Ошибка при отключении:', error);
      }
    });
  });
};

module.exports = setupSocketHandlers;