import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [selectedProvince, setSelectedProvince] = useState('甘肃');
  const [userScore, setUserScore] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [userSubject, setUserSubject] = useState('物理类');
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('gaokao_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('gaokao_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('gaokao_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('gaokao_history', JSON.stringify(history));
  }, [history]);

  const toggleFavorite = useCallback((item) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.id === item.id && f.type === item.type);
      if (exists) return prev.filter(f => !(f.id === item.id && f.type === item.type));
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, []);

  const isFavorited = useCallback((id, type) => {
    return favorites.some(f => f.id === id && f.type === type);
  }, [favorites]);

  const addHistory = useCallback((item) => {
    setHistory(prev => {
      const filtered = prev.filter(h => !(h.id === item.id && h.type === item.type));
      return [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, 20);
    });
  }, []);

  return (
    <AppContext.Provider value={{
      selectedProvince, setSelectedProvince,
      userScore, setUserScore,
      userRank, setUserRank,
      userSubject, setUserSubject,
      favorites, toggleFavorite, isFavorited,
      history, addHistory,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
