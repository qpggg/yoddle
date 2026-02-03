import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box } from '@mui/material';
import { 
  Brain, 
  Zap, 
  Bell,
  Newspaper,
  Star,
  UserCircle,
  Gift
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
// Глобальная модалка теперь в App.tsx; локальную версию используем как InlineProfileEditModal
import NotificationBadge from '../components/NotificationBadge';
import { useNotifications } from '../hooks/useNotifications';
import WelcomeTour from '../components/WelcomeTour';
import QuickStartCard from '../components/QuickStartCard';
import DashboardTooltip from '../components/DashboardTooltip';

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

function InlineProfileEditModal({ open, onClose, user, setUser }: ProfileEditModalProps) {
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
              background: '#fff', borderRadius: 16, padding: 32, minWidth: 0, maxWidth: 340, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
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
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [tourWasClosed, setTourWasClosed] = useState(false);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [latestNews, setLatestNews] = useState<LatestNews | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [hasMoodEntries, setHasMoodEntries] = useState<boolean>(false);
  const [hasPreferencesTest, setHasPreferencesTest] = useState<boolean>(false);
  const [quickStartDataLoaded, setQuickStartDataLoaded] = useState<boolean>(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const { user, setUser, isLoading: userLoading, error: userError } = useUser();

  // Сразу при появлении user.id читаем localStorage, чтобы модалка «Поздравляем!» не появлялась снова после добавления льготы (до завершения loadProgress)
  useEffect(() => {
    if (!user?.id) return;
    const key = `yoddle_onboarding_completed_${user.id}`;
    if (typeof localStorage !== 'undefined' && localStorage.getItem(key) === '1') {
      setOnboardingCompleted(true);
    }
  }, [user?.id]);
  const { userBenefits, isLoading: benefitsLoading, error: benefitsError } = useUserBenefits();
  const { unreadCount } = useNotifications({ userId: user?.id });
  
  // Логирование уведомлений для отладки
  React.useEffect(() => {
    if (unreadCount > 0) {
      console.log(`📢 Непрочитанных уведомлений: ${unreadCount}`);
    }
  }, [unreadCount]);
  
  // Отслеживание изменений состояния для отладки
  React.useEffect(() => {
    console.log('[Dashboard] State changed:', {
      userProgress: userProgress ? `✅ (XP: ${userProgress.xp})` : '❌ null',
      quickStartDataLoaded,
      benefitsLoading,
      user_id: user?.id
    });
  }, [userProgress, quickStartDataLoaded, benefitsLoading, user?.id]);
  
  const navigate = useNavigate();

  // Проверка первого входа и показ приветственного тура
  useEffect(() => {
    if (!user?.id || userLoading) return;

    // Не показываем тур если уже закрыт в этой сессии или уже открыт
    if (tourWasClosed || showWelcomeTour) return;

    // Fallback при релогине: если тур уже был завершён в этом браузере — не показывать снова
    const storageKey = `yoddle_tour_completed_${user.id}`;
    if (typeof localStorage !== 'undefined' && localStorage.getItem(storageKey) === '1') {
      setTourWasClosed(true);
      return;
    }

    const tourCompleted = userProgress?.tour_completed;
    const isCompleted = tourCompleted === true ||
                       tourCompleted === 'true' ||
                       tourCompleted === 1 ||
                       tourCompleted === 't' ||
                       tourCompleted === 'T';

    if (isCompleted || tourCompleted === null || tourCompleted === undefined) {
      if (isCompleted) setTourWasClosed(true);
      return;
    }

    // Показываем тур только если tour_completed явно false или 'f' в БД
    if (userProgress && (tourCompleted === false || tourCompleted === 'f')) {
      const timer = setTimeout(() => setShowWelcomeTour(true), 500);
      return () => clearTimeout(timer);
    }
  }, [user?.id, userLoading, userProgress?.tour_completed, showWelcomeTour, tourWasClosed]);

  // Глобальный обработчик для открытия модалки "Изменить профиль" из других частей приложения
  useEffect(() => {
    const handler = () => setShowProfileModal(true);
    window.addEventListener('openProfileEditModal', handler as EventListener);
    return () => window.removeEventListener('openProfileEditModal', handler as EventListener);
  }, []);

  // Обработчик завершения тура
  const handleTourComplete = async () => {
    setTourWasClosed(true);
    setShowWelcomeTour(false);

    if (user?.id) {
      const storageKey = `yoddle_tour_completed_${user.id}`;
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(storageKey, '1');
      } catch (_) {}
      try {
        const response = await fetch('/api/progress', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            field: 'tour_completed',
            value: true
          }),
        });
        
        const data = await response.json();
        console.log('📊 API Response:', data);
        
        if (response.ok) {
          // Обновляем локальное состояние СРАЗУ
          if (userProgress) {
            setUserProgress({ ...userProgress, tour_completed: true });
          }
          // Перезагружаем прогресс из БД для гарантии синхронизации
          const refreshResponse = await fetch(`/api/progress?user_id=${user.id}`);
          const refreshData = await refreshResponse.json();
          if (refreshData.progress) {
            setUserProgress(refreshData.progress);
            console.log('✅ Progress refreshed from DB:', refreshData.progress.tour_completed);
          }
        } else {
          console.error('❌ API Error:', data);
        }
      } catch (error) {
        console.error('❌ Error updating tour completed:', error);
        // Ошибка не критична, тур уже закрыт и помечен как закрытый
      }
    }
  };

  // Загрузка прогресса пользователя
  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.id) {
        console.log('[Dashboard] No user.id, skipping progress load');
        return;
      }
      
      console.log('[Dashboard] Starting to load progress for user:', user.id);
      
      try {
        console.log('[Dashboard] Fetching from:', `/api/progress?user_id=${user.id}`);
        const response = await fetch(`/api/progress?user_id=${user.id}`);
        
        console.log('[Dashboard] Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Dashboard] Failed to fetch progress:', response.status, response.statusText, errorText);
          // Устанавливаем пустой прогресс чтобы не блокировать UI
          setUserProgress(null);
          return;
        }
        
        const data = await response.json();
        console.log('[Dashboard] Full API response:', data);
        
        const progress = data.progress;
        
        console.log('[Dashboard] Loaded progress from DB:', {
          progress: progress,
          hasProgress: !!progress,
          tour_completed: progress?.tour_completed,
          onboarding_completed: progress?.onboarding_completed,
          type_tour: typeof progress?.tour_completed,
          type_onboarding: typeof progress?.onboarding_completed,
          raw_tour: JSON.stringify(progress?.tour_completed),
          raw_onboarding: JSON.stringify(progress?.onboarding_completed)
        });
        
        if (!progress) {
          console.error('[Dashboard] No progress data received! Response data:', data);
          // Устанавливаем пустой прогресс
          setUserProgress(null);
          return;
        }
        
        setUserProgress(progress);
        console.log('[Dashboard] ✅ userProgress state updated successfully');

        // Приоритет: localStorage (уже закрыл «Понятно») → БД
        const storageKey = `yoddle_onboarding_completed_${user.id}`;
        const fromStorage = typeof localStorage !== 'undefined' && localStorage.getItem(storageKey) === '1';
        const onboardingCompleted = progress?.onboarding_completed;
        const isOnboardingDoneFromDb = onboardingCompleted === true ||
                                 onboardingCompleted === 'true' ||
                                 onboardingCompleted === 1 ||
                                 onboardingCompleted === 't' ||
                                 onboardingCompleted === 'T';
        const isOnboardingDone = fromStorage || isOnboardingDoneFromDb;
        console.log('[Dashboard] Onboarding check:', {
          value: onboardingCompleted,
          fromStorage,
          isDone: isOnboardingDone
        });
        setOnboardingCompleted(isOnboardingDone);
        
        // Если тур уже завершен в БД, помечаем что он был закрыт
        const tourCompleted = progress?.tour_completed;
        // Проверяем все возможные варианты true
        const isTourDone = tourCompleted === true || 
                          tourCompleted === 'true' || 
                          tourCompleted === 1 || 
                          tourCompleted === 't' ||
                          tourCompleted === 'T';
        console.log('[Dashboard] Tour check:', {
          value: tourCompleted,
          type: typeof tourCompleted,
          isDone: isTourDone
        });
        if (isTourDone) {
          console.log('[Dashboard] Tour is completed, setting tourWasClosed = true');
          setTourWasClosed(true);
          setShowWelcomeTour(false);
        } else {
          console.log('[Dashboard] Tour is NOT completed, setting tourWasClosed = false');
          // Если тур не завершен, сбрасываем флаг (на случай если пользователь сменился)
          setTourWasClosed(false);
        }
      } catch (error) {
        console.error('[Dashboard] Error loading progress:', error);
        setUserProgress(null); // Сбрасываем на null при ошибке
      }
    };

    loadProgress();
  }, [user?.id]);

  // Загрузка баланса и проверка настроения
  useEffect(() => {
    const loadQuickStartData = async () => {
      if (!user?.id) {
        console.log('[Dashboard] No user.id, skipping quick start data load');
        setQuickStartDataLoaded(false);
        return;
      }

      console.log('[Dashboard] Starting to load quick start data for user:', user.id);
      setQuickStartDataLoaded(false);
      try {
        // Загружаем баланс
        const balanceResponse = await fetch(`/api/wallet?user_id=${user.id}`);
        const balanceData = await balanceResponse.json();
        if (balanceData.success) {
          setUserBalance(balanceData.balance || 0);
        }

        // Проверяем наличие записей настроения
        const moodResponse = await fetch(`/api/productivity/mood-percentages/${user.id}`);
        const moodData = await moodResponse.json();
        if (moodData.success && moodData.dailyData && moodData.dailyData.length > 0) {
          setHasMoodEntries(true);
        } else {
          setHasMoodEntries(false);
        }

        // Проверяем прохождение теста предпочтений через проверку рекомендаций
        // Если есть сохраненные рекомендации, значит тест пройден
        try {
          const recommendationsResponse = await fetch(`/api/user-recommendations?user_id=${user.id}`);
          const recommendationsData = await recommendationsResponse.json();
          if (recommendationsData.recommendations && recommendationsData.recommendations.length > 0) {
            setHasPreferencesTest(true);
          } else {
            setHasPreferencesTest(false);
          }
        } catch (err) {
          console.error('Error checking preferences test:', err);
          setHasPreferencesTest(false);
        }

        // Проверяем завершение онбординга из БД (через userProgress)
        // Это будет обновлено после загрузки userProgress
      } catch (error) {
        console.error('[Dashboard] ❌ Error loading quick start data:', error);
        // В случае ошибки все равно помечаем как загруженное, чтобы не блокировать UI
      } finally {
        console.log('[Dashboard] ✅ Quick start data loaded, setting quickStartDataLoaded = true');
        setQuickStartDataLoaded(true);
      }
    };

    loadQuickStartData();
  }, [user?.id]);

  // Загрузка последней новости
  useEffect(() => {
    const loadLatestNews = async () => {
      setNewsLoading(true);
      try {
        const response = await fetch('/api/news/modal-data?limit=1');
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

      {/* Показываем загрузку если данные еще не готовы */}
      {(!userProgress || !quickStartDataLoaded || benefitsLoading) && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ fontSize: '24px' }}>🔄</div>
          <div>Загрузка данных дашборда...</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {!userProgress && 'Загрузка прогресса...'}
            {userProgress && !quickStartDataLoaded && 'Загрузка дополнительных данных...'}
            {userProgress && quickStartDataLoaded && benefitsLoading && 'Загрузка льгот...'}
          </div>
          {/* Показываем контент даже если benefitsLoading застрял, но только если есть userProgress */}
          {userProgress && quickStartDataLoaded && benefitsLoading && (
            <div style={{ marginTop: '20px', padding: '10px', background: '#fff3cd', borderRadius: '5px', fontSize: '12px' }}>
              ⚠️ Загрузка льгот занимает больше времени, чем ожидалось. Контент будет показан как только данные загрузятся.
            </div>
          )}
        </div>
      )}

      {/* Показываем контент если есть хотя бы userProgress и quickStartDataLoaded, даже если benefitsLoading еще идет */}
      {userProgress && quickStartDataLoaded && (
      <motion.div 
        className="dashboard-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key="dashboard-grid-loaded"
      >
        <motion.div variants={itemVariants} style={{ gridColumn: '1 / -1' }}>
          <QuickStartCard
            profileCompletion={userProgress.profile_completion || 0}
            hasMoodEntries={hasMoodEntries}
            hasBenefits={userBenefits.length > 0}
            balance={userBalance}
            hasPreferencesTest={hasPreferencesTest}
            onboardingCompleted={onboardingCompleted}
            userId={user?.id || null}
            onComplete={async () => {
              // Перезагружаем данные после завершения онбординга
              setOnboardingCompleted(true);
              // Перезагружаем прогресс из БД для синхронизации
              if (user?.id) {
                try {
                  const response = await fetch(`/api/progress?user_id=${user.id}`);
                  const data = await response.json();
                  if (data.progress) {
                    setUserProgress(data.progress);
                  }
                } catch (error) {
                  console.error('Error reloading progress:', error);
                }
              }
            }}
          />
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
          style={{ position: 'relative' }}
        >
          <DashboardTooltip
            title="Текущие льготы"
            content="Здесь отображаются льготы, которые вы выбрали из каталога. Вы можете добавить новые льготы, нажав кнопку 'Добавить', или управлять уже выбранными через кнопку 'Управление'. Каждая льгота расходует ваш баланс Yoddle-coins."
            position="top-right"
          />
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
              userBenefits.slice(0, 3).map((benefit, index) => (
                <div className="benefit-item" key={benefit.id}>
                  <Gift size={20} />
                  <span>
                    {index === 2 && userBenefits.length > 3
                      ? `${benefit.name} + ${userBenefits.length - 3}`
                      : benefit.name}
                  </span>
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
                  minWidth: 0,
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
                  minWidth: 0,
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
          style={{ position: 'relative' }}
        >
          <DashboardTooltip
            title="Аналитика использования"
            content="На этом графике отображается ваша активность на платформе за последние дни. Чем выше столбцы, тем больше действий вы совершили. Регулярная активность помогает вам получать больше XP и повышать уровень."
            position="top-right"
          />
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
          style={{
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            border: '2px solid #8B000020',
            borderRadius: '16px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'visible',
            cursor: 'pointer'
          }}
          onClick={(e) => {
            // Проверяем, не кликнули ли на тултип
            const target = e.target as HTMLElement;
            if (!target.closest('[data-tooltip-trigger]')) {
              navigate('/productivity');
            }
          }}
        >
          <div data-tooltip-trigger>
            <DashboardTooltip
              title="ИИ Продуктивность"
              content="Записывайте своё настроение и активность ежедневно. Искусственный интеллект анализирует ваши данные и даёт персональные рекомендации для улучшения самочувствия и продуктивности. Регулярные записи помогают получить более точные инсайты."
              position="top-right"
            />
          </div>
          {/* Декоративные элементы */}
          <div style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(139,0,0,0.05)',
            zIndex: 0
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, justifyContent: 'center' }}>
              <Box sx={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(139,0,0,0.3)'
              }}>
                <Brain size={24} color="#fff" />
              </Box>
              <h2 style={{ color: '#1A1A1A', margin: 0 }}>ИИ Продуктивность</h2>
            </Box>
            
            {/* Анимированная иконка AI */}
            <motion.div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 8px 24px rgba(139,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              animate={{
                boxShadow: [
                  '0 8px 24px rgba(139,0,0,0.3)',
                  '0 12px 32px rgba(139,0,0,0.4)',
                  '0 8px 24px rgba(139,0,0,0.3)'
                ],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              whileHover={{
                scale: 1.1,
                rotate: 0,
                transition: { duration: 0.3 }
              }}
            >
              <motion.div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)',
                  borderRadius: '20px'
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.7, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              
              {/* Пульсирующие частицы */}
              <motion.div
                style={{
                  position: 'absolute',
                  width: '6px',
                  height: '6px',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  borderRadius: '50%',
                  top: '20%',
                  left: '30%'
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 0.5
                }}
              />
              
              <motion.div
                style={{
                  position: 'absolute',
                  width: '4px',
                  height: '4px',
                  backgroundColor: 'rgba(255,255,255,0.6)',
                  borderRadius: '50%',
                  bottom: '25%',
                  right: '25%'
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 1
                }}
              />
              
              <motion.div
                animate={{
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'linear'
                }}
                style={{ position: 'relative', zIndex: 1 }}
              >
                <Zap size={40} color="#fff" />
              </motion.div>
            </motion.div>
            
            <p style={{ 
              color: '#666', 
              marginBottom: '1.5rem', 
              fontSize: '1rem',
              lineHeight: '1.4'
            }}>
              "Узнайте больше о своей продуктивности с помощью ИИ-аналитики!"
            </p>
            
            <motion.button
              style={{
                background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: 600,
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(139,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                margin: '0 auto'
              }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: '0 6px 20px rgba(139,0,0,0.4)'
              }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/productivity');
              }}
            >
              Начать анализ
              <Bell size={18} style={{ marginLeft: '4px' }} />
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
            overflow: 'visible',
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
          
          <DashboardTooltip
            title="Прогресс и рейтинг"
            content="Здесь отображается ваш текущий уровень, опыт (XP) и ранг. Заполнение профиля и активность на платформе помогают вам получать опыт и повышать уровень. Чем выше уровень, тем больше возможностей открывается. Ранги: Новичок, Активист, Профи, Эксперт, Мастер."
            position="top-right"
            iconColor="#FFFFFF"
            iconBgColor="rgba(255, 255, 255, 0.25)"
          />
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
            minHeight: '280px',
            position: 'relative'
          }}
        >
          <DashboardTooltip
            title="Новости и обновления"
            content="Здесь публикуются последние новости о платформе Yoddle, новых льготах, обновлениях функций и важных объявлениях. Регулярно проверяйте эту секцию, чтобы быть в курсе всех изменений и возможностей. Новости разделены по категориям: Продукт, Интеграция, Геймификация, Партнерства, Анонс, Компания."
            position="top-right"
          />
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
            minHeight: '280px',
            position: 'relative'
          }}
        >
          <DashboardTooltip
            title="Отзывы о компании"
            content="Здесь вы можете оставить отзыв о вашей компании и работе в ней. Ваши отзывы помогают HR-отделу улучшать корпоративную культуру и условия работы. Вы можете поделиться своим опытом, предложить улучшения или выразить благодарность коллегам."
            position="top-right"
          />
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
      )}

      {userProgress && quickStartDataLoaded && (
      <motion.div 
        className="dashboard-footer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
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
      )}
      <InlineProfileEditModal open={showProfileModal} onClose={() => setShowProfileModal(false)} user={user} setUser={setUser} />
      <NewsModal open={showNewsModal} onClose={() => setShowNewsModal(false)} />
      <FeedbackModal open={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} userId={user?.id || null} />
      <SupportModal open={showSupportModal} onClose={() => setShowSupportModal(false)} />
      <NotificationCenter 
        open={showNotificationCenter} 
        onClose={() => setShowNotificationCenter(false)} 
        userId={user?.id || null} 
      />
      <WelcomeTour 
        open={showWelcomeTour} 
        onClose={() => {
          // При закрытии через крестик тоже помечаем как закрытый
          setTourWasClosed(true);
          setShowWelcomeTour(false);
          handleTourComplete();
        }}
        onComplete={handleTourComplete}
      />
    </div>
  );
};

export default Dashboard; 