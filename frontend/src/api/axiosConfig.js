import axios from 'axios';

const getBaseURL = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8080/api';
  }
  return 'http://192.168.56.1:8080/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic interceptor to attach the secure authorization header to every single request click
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // FIX: Ensure there is an absolute space character after the word Bearer
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;