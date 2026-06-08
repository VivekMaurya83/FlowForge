import { create } from 'zustand';

const getInitialTheme = () => {
  const saved = localStorage.getItem('flowforge-theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('flowforge-theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return { theme: next };
    }),
}));

// Apply theme on initial load
document.documentElement.setAttribute('data-theme', getInitialTheme());

export default useThemeStore;
