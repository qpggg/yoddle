import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCircle, 
  Gift, 
  ChartBar, 
  Settings, 
  MessageCircle,
  Bell,
  PlusCircle
} from 'lucide-react';
import '../styles/Dashboard.css';
import { useUser, User } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';

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
      if (user) {
        setForm({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          position: user.position || '',
          photo: user.avatar || ''
        });
        setPhotoPreview(user.avatar || '');
      } else {
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
    }
  }, [open, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(f => ({ ...f, photo: reader.result as string }));
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      id: user?.id || '',
      name: form.name,
      email: form.email,
      phone: form.phone,
      position: form.position,
      avatar: typeof form.photo === 'string' ? form.photo : null
    };
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser(updated.user);
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

const MAX_BENEFITS = 2;

interface Benefit {
  id: number;
  name: string;
}

const Dashboard: React.FC = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user, setUser } = useUser();
  const [userBenefits, setUserBenefits] = useState<Benefit[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/user-benefits?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => setUserBenefits(data.benefits || []));
    }
  }, [user]);

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
            {userBenefits.length > 0 ? userBenefits.map((b) => (
              <div className="benefit-item" key={b.id}>
                <Gift size={20} />
                <span>{b.name}</span>
              </div>
            )) : (
              <div className="benefit-item"><Gift size={20} /><span>Нет льгот</span></div>
            )}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '24px', textAlign: 'center' }}>
            {userBenefits.length < MAX_BENEFITS && (
                <button
                onClick={() => navigate('/my-benefits')}
                style={{
                    background: '#750000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 24px',
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(139,0,0,0.08)',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                }}
                >
                <PlusCircle size={20} style={{ marginRight: 8 }} />
                Добавить
                </button>
            )}
          </div>
        </motion.div>

        <motion.div className="dashboard-card" variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.3 }}}>
          <h2>Статистика</h2>
          <ChartBar size={32} />
          <p>Аналитика использования</p>
        </motion.div>
        
        <motion.div className="dashboard-card" variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.3 }}} onClick={() => setShowProfileModal(true)}>
          <h2>Профиль</h2>
          <UserCircle size={32} />
          <p>Настройки аккаунта</p>
        </motion.div>
        
        <motion.div className="dashboard-card" variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.3 }}}>
          <h2>Поддержка</h2>
          <MessageCircle size={32} />
          <p>Связаться с нами</p>
        </motion.div>
        
        <motion.div className="dashboard-card" variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.3 }}}>
          <h2>Настройки</h2>
          <Settings size={32} />
          <p>Управление</p>
        </motion.div>
      </motion.div>
      
      <ProfileEditModal open={showProfileModal} onClose={() => setShowProfileModal(false)} user={user} setUser={setUser} />
    </div>
  );
};

export default Dashboard; 