import React from 'react';
import { useUser } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return <div>Нет данных пользователя</div>;

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(139,0,0,0.08)' }}>
      <h2>Профиль пользователя</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '24px 0' }}>
        {user.avatar && <img src={user.avatar} alt={user.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto' }} />}
        <div><b>Имя:</b> {user.name}</div>
        <div><b>Email:</b> {user.email}</div>
        <div><b>Телефон:</b> {user.phone}</div>
        <div><b>Должность:</b> {user.position}</div>
        <div><b>Льготы:</b> {user.benefits && user.benefits.length > 0 ? user.benefits.join(', ') : 'Нет льгот'}</div>
      </div>
      <button onClick={handleLogout} style={{ background: '#8B0000', color: '#fff', padding: '12px 32px', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Выйти</button>
    </div>
  );
};

export default Profile; 