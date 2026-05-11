require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');

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

// Настройка фронтенда для Production
const buildPath = path.resolve(__dirname, '../client-web/build');

if (process.env.NODE_ENV === 'production') {
  console.log('🌐 Serving static files from:', buildPath);
  
  // 1. Раздаем статические файлы
  app.use(express.static(buildPath));

  // 2. Вместо app.get со звездочкой используем middleware.
  // Если запрос дошел сюда и это не API (проверяем по отсутствию расширения или пути),
  // отдаем index.html.
  app.use((req, res, next) => {
    // Если это GET запрос и он не похож на файл (нет точки в конце пути, как .js или .css)
    if (req.method === 'GET' && !req.url.includes('.')) {
      res.sendFile(path.join(buildPath, 'index.html'));
    } else {
      next();
    }
  });
}
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});