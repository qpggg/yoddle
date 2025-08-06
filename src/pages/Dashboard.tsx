import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCircle, 
  Gift, 
  Settings, 
  MessageCircle,
  Bell,
  Newspaper,
  Star
} from 'lucide-react';
import { FaRocket, FaBolt, FaStar, FaCrown } from 'react-icons/fa';
import { GiCrystalShine } from 'react-icons/gi';
import '../styles/Dashboard.css';
import { useUser, User } from '../hooks/useUser';
import { useUserBenefits } from '../hooks/useUserBenefits';
import { useNavigate } from 'react-router-dom';
import { useActivity } from '../hooks/useActivity';
import ActivityChart from '../components/ActivityChart';
import NewsModal from '../components/NewsModal';
import FeedbackModal from '../components/FeedbackModal';
import SupportModal from '../components/SupportModal';
import NotificationCenter from '../components/NotificationCenter';
import NotificationBadge from '../components/NotificationBadge';
import { useNotifications } from '../hooks/useNotifications';
import BalanceDisplay from '../components/BalanceDisplay';

// Константа с рангами (такая же как в Progress.tsx)
const RANKS = [
  { name: 'Новичок', minXP: 0, maxXP: 100, icon: <FaRocket /> },
  { name: 'Активист', minXP: 101, maxXP: 300, icon: <FaBolt /> },
  { name: 'Профи', minXP: 301, maxXP: 500, icon: <FaStar /> },
  { name: 'Эксперт', minXP: 501, maxXP: 1000, icon: <FaCrown /> },
  { name: 'Мастер', minXP: 1001, maxXP: Infinity, icon: <GiCrystalShine /> }
];

// Функция для определения ранга по XP
const getRankByXP = (xp: number) => {
  return RANKS.find(rank => xp >= rank.minXP && xp <= rank.maxXP) || RANKS[0];
};

interface LatestNews {
  id: number;
  title: string;
  category: string;
  excerpt?: string;
}

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

