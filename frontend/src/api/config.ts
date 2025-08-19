import axios from 'axios';

const BASE_URL = process.env.NODE_ENV === "production" 
  ? `https://be.${window.location.hostname}`
  : "http://127.0.0.1:8080/";

console.log('API Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === 'Network Error') {
      console.error('Unable to connect to the server. Please check if the server is running.');
    }
    return Promise.reject(error);
  }
);

export default api; 