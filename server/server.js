require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');
const dns = require('node:dns');

// 1. Фикс для стабильных запросов к API
dns.setDefaultResultOrder('ipv4first');

const connectDB = require('./config/db');
const initSocket = require('./config/socket'); // Убедись, что внутри initSocket используются пинги
const setupSocketHandlers = require('./sockets/socketHandlers');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const friendRoutes = require('./routes/friendRoutes');

const app = express();
const server = http.createServer(app);

// 2. Инициализация Socket.io с защитой от разрывов Render
// Если initSocket возвращает io, убедись, что настройки передаются там.
// Если ты хочешь прописать их здесь, это выглядит так:
const io = initSocket(server); 

// Создаем папку uploads
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use((req, res, next) => {
  req.io = io;
  next();
});

// 3. Более гибкий CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://gmessanger.onrender.com', // Замени на свой актуальный домен
  'file://' // Для поддержки Electron
];

app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, мобильные приложения или curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB();
setupSocketHandlers(io);

// Роуты API
app.use('/api', authRoutes); // Хорошая практика - добавлять префикс /api
app.use('/api', userRoutes);
app.use('/api', chatRoutes);
app.use('/api', friendRoutes);

// --- Настройка фронтенда для Production ---
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.resolve(__dirname, '../client-web/build');
  console.log('🌐 Serving static files from:', buildPath);
  
  app.use(express.static(buildPath));

  // Исправленный роутинг для SPA
  app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});