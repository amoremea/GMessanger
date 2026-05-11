import axios from 'axios';

// Если в браузере адрес содержит 'render.com', значит мы на сервере.
// В этом случае используем пустую строку (относительный путь), 
// иначе — наш локальный хост.
const isProduction = window.location.hostname !== 'localhost';

const API = isProduction 
  ? 'https://gmessanger.onrender.com' // Можно указать явно для надежности
  : 'http://localhost:5000';

const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерсептор для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Интерсептор для обработки ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('authError'));
    }
    return Promise.reject(error);
  }
);

export default api;
export { API };