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
  FaHandHoldingHeart,
  FaTrophy,
  FaCalendarAlt,
  FaChartLine
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
      background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
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
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            marginBottom: '1.5rem',
            boxShadow: '0 15px 35px rgba(102, 126, 234, 0.4)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
              borderRadius: '20px'
            }} />
            <FaHeart size={32} style={{ color: 'white', position: 'relative', zIndex: 1 }} />
          </div>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            color: '#6B7280',
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
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
              borderRadius: '24px',
              padding: '3rem',
              marginBottom: '2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Декоративный элемент */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '200px',
              height: '200px',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              borderRadius: '50%',
              transform: 'translate(50%, -50%)',
              zIndex: 0
            }} />
            
            {/* Заголовок профиля с аватаром */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              marginBottom: '2.5rem',
              flexWrap: 'wrap',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{ position: 'relative' }}>
                {user.avatar ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={user.avatar}
                      alt={user.name}
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '4px solid rgba(102, 126, 234, 0.3)',
                        boxShadow: '0 15px 35px rgba(102, 126, 234, 0.3)'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: '-4px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '50%',
                      zIndex: -1,
                      padding: '4px'
                    }} />
                  </div>
                ) : (
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    boxShadow: '0 15px 35px rgba(102, 126, 234, 0.4)',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                      borderRadius: '50%'
                    }} />
                    <span style={{ position: 'relative', zIndex: 1 }}>
                      {user.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Статус онлайн */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  width: '24px',
                  height: '24px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  borderRadius: '50%',
                  border: '3px solid white',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                }} />
              </div>
              
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '0 0 0.5rem 0',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {user.name}
                </h2>
                <p style={{
                  fontSize: '1.2rem',
                  color: '#6B7280',
                  margin: '0 0 1rem 0',
                  fontWeight: 500
                }}>
                  {user.position || 'CEO'}
                </p>
                
                {/* Статистика профиля */}
                <div style={{
                  display: 'flex',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                  marginTop: '1rem'
                }}>
                  {userProgress && (
                    <>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        borderRadius: '12px',
                        border: '1px solid rgba(102, 126, 234, 0.2)'
                      }}>
                        <FaTrophy style={{ color: '#F59E0B' }} />
                        <span style={{ color: '#374151', fontWeight: 600 }}>
                          Уровень {userProgress.level}
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                        borderRadius: '12px',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        <FaChartLine style={{ color: '#10B981' }} />
                        <span style={{ color: '#374151', fontWeight: 600 }}>
                          {userProgress.xp} XP
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                        borderRadius: '12px',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                      }}>
                        <FaCalendarAlt style={{ color: '#EF4444' }} />
                        <span style={{ color: '#374151', fontWeight: 600 }}>
                          {userProgress.login_streak} дней подряд
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleEditProfile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem 1.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                }}
              >
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                  borderRadius: '16px'
                }} />
                <FaEdit style={{ position: 'relative', zIndex: 1 }} />
                <span style={{ position: 'relative', zIndex: 1 }}>Редактировать</span>
              </button>
            </div>

            {/* Контактная информация в современном стиле */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(239, 68, 68, 0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                  }}>
                    <FaEnvelope size={20} style={{ color: 'white' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: '#374151', fontWeight: 600, fontSize: '0.9rem' }}>EMAIL</h4>
                    <p style={{ margin: 0, color: '#1F2937', fontSize: '1.1rem', fontWeight: 500 }}>
                      {user.email || 'admin@gmail.com'}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(16, 185, 129, 0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                  }}>
                    <FaPhone size={20} style={{ color: 'white' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: '#374151', fontWeight: 600, fontSize: '0.9rem' }}>ТЕЛЕФОН</h4>
                    <p style={{ margin: 0, color: '#1F2937', fontSize: '1.1rem', fontWeight: 500 }}>
                      {user.phone || '89158763458'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Блок льгот */}
          <motion.div
            variants={itemVariants}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
              borderRadius: '24px',
              padding: '2.5rem',
              marginBottom: '2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Декоративный элемент */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '200px',
              height: '200px',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 0
            }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                color: 'white',
                position: 'relative'
              }}>
                <FaGift size={24} style={{ position: 'relative', zIndex: 1 }} />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                  borderRadius: '12px'
                }} />
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
                  color: '#6B7280',
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
                      background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      border: '1px solid rgba(139, 0, 0, 0.1)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Декоративный элемент */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '100px',
                      height: '100px',
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                      borderRadius: '50%',
                      transform: 'translate(50%, -50%)',
                      zIndex: 0
                    }} />
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem',
                      position: 'relative',
                      zIndex: 1
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
                      color: '#6B7280',
                      margin: '0 0 0.75rem 0',
                      lineHeight: 1.5,
                      position: 'relative',
                      zIndex: 1
                    }}>
                      {benefit.description}
                    </p>
                    {benefit.category && (
                      <div style={{
                        display: 'inline-block',
                        background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                        color: '#8B0000',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        position: 'relative',
                        zIndex: 1
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
                color: '#6B7280'
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '1rem',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                    borderRadius: '16px'
                  }} />
                  <span style={{ position: 'relative', zIndex: 1 }}>Выбрать льготы</span>
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