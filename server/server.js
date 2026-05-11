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
const initSocket = require('./config/socket');
const setupSocketHandlers = require('./sockets/socketHandlers');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const friendRoutes = require('./routes/friendRoutes');

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

// Создаем папку uploads
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use((req, res, next) => {
  req.io = io;
  next();
});

// 2. Настройка CORS (разрешаем Render, Localhost и Electron)
const allowedOrigins = [
  'http://localhost:3000',
  'https://gmessanger.onrender.com',
  'file://'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Подключаем БД
connectDB();
setupSocketHandlers(io);

// 3. Роуты API (БЕЗ ПРЕФИКСА /api, чтобы не ломать фронтенд)
app.use(authRoutes);
app.use(userRoutes);
app.use(chatRoutes);
app.use(friendRoutes);

// 4. Настройка фронтенда для Production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.resolve(__dirname, '../client-web/build');
  console.log('🌐 Serving static files from:', buildPath);
  
  app.use(express.static(buildPath));

  // Этот обработчик должен быть САМЫМ ПОСЛЕДНИМ
  app.get('(.*)', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});