import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { useUserBenefits } from '../hooks/useUserBenefits';
import { motion } from 'framer-motion';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaGift, 
  FaSignOutAlt,
  FaEdit,
  FaHeart,
  FaHeartbeat, 
  FaFutbol, 
  FaGraduationCap, 
  FaBook, 
  FaLeaf, 
  FaUsers, 
  FaHandHoldingHeart
} from 'react-icons/fa';
import { GiBrain } from "react-icons/gi";

// Иконки для категорий льгот
const categoryIcons: { [key: string]: React.ReactElement } = {
  'Здоровье': <FaHeartbeat size={20} style={{ color: '#8B0000' }} />,
  'Спорт': <FaFutbol size={20} style={{ color: '#8B0000' }} />,
  'Обучение': <FaGraduationCap size={20} style={{ color: '#8B0000' }} />,
  'Психология': <GiBrain size={20} style={{ color: '#8B0000' }} />,
  'Социальная поддержка': <FaHandHoldingHeart size={20} style={{ color: '#8B0000' }} />,
  'Отдых': <FaLeaf size={20} style={{ color: '#8B0000' }} />,
  'Транспорт': <FaUsers size={20} style={{ color: '#8B0000' }} />,
  'Default': <FaBook size={20} style={{ color: '#8B0000' }} />
};

// Типы
interface UserProgress {
  xp: number;
  level: number;
  login_streak: number;
}

const Profile: React.FC = () => {
  const { user, logout } = useUser();
  const { userBenefits, isLoading: benefitsLoading } = useUserBenefits();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEditProfile = () => {
    navigate('/dashboard');
  };

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <FaUser size={64} style={{ color: '#8B0000', marginBottom: '1rem' }} />
          <h2 style={{ color: '#666', marginBottom: '0.5rem' }}>Нет данных пользователя</h2>
          <p style={{ color: '#999' }}>Пожалуйста, войдите в систему</p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        duration: 0.8,
        ease: 'easeInOut',
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem 0'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        
        {/* Современный заголовок */}
        <motion.div
          className="page-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            textAlign: 'center',
            marginBottom: '3rem',
            padding: '3rem 2rem',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #8B0000, #B22222)',
            borderRadius: '20px',
            marginBottom: '1.5rem',
            boxShadow: '0 10px 30px rgba(139, 0, 0, 0.3)'
          }}>
            <FaHeart size={32} style={{ color: 'white' }} />
          </div>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #8B0000, #B22222)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
            fontFamily: 'Inter, sans-serif'
          }}>
            Мой профиль
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#666',
            margin: 0,
            fontWeight: 500
          }}>
            Персональная информация и настройки аккаунта
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Основная карточка профиля */}
          <motion.div
            variants={itemVariants}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '24px',
              padding: '3rem',
              marginBottom: '2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(139, 0, 0, 0.1)'
            }}
          >
            {/* Заголовок профиля с аватаром */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              marginBottom: '2.5rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ position: 'relative' }}>
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid #8B0000',
                      boxShadow: '0 8px 24px rgba(139, 0, 0, 0.2)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8B0000, #B22222)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    boxShadow: '0 8px 24px rgba(139, 0, 0, 0.2)'
                  }}>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
              
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: '#8B0000',
                  margin: '0 0 0.5rem 0',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {user.name}
                </h2>
                <p style={{
                  fontSize: '1.2rem',
                  color: '#666',
                  margin: '0 0 1rem 0',
                  fontWeight: 500
                }}>
                  {user.position || 'Сотрудник'}
                </p>
                
                {userProgress && (
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #8B0000, #B22222)',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}>
                      Уровень {userProgress.level}
                    </div>
                    <div style={{
                      background: 'rgba(139, 0, 0, 0.1)',
                      color: '#8B0000',
                      padding: '0.5rem 1rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}>
                      {userProgress.xp} XP
                    </div>
                    <div style={{
                      background: 'rgba(139, 0, 0, 0.1)',
                      color: '#8B0000',
                      padding: '0.5rem 1rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}>
                      {userProgress.login_streak} дней подряд
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEditProfile}
                  style={{
                    background: 'linear-gradient(135deg, #8B0000, #B22222)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(139, 0, 0, 0.3)'
                  }}
                >
                  <FaEdit size={16} />
                  Редактировать
                </motion.button>
              </div>
            </div>

            {/* Информация профиля */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              <div style={{
                background: 'rgba(139, 0, 0, 0.05)',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '2px solid rgba(139, 0, 0, 0.1)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
                  <FaEnvelope size={20} style={{ color: '#8B0000' }} />
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Email
                  </span>
                </div>
                <p style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#333',
                  margin: 0
                }}>
                  {user.email}
                </p>
              </div>

              {user.phone && (
                <div style={{
                  background: 'rgba(139, 0, 0, 0.05)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '2px solid rgba(139, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem'
                  }}>
                    <FaPhone size={20} style={{ color: '#8B0000' }} />
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#666',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Телефон
                    </span>
                  </div>
                  <p style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#333',
                    margin: 0
                  }}>
                    {user.phone}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Блок льгот */}
          <motion.div
            variants={itemVariants}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '24px',
              padding: '2.5rem',
              marginBottom: '2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(139, 0, 0, 0.1)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #8B0000, #B22222)',
                borderRadius: '12px',
                color: 'white'
              }}>
                <FaGift size={24} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  color: '#1A1A1A',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Мои льготы
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#666',
                  margin: 0
                }}>
                  {benefitsLoading ? 'Загрузка...' : `Доступно ${userBenefits.length} льгот`}
                </p>
              </div>
            </div>

            {benefitsLoading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '2rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid rgba(139, 0, 0, 0.1)',
                  borderTop: '4px solid #8B0000',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            ) : userBenefits.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem'
              }}>
                {userBenefits.map((benefit) => (
                  <div
                    key={benefit.id}
                    style={{
                      background: 'rgba(139, 0, 0, 0.05)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      border: '2px solid rgba(139, 0, 0, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      {categoryIcons[benefit.category] || categoryIcons['Default']}
                      <h4 style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#1A1A1A',
                        margin: 0
                      }}>
                        {benefit.name}
                      </h4>
                    </div>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#666',
                      margin: '0 0 0.75rem 0',
                      lineHeight: 1.5
                    }}>
                      {benefit.description}
                    </p>
                    {benefit.category && (
                      <div style={{
                        display: 'inline-block',
                        background: 'rgba(139, 0, 0, 0.1)',
                        color: '#8B0000',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        {benefit.category}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#666'
              }}>
                <FaGift size={48} style={{ color: '#ddd', marginBottom: '1rem' }} />
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Нет льгот</h4>
                <p style={{ margin: 0 }}>
                  Перейдите на страницу "Мои льготы" чтобы добавить льготы
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/my-benefits')}
                  style={{
                    background: 'linear-gradient(135deg, #8B0000, #B22222)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '1rem',
                    boxShadow: '0 4px 12px rgba(139, 0, 0, 0.3)'
                  }}
                >
                  Выбрать льготы
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Кнопка выхода */}
          <motion.div
            variants={itemVariants}
            style={{ textAlign: 'center' }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              style={{
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                margin: '0 auto',
                boxShadow: '0 8px 24px rgba(220, 38, 38, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              <FaSignOutAlt size={20} />
              Выйти из системы
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* CSS анимация */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Profile; 