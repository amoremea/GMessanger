require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');
const dns = require('node:dns');

// 1. Фикс для стабильных запросов к API (Resend/MongoDB)
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

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

connectDB();
setupSocketHandlers(io);

// Роуты API
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', chatRoutes);
app.use('/', friendRoutes);

// --- Настройка фронтенда для Production ---
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.resolve(__dirname, '../client-web/build');
  console.log('🌐 Serving static files from:', buildPath);
  
  app.use(express.static(buildPath));

  app.get('*', (req, res) => {
    // Если это не API запрос (можно добавить проверку !req.url.startsWith('/api'))
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});