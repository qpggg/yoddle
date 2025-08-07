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
  isLoading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // AbortController для отмены запроса при unmount
    const abortController = new AbortController();
    
    const initializeUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Попытка восстановить пользователя из localStorage
        const stored = localStorage.getItem('user');
        if (!stored) {
          setIsLoading(false);
          return;
        }

        const storedUser = JSON.parse(stored);
        // Если объект поврежден — очищаем
        if (!storedUser || !storedUser.id) {
          localStorage.removeItem('user');
          setIsLoading(false);
          return;
        }

        // Если в localStorage нет email (старая структура данных), обновляем данные из API
        if (storedUser.id && (!storedUser.email || storedUser.email === undefined)) {
          console.log('🔄 Обнаружены устаревшие данные пользователя, обновляем из API...');
          
          try {
            const response = await fetch(`/api/profile?id=${storedUser.id}`, {
              signal: abortController.signal
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.user) {
              console.log('✅ Данные пользователя обновлены:', data.user);
              setUser(data.user);
            } else {
              console.log('⚠️ API не вернул данные пользователя, используем localStorage');
              setUser(storedUser);
            }
          } catch (fetchError) {
            // Проверяем, не был ли запрос отменен
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
              console.log('🚫 Запрос обновления пользователя был отменен');
              return;
            }
            
            console.error('❌ Ошибка загрузки актуальных данных пользователя:', fetchError);
            setError('Не удалось обновить данные пользователя');
            setUser(storedUser); // Используем старые данные при ошибке
          }
        } else {
          setUser(storedUser);
        }
      } catch (error) {
        console.error('❌ Ошибка инициализации пользователя:', error);
        setError('Ошибка при загрузке данных пользователя');
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    initializeUser();

    // Cleanup: отменяем запрос при unmount
    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('user');
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}; 