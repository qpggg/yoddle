import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  benefits?: string[];
  phone?: string;
  position?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Попытка восстановить пользователя из localStorage
    const stored = localStorage.getItem('user');
    if (stored) {
      const storedUser = JSON.parse(stored);
      
      // 🔄 ПРОВЕРКА И ОБНОВЛЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
      // Если в localStorage нет email (старая структура данных), обновляем данные из API
      if (storedUser.id && (!storedUser.email || storedUser.email === undefined)) {
        console.log('🔄 Обнаружены устаревшие данные пользователя, обновляем из API...');
        
        // Загружаем актуальные данные пользователя
        fetch(`/api/profile?id=${storedUser.id}`)
          .then(response => response.json())
          .then(data => {
            if (data.user) {
              console.log('✅ Данные пользователя обновлены:', data.user);
              setUser(data.user);
            } else {
              setUser(storedUser); // Используем старые данные если API недоступен
            }
          })
          .catch(error => {
            console.error('❌ Ошибка загрузки актуальных данных пользователя:', error);
            setUser(storedUser); // Используем старые данные при ошибке
          });
      } else {
        setUser(storedUser);
      }
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const logout = () => setUser(null);

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}; 