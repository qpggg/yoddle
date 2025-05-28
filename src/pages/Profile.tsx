import React from 'react';
import { useUser } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Profile: React.FC = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return <div>Нет данных пользователя</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        maxWidth: 480,
        margin: '40px auto',
        padding: 32,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(139,0,0,0.08)',
      }}
    >
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{ marginBottom: 24, color: '#8B0000', fontSize: 24, fontWeight: 600 }}
      >
        Профиль пользователя
      </motion.h2>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '24px 0' }}
      >
        {user.avatar && (
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            src={user.avatar}
            alt={user.name}
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              objectFit: 'cover',
              margin: '0 auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />
        )}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          style={{ padding: 12, background: '#f9f9f9', borderRadius: 8 }}
        >
          <strong>Имя:</strong> {user.name}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          style={{ padding: 12, background: '#f9f9f9', borderRadius: 8 }}
        >
          <strong>Email:</strong> {user.email}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          style={{ padding: 12, background: '#f9f9f9', borderRadius: 8 }}
        >
          <strong>Телефон:</strong> {user.phone}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          style={{ padding: 12, background: '#f9f9f9', borderRadius: 8 }}
        >
          <strong>Должность:</strong> {user.position}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.6, duration: 0.5 }}
          style={{ padding: 12, background: '#f9f9f9', borderRadius: 8 }}
        >
          <strong>Льготы:</strong> {user.benefits && user.benefits.length > 0 ? user.benefits.join(', ') : 'Нет льгот'}
        </motion.div>
      </motion.div>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.5 }}
        whileHover={{ scale: 1.05, boxShadow: '0 6px 16px rgba(139,0,0,0.2)' }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLogout}
        style={{
          background: '#8B0000',
          color: '#fff',
          padding: '12px 32px',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          cursor: 'pointer',
          marginTop: 24,
          width: '100%',
        }}
      >
        Выйти
      </motion.button>
    </motion.div>
  );
};

export default Profile; 