function ProfileEditModal({ open, onClose, user, setUser }: ProfileEditModalProps) {
  const { logProfileUpdate } = useActivity();
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
      
      // 📊 РАСЧЕТ ПРОЦЕНТА ЗАПОЛНЕНИЯ ПРОФИЛЯ
      const profile = updated.user;
      let completionPercent = 0;
      
      // Проверяем заполненность полей (по 20% за каждое)
      if (profile.name && profile.name.trim()) completionPercent += 20;
      if (profile.email && profile.email.trim()) completionPercent += 20;
      if (profile.phone && profile.phone.trim()) completionPercent += 20;
      if (profile.position && profile.position.trim()) completionPercent += 20;
      if (profile.avatar) completionPercent += 20;
      
      console.log(`📊 Процент заполнения профиля: ${completionPercent}%`);
      
      // Обновляем процент в базе данных
      try {
        await fetch('/api/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: Number(profile.id),
            field: 'profile_completion',
            value: completionPercent
          })
        });
        console.log('✅ Profile completion обновлен в БД');
      } catch (updateError) {
        console.error('❌ Ошибка обновления profile_completion:', updateError);
      }
      
      // 🎉 АВТОЛОГИРОВАНИЕ ОБНОВЛЕНИЯ ПРОФИЛЯ
      await logProfileUpdate(`Профиль обновлен: ${form.name}, ${form.position} (${completionPercent}% заполнения)`);
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
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [latestNews, setLatestNews] = useState<LatestNews | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const { user, setUser, isLoading: userLoading, error: userError } = useUser();
  const { userBenefits, isLoading: benefitsLoading, error: benefitsError } = useUserBenefits();
  const { unreadCount } = useNotifications({ userId: user?.id });
  
  // Логирование уведомлений для отладки
  React.useEffect(() => {
    if (unreadCount > 0) {
      console.log(`📢 Непрочитанных уведомлений: ${unreadCount}`);
    }
  }, [unreadCount]);
  const navigate = useNavigate();

  // Загрузка прогресса пользователя
  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`/api/progress?user_id=${user.id}`);
        const data = await response.json();
        setUserProgress(data.progress);
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };

    loadProgress();
  }, [user?.id]);

  // Загрузка последней новости
  useEffect(() => {
    const loadLatestNews = async () => {
      setNewsLoading(true);
      try {
        const response = await fetch('/api/news?action=modal-data&limit=1');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          const news = data.data[0];
          setLatestNews({
            id: news.id,
            title: news.title,
            category: news.category,
            excerpt: news.content ? news.content.slice(0, 100) + '...' : undefined
          });
        }
      } catch (error) {
        console.error('Error loading latest news:', error);
      } finally {
        setNewsLoading(false);
      }
    };

    loadLatestNews();
  }, []);

  // Функция для получения цвета категории
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Продукт': '#750000',
      'Интеграция': '#2E8B57',
      'Геймификация': '#FF6347',
      'Партнерства': '#4682B4',
      'Анонс': '#9370DB',
      'Компания': '#32CD32'
    };
    return colors[category] || '#750000';
  };

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

  // Показываем loading пока загружается пользователь
  if (userLoading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔄</div>
          <div>Загрузка данных пользователя...</div>
        </div>
      </div>
    );
  }

  // Показываем ошибку если не удалось загрузить пользователя
  if (userError && !user) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#e74c3c' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>❌</div>
          <div>Ошибка загрузки: {userError}</div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '16px', 
              padding: '8px 16px', 
              background: '#750000', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

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
          <NotificationBadge userId={user?.id}>
            <motion.button 
              className="notification-btn"
              whileHover={{ scale: 1.05, transition: { duration: 0.35, ease: 'easeInOut' } }}
              whileTap={{ scale: 0.95, transition: { duration: 0.35, ease: 'easeInOut' } }}
              onClick={() => setShowNotificationCenter(true)}
            >
              <Bell size={24} />
            </motion.button>
          </NotificationBadge>
        </div>
      </motion.div>

      <motion.div 
        className="dashboard-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Баланс Yoddle-коинов */}
        <motion.div 
          className="dashboard-card"
          variants={itemVariants}
          whileHover={{ 
            scale: 1.025, 
            y: -6, 
            boxShadow: '0 12px 32px rgba(139,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
            transition: { duration: 0.28, ease: 'easeInOut' }
          }}
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/wallet')}
        >
          {user && (
            <BalanceDisplay 
              userId={Number(user.id)} 
              variant="dashboard" 
              onClick={() => navigate('/wallet')}
            />
          )}
        </motion.div>

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
            {benefitsLoading ? (
              <div className="benefit-item">
                <Gift size={20} />
                <span>Загрузка...</span>
              </div>
            ) : benefitsError ? (
              <div className="benefit-item" style={{ color: '#e74c3c' }}>
                <Gift size={20} />
                <span>Ошибка: {benefitsError}</span>
              </div>
            ) : userBenefits.length > 0 ? (
              userBenefits.map((benefit) => (
                <div className="benefit-item" key={benefit.id}>
                  <Gift size={20} />
                  <span>{benefit.name}</span>
                </div>
              ))
            ) : (
              <div className="benefit-item">
                <Gift size={20} />
                <span>Нет льгот</span>
              </div>
            )}
          </div>
          {/* Показываем кнопку "Добавить" только если льгот меньше 2 */}
          {!benefitsLoading && userBenefits.length < 2 && (
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <button
                style={{
                  background: '#750000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: 12,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(139,0,0,0.08)',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 50,
                  minWidth: 320,
                  width: '100%',
                  maxWidth: 340
                }}
                onClick={() => navigate('/my-benefits')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#600000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#750000';
                }}
              >
                <Gift size={20} color="#fff" style={{ marginRight: 8 }} />
                Добавить
              </button>
            </div>
          )}
          {/* Если льгот уже 2, показываем кнопку "Управление" */}
          {!benefitsLoading && userBenefits.length >= 2 && (
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <button
                style={{
                  background: '#750000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: 12,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(139,0,0,0.08)',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 50,
                  minWidth: 320,
                  width: '100%',
                  maxWidth: 340
                }}
                onClick={() => navigate('/my-benefits')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#600000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#750000';
                }}
              >
                <Gift size={20} color="#fff" style={{ marginRight: 8 }} />
                Управление
              </button>
            </div>
          )}
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
          <ActivityChart />
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
              onClick={() => navigate('/profile')}
            >
              <UserCircle size={24} />
              <span>Профиль</span>
            </motion.button>
            <NotificationBadge userId={user?.id}>
              <motion.button 
                className="action-btn"
                whileHover={{ scale: 1.05, transition: { duration: 0.35, ease: 'easeInOut' } }}
                whileTap={{ scale: 0.95, transition: { duration: 0.35, ease: 'easeInOut' } }}
                onClick={() => setShowNotificationCenter(true)}
              >
                <Bell size={24} />
                <span>Уведомления</span>
              </motion.button>
            </NotificationBadge>
            <motion.button 
              className="action-btn"
              whileHover={{ scale: 1.05, transition: { duration: 0.35, ease: 'easeInOut' } }}
              whileTap={{ scale: 0.95, transition: { duration: 0.35, ease: 'easeInOut' } }}
              onClick={() => setShowSupportModal(true)}
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
          style={{
            background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
            color: 'white',
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden',
            border: 'none'
          }}
        >
          {/* Декоративные элементы */}
          <div style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            zIndex: 0
          }} />
          <div style={{
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
            zIndex: 0
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700 }}>Прогресс</h2>
                          <div className="profile-info" style={{ flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                {/* Иконка ранга вместо аватара */}
                <div style={{ 
                  background: 'rgba(255,255,255,0.15)', 
                  borderRadius: '16px', 
                  padding: '0.8rem',
                  fontSize: '2rem',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  marginBottom: '0.5rem'
                }}>
                  {userProgress ? getRankByXP(userProgress.xp).icon : <FaRocket />}
                </div>
              
                              <div className="profile-details" style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: '1rem', 
                    marginBottom: '0.25rem',
                    color: 'white'
                  }}>
                    Ваш рейтинг: {userProgress ? getRankByXP(userProgress.xp).name : 'Загрузка...'}
                  </div>
                  <div style={{ 
                    fontWeight: 400, 
                    fontSize: '0.9rem', 
                    marginBottom: '0.5rem',
                    opacity: 0.9
                  }}>
                    {userProgress ? `(${userProgress.xp}/${getRankByXP(userProgress.xp).maxXP === Infinity ? '∞' : getRankByXP(userProgress.xp).maxXP} XP)` : '(Загрузка...)'}
                  </div>
                  <div style={{ 
                    fontWeight: 500, 
                    fontSize: '0.85rem', 
                    marginBottom: '0.75rem',
                    opacity: 0.8
                  }}>
                    {userProgress ? (
                      getRankByXP(userProgress.xp).maxXP === Infinity 
                        ? '🎉 Максимальный ранг!' 
                        : `${getRankByXP(userProgress.xp).maxXP - userProgress.xp} XP до следующего уровня`
                    ) : ''}
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    borderRadius: '12px', 
                    height: '8px', 
                    marginBottom: '1rem', 
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      background: 'white', 
                      height: '100%', 
                      width: userProgress ? `${Math.min(
getRankByXP(userProgress.xp).maxXP === Infinity ? 100 : ((userProgress.xp - getRankByXP(userProgress.xp).minXP) / (getRankByXP(userProgress.xp).maxXP - getRankByXP(userProgress.xp).minXP)) * 100
                      , 100)}%` : '0%', 
                      borderRadius: '12px',
                      boxShadow: '0 1px 4px rgba(255,255,255,0.3)'
                    }} />
                  </div>
                  
                  <button
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '10px',
                      padding: '10px 20px',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={() => navigate('/progress')}
                  >
                    Подробнее
                  </button>
                </div>
            </div>
          </div>
        </motion.div>

        {/* Новости */}
        <motion.div 
          className="dashboard-card news"
          variants={itemVariants}
          whileHover={{ 
            scale: 1.025, 
            y: -6, 
            boxShadow: '0 12px 32px rgba(139,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
            transition: { duration: 0.28, ease: 'easeInOut' }
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: '280px'
          }}
        >
          <h2>Новости</h2>
          
          {newsLoading ? (
            <div style={{ color: '#666', fontSize: 16, marginTop: 16, marginBottom: 16, flex: 1, display: 'flex', alignItems: 'center' }}>
              Загрузка последних новостей...
            </div>
          ) : latestNews ? (
            <div style={{ marginTop: 16, marginBottom: 16, flex: 1, display: 'flex', alignItems: 'flex-start' }}>
                            {/* Современный контейнер новости */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                  borderRadius: '12px',
                  border: '1px solid #e8e8e8',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  width: '100%'
                }}>
                {/* Декоративный элемент */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  background: getCategoryColor(latestNews.category),
                  borderRadius: '0 2px 2px 0'
                }} />
                
                {/* Категория-бейджик */}
                <div style={{
                  display: 'inline-block',
                  background: getCategoryColor(latestNews.category),
                  color: 'white',
                  padding: '6px 14px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  alignSelf: 'flex-start',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: `0 2px 6px ${getCategoryColor(latestNews.category)}33`
                }}>
                  {latestNews.category}
                </div>
                
                {/* Заголовок новости */}
                <div style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#2c2c2c',
                  lineHeight: '1.3',
                  marginLeft: '4px'
                }}>
                  {latestNews.title}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#666', fontSize: 16, marginTop: 16, marginBottom: 16, flex: 1, display: 'flex', alignItems: 'center' }}>
              Следите за нашими изменениями!
            </div>
          )}
          
          <motion.button
            onClick={() => setShowNewsModal(true)}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.95, transition: { duration: 0.2 } }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              padding: '14px',
              background: '#750000',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(117,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#600000';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(117,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#750000';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(117,0,0,0.2)';
            }}
          >
            <Newspaper size={20} />
            Читать новости
          </motion.button>
        </motion.div>

        {/* Отзывы */}
        <motion.div 
          className="dashboard-card feedback"
          variants={itemVariants}
          whileHover={{ 
            scale: 1.025, 
            y: -6, 
            boxShadow: '0 12px 32px rgba(139,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
            transition: { duration: 0.28, ease: 'easeInOut' }
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: '280px'
          }}
        >
          <h2>Отзывы</h2>
          
          <div style={{ marginTop: 16, marginBottom: 16, flex: 1, display: 'flex', alignItems: 'flex-start' }}>
            {/* Современный контейнер отзывов */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              padding: '16px',
              background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
              borderRadius: '12px',
              border: '1px solid #e8e8e8',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              width: '100%'
            }}>
              {/* Декоративный элемент */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                background: '#FFA500',
                borderRadius: '0 2px 2px 0'
              }} />
              
              {/* Иконка и статус */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginLeft: '4px'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '2px'
                }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      color="#FFA500"
                      fill="#FFA500"
                    />
                  ))}
                </div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  ОТЗЫВЫ СОТРУДНИКОВ
                </span>
              </div>
              
              {/* Заголовок */}
              <div style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#2c2c2c',
                lineHeight: '1.3',
                marginLeft: '4px'
              }}>
                Поделитесь мнением о работе в своей компании
              </div>
            </div>
          </div>
          
          <motion.button
            onClick={() => setShowFeedbackModal(true)}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.95, transition: { duration: 0.2 } }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              padding: '14px',
              background: '#750000',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(117,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#600000';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(117,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#750000';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(117,0,0,0.2)';
            }}
          >
            <Star size={20} />
            Открыть отзывы
          </motion.button>
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
          onClick={() => setShowSupportModal(true)}
          whileHover={{ scale: 1.05, transition: { duration: 0.35, ease: 'easeInOut' } }}
          whileTap={{ scale: 0.95, transition: { duration: 0.35, ease: 'easeInOut' } }}
        >
          Связаться с поддержкой
        </motion.button>
      </motion.div>
      <ProfileEditModal open={showProfileModal} onClose={() => setShowProfileModal(false)} user={user} setUser={setUser} />
      <NewsModal open={showNewsModal} onClose={() => setShowNewsModal(false)} />
      <FeedbackModal open={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} userId={user?.id || null} />
      <SupportModal open={showSupportModal} onClose={() => setShowSupportModal(false)} />
      <NotificationCenter 
        open={showNotificationCenter} 
        onClose={() => setShowNotificationCenter(false)} 
        userId={user?.id || null} 
      />
    </div>
  );
};

export default Dashboard; 