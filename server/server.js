require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');
const dns = require('node:dns');

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

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use((req, res, next) => {
  req.io = io;
  next();
});

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

connectDB();
setupSocketHandlers(io);

// 1. Сначала API роуты
app.use(authRoutes);
app.use(userRoutes);
app.use(chatRoutes);
app.use(friendRoutes);

// 2. Затем статика и React Router
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.resolve(__dirname, '../client-web/build');
  app.use(express.static(buildPath));

  // Используем функцию вместо строки/регулярки для максимальной совместимости
  app.get('*', (req, res, next) => {
    // Если запрос на API или файл, пропускаем
    if (req.url.startsWith('/api') || req.url.includes('.')) {
      return next();
    }
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});