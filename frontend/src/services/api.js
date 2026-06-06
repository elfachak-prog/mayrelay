import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const creerColis = (data) => API.post('/colis', data);
export const getMesColis = () => API.get('/colis');
export const getMissionsDisponibles = () => API.get('/missions/disponibles');
export const accepterMission = (id) => API.put(`/missions/${id}/accepter`);
export const confirmerLivraison = (id, data) => API.put(`/missions/${id}/confirmer`, data);

export default API;
