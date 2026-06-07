import { create } from 'zustand';
import axios from 'axios';

// Create an axios instance for authenticated requests
export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

// Interceptor to add token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flowforge_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('flowforge_token') || null,
  isAuthenticated: !!localStorage.getItem('flowforge_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new URLSearchParams();
      formData.append('username', email); // OAuth2 expects username
      formData.append('password', password);

      const res = await axios.post('http://127.0.0.1:8000/api/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const token = res.data.access_token;
      localStorage.setItem('flowforge_token', token);
      
      set({ token, isAuthenticated: true });
      await get().fetchUser();
      
      set({ isLoading: false });
      return { success: true };
    } catch (err) {
      set({ 
        isLoading: false, 
        error: err.response?.data?.detail || 'Login failed' 
      });
      return { success: false };
    }
  },

  signup: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post('http://127.0.0.1:8000/api/auth/signup', {
        name, email, password
      });
      
      // Auto-login after signup
      return await get().login(email, password);
    } catch (err) {
      set({ 
        isLoading: false, 
        error: err.response?.data?.detail || 'Signup failed' 
      });
      return { success: false };
    }
  },

  fetchUser: async () => {
    const { token } = get();
    if (!token) return;
    
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, isAuthenticated: true });
    } catch (err) {
      // Token invalid or expired
      get().logout();
    }
  },

  logout: () => {
    localStorage.removeItem('flowforge_token');
    set({ user: null, token: null, isAuthenticated: false });
    // Also wipe diagram store so previous user's diagrams don't bleed into next session
    import('./diagramStore').then(({ default: useDiagramStore }) => {
      useDiagramStore.setState({
        nodes: [],
        edges: [],
        diagramId: null,
        diagramTitle: 'Untitled Diagram',
        selectedNodeId: null,
        selectedEdgeId: null,
        versions: [],
        aiError: null,
      });
    });
  }
}));

export default useAuthStore;
