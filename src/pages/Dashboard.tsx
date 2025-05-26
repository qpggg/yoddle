import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCircle, 
  Gift, 
  ChartBar, 
  Settings, 
  MessageCircle,
  Bell
} from 'lucide-react';
import '../styles/Dashboard.css';
import { useUser, User } from '../hooks/useUser';

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

function ProfileEditModal({ open, onClose, user, setUser }: ProfileEditModalProps) {
  const [form, setForm] = useState<{
    name: string;
    email: string;
    phone: string;
    position: string;
    photo: string | File;
  }>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    position: user?.position || '',
    photo: user?.avatar || '' as string | File
  });
  const [photoPreview, setPhotoPreview] = useState(user?.avatar || '');

  useEffect(() => {
    if (open) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          setForm({
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            position: data.user.position || '',
            photo: data.user.avatar || ''
          });
          setPhotoPreview(data.user.avatar || '');
        });
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setForm(f => ({ ...f, photo: file as File }));
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('id', user?.id || '');
    formData.append('name', form.name);
    formData.append('email', form.email);
    formData.append('unused', '');
    formData.append('phone', form.phone);
    formData.append('position', form.position);
    if (form.photo && typeof form.photo !== 'string') formData.append('avatar', form.photo);
    else formData.append('avatar', form.photo as string);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      body: formData,
    });
    if (res.ok) {
      const updated = await res.json();
      setUser(updated.user);
      window.location.reload();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <motion.div
            className="profile-modal"
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{
              background: '#fff', borderRadius: 16, padding: 32, minWidth: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
              <label style={{ cursor: 'pointer' }}>
                {photoPreview
                  ? <img src={photoPreview} alt="profile" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
                  : <UserCircle size={80} color="#750000" />
                }
                <input type="file" accept="image/*" onChange={handlePhoto} hidden />
                <div style={{ textAlign: 'center', color: '#750000', fontSize: 12, marginTop: 4 }}>Изменить фото</div>
              </label>
            </div>
            <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleSubmit}>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Имя" style={{ padding: 10, borderRadius: 8, border: '1px solid #eee' }} />
              <input name="email" value={form.email} onChange={handleChange} placeholder="Email" style={{ padding: 10, borderRadius: 8, border: '1px solid #eee' }} />
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Телефон" style={{ padding: 10, borderRadius: 8, border: '1px solid #eee' }} />
              <input name="position" value={form.position} onChange={handleChange} placeholder="Должность" style={{ padding: 10, borderRadius: 8, border: '1px solid #eee' }} />
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#eee', color: '#333', fontWeight: 600, cursor: 'pointer' }}>Отмена</button>
                <button type="submit" style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#750000', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Сохранить</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const Dashboard: React.FC = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user, setUser } = useUser();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        duration: 0.8,
        ease: 'easeInOut',
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: 'easeInOut',
      }
    }
  };

  return (
    <div className="dashboard-container">
      <motion.div 
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      >
        <div className="welcome-section">
          <h1>Добро пожаловать, {user?.name || 'Гость'}!</h1>
          <p className="subtitle">Ваш персональный кабинет</p>
        </div>
        <div className="header-actions">
          <motion.button 
            className="notification-btn"
            whileHover={{ scale: 1.05, transition: { duration: 0.35, ease: 'easeInOut' } }}
            whileTap={{ scale: 0.95, transition: { duration: 0.35, ease: 'easeInOut' } }}
          >
            <Bell size={24} />
          </motion.button>
        </div>
      </motion.div>

      <motion.div 
        className="dashboard-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="dashboard-card overview"
          variants={itemVariants}
          whileHover={{ 
            scale: 1.025, 
            y: -6, 
            boxShadow: '0 12px 32px rgba(139,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
            transition: { duration: 0.28, ease: 'easeInOut' }
          }}
        >
          <h2>Текущие льготы</h2>
          <div className="benefits-list">
            {(user?.benefits && user.benefits.length > 0) ? user.benefits.map((b, i) => (
              <div className="benefit-item" key={i}>
                <Gift size={20} />
                <span>{b}</span>
              </div>
            )) : (
              <div className="benefit-item"><Gift size={20} /><span>Нет льгот</span></div>
            )}
          </div>
        </motion.div>

        <motion.div 
          className="dashboard-card analytics"
          variants={itemVariants}
          whileHover={{ 
            scale: 1.025, 
            y: -6, 
            boxShadow: '0 12px 32px rgba(139,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
            transition: { duration: 0.28, ease: 'easeInOut' }
          }}
        >
          <h2>Аналитика использования</h2>
          <div className="chart-placeholder">
            <ChartBar size={40} />
            <p>График активности</p>
          </div>
        </motion.div>

        <motion.div 
          className="dashboard-card quick-actions"
          variants={itemVariants}
          whileHover={{ 
            scale: 1.025, 
            y: -6, 
            boxShadow: '0 12px 32px rgba(139,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
            transition: { duration: 0.28, ease: 'easeInOut' }
          }}
        >
          <h2>Быстрые действия</h2>
          <div className="actions-grid">
            <motion.button 
              className="action-btn"
              whileHover={{ scale: 1.05, transition: { duration: 0.35, ease: 'easeInOut' } }}
              whileTap={{ scale: 0.95, transition: { duration: 0.35, ease: 'easeInOut' } }}
            >
              <Gift size={24} />
              <span>Выбрать льготы</span>
            </motion.button>
            <motion.button 
              className="action-btn"
              whileHover={{ scale: 1.05, transition: { duration: 0.35, ease: 'easeInOut' } }}
              whileTap={{ scale: 0.95, transition: { duration: 0.35, ease: 'easeInOut' } }}
            >
              <MessageCircle size={24} />
              <span>Поддержка</span>
            </motion.button>
            <motion.button 
              className="action-btn"
              whileHover={{ scale: 1.05, transition: { duration: 0.35, ease: 'easeInOut' } }}
              whileTap={{ scale: 0.95, transition: { duration: 0.35, ease: 'easeInOut' } }}
              onClick={() => setShowProfileModal(true)}
            >
              <Settings size={24} />
              <span>Изменить профиль</span>
            </motion.button>
          </div>
        </motion.div>

        <motion.div 
          className="dashboard-card profile"
          variants={itemVariants}
          whileHover={{ 
            scale: 1.025, 
            y: -6, 
            boxShadow: '0 12px 32px rgba(139,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
            transition: { duration: 0.28, ease: 'easeInOut' }
          }}
        >
          <h2>Профиль</h2>
          <div className="profile-info">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <UserCircle size={60} />
            )}
            <div className="profile-details">
              <h3>{user?.name || 'Гость'}</h3>
              <p>{user?.email || ''}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        className="dashboard-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: 'easeInOut' }}
      >
        <p>Нужна помощь? Обратитесь в поддержку</p>
        <motion.button 
          className="support-btn"
          whileHover={{ scale: 1.05, transition: { duration: 0.35, ease: 'easeInOut' } }}
          whileTap={{ scale: 0.95, transition: { duration: 0.35, ease: 'easeInOut' } }}
        >
          Связаться с поддержкой
        </motion.button>
      </motion.div>
      <ProfileEditModal open={showProfileModal} onClose={() => setShowProfileModal(false)} user={user} setUser={setUser} />
    </div>
  );
};

export default Dashboard; 