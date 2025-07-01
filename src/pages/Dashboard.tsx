import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCircle, 
  Gift, 
  Settings, 
  MessageCircle,
  Bell,
  Newspaper
} from 'lucide-react';
import { FaRocket } from 'react-icons/fa';
import '../styles/Dashboard.css';
import { useUser, User } from '../hooks/useUser';
import { useUserBenefits } from '../hooks/useUserBenefits';
import { useNavigate } from 'react-router-dom';
import { useActivity } from '../hooks/useActivity';
import ActivityChart from '../components/ActivityChart';
import NewsModal from '../components/NewsModal';

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
      
      // 🎉 АВТОЛОГИРОВАНИЕ ОБНОВЛЕНИЯ ПРОФИЛЯ
      await logProfileUpdate(`Профиль обновлен: ${form.name}, ${form.position}`);
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
  const [userProgress, setUserProgress] = useState<any>(null);
  const [latestNews, setLatestNews] = useState<LatestNews | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const { user, setUser } = useUser();
  const { userBenefits, isLoading: benefitsLoading } = useUserBenefits();
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
            {benefitsLoading ? (
              <div className="benefit-item">
                <Gift size={20} />
                <span>Загрузка...</span>
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
                  <FaRocket />
                </div>
              
                              <div className="profile-details" style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: '1rem', 
                    marginBottom: '0.25rem',
                    color: 'white'
                  }}>
                    Ваш рейтинг: {userProgress ? (
                      userProgress.xp >= 1001 ? 'Легенда' :
                      userProgress.xp >= 501 ? 'Мастер' :
                      userProgress.xp >= 301 ? 'Эксперт' :
                      userProgress.xp >= 101 ? 'Активный' : 'Новичок'
                    ) : 'Загрузка...'}
                  </div>
                  <div style={{ 
                    fontWeight: 400, 
                    fontSize: '0.9rem', 
                    marginBottom: '0.75rem',
                    opacity: 0.9
                  }}>
                    {userProgress ? `(${userProgress.xp}/${
                      userProgress.xp >= 1001 ? '∞' :
                      userProgress.xp >= 501 ? '1001' :
                      userProgress.xp >= 301 ? '501' :
                      userProgress.xp >= 101 ? '301' : '101'
                    } XP)` : '(Загрузка...)'}
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
                        userProgress.xp >= 1001 ? 100 :
                        userProgress.xp >= 501 ? ((userProgress.xp - 501) / 500) * 100 :
                        userProgress.xp >= 301 ? ((userProgress.xp - 301) / 200) * 100 :
                        userProgress.xp >= 101 ? ((userProgress.xp - 101) / 200) * 100 :
                        (userProgress.xp / 101) * 100
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
        >
          <h2>Новости</h2>
          
          {newsLoading ? (
            <div style={{ color: '#666', fontSize: 16, marginTop: 16, marginBottom: 24 }}>
              Загрузка последних новостей...
            </div>
          ) : latestNews ? (
            <div style={{ marginTop: 16, marginBottom: 24 }}>
              {/* Контейнер с обводкой (как у льгот) */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '12px',
                background: '#f8f8f8',
                borderRadius: '8px',
                marginBottom: '12px'
              }}>
                {/* Категория-бейджик */}
                <div style={{
                  display: 'inline-block',
                  background: getCategoryColor(latestNews.category),
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  alignSelf: 'flex-start'
                }}>
                  {latestNews.category}
                </div>
                
                {/* Заголовок новости */}
                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#333',
                  lineHeight: '1.4'
                }}>
                  {latestNews.title}
                </div>
              </div>
              
              {/* Подзаголовок */}
              <div style={{ color: '#666', fontSize: 14 }}>
                Последняя новость • Нажмите для просмотра всех
              </div>
            </div>
          ) : (
            <div style={{ color: '#666', fontSize: 16, marginTop: 16, marginBottom: 24 }}>
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
        >
          <h2>Отзывы</h2>
          <div style={{ color: '#666', fontSize: 18, marginTop: 16 }}>
            Нам важно ваше мнение!
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
      <NewsModal open={showNewsModal} onClose={() => setShowNewsModal(false)} />
    </div>
  );
};

export default Dashboard; 