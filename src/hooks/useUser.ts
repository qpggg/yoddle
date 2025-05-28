import { useState } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  avatar?: string;
  benefits?: string[];
}

// Определяем базовый URL для API-запросов
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);

  const fetchUserData = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        console.error('Ошибка при получении данных пользователя');
      }
    } catch (error) {
      console.error('Ошибка при запросе данных пользователя:', error);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    // После входа можно вызвать fetchUserData, если нужно обновить данные из таблицы
    // fetchUserData(userData.id);
  };

  const logout = () => {
    setUser(null);
  };

  return { user, setUser, login, logout, fetchUserData };
}; 