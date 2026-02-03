import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircle, 
  FileText, 
  Sparkles, 
  Gift,
  ArrowRight
} from 'lucide-react';
import { Box, Typography, Paper } from '@mui/material';

interface QuickStartCardProps {
  profileCompletion: number;
  hasMoodEntries: boolean;
  hasBenefits: boolean;
  balance: number;
  hasPreferencesTest: boolean;
  userId: string | null;
  onboardingCompleted?: boolean; // Статус из БД
  onComplete?: () => void;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  xpReward: number;
  completed: boolean;
}

const QuickStartCard: React.FC<QuickStartCardProps> = ({
  profileCompletion,
  hasMoodEntries,
  hasBenefits,
  balance: _balance,
  hasPreferencesTest,
  userId,
  onboardingCompleted = false, // Получаем из пропсов (из БД)
  onComplete
}) => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = React.useState(onboardingCompleted);

  // Синхронизируем с пропсом из Dashboard
  React.useEffect(() => {
    console.log('[QuickStartCard] onboardingCompleted prop changed:', onboardingCompleted);
    setIsOnboardingCompleted(onboardingCompleted);
  }, [onboardingCompleted]);
  
  // Логируем текущее состояние
  React.useEffect(() => {
    console.log('[QuickStartCard] Current state:', {
      isOnboardingCompleted,
      onboardingCompleted,
      shouldShow: !isOnboardingCompleted && (profileCompletion < 50 || !hasMoodEntries || !hasBenefits || !hasPreferencesTest)
    });
  }, [isOnboardingCompleted, onboardingCompleted, profileCompletion, hasMoodEntries, hasBenefits, hasPreferencesTest]);

  // Определяем завершенность всех шагов (баланс не учитываем, так как это не шаг онбординга)
  const allCompleted = profileCompletion >= 50 && hasMoodEntries && hasPreferencesTest && hasBenefits;

  // Показываем сообщение об успехе если все выполнено и онбординг еще не был завершен (проверяем и localStorage, чтобы не показывать снова после добавления льготы)
  const completedInStorage = typeof localStorage !== 'undefined' && userId && localStorage.getItem(`yoddle_onboarding_completed_${userId}`) === '1';
  React.useEffect(() => {
    if (allCompleted && userId && !showSuccess && !isOnboardingCompleted && !completedInStorage) {
      setShowSuccess(true);
    }
  }, [allCompleted, userId, showSuccess, isOnboardingCompleted, completedInStorage]);

  // Если онбординг завершен (проп или localStorage), не показываем компонент
  if (isOnboardingCompleted || completedInStorage) {
    return null;
  }

  // Определяем, нужно ли показывать карточку - показываем если есть хотя бы одно незавершенное действие
  const hasIncompleteActions = profileCompletion < 50 || !hasMoodEntries || !hasBenefits || !hasPreferencesTest;
  const shouldShow = !isOnboardingCompleted && hasIncompleteActions;

  // Порядок шагов по логике: профиль -> настроение -> льготы -> тест предпочтений
  const actions: QuickAction[] = [
    {
      id: 'profile',
      title: 'Заполните профиль',
      description: 'Добавьте информацию о себе',
      icon: UserCircle,
      route: '/profile',
      xpReward: 25,
      completed: profileCompletion >= 50
    },
    {
      id: 'mood',
      title: 'Запишите настроение',
      description: 'Поделитесь своим состоянием',
      icon: FileText,
      route: '/productivity',
      xpReward: 10,
      completed: hasMoodEntries
    },
    {
      id: 'benefits',
      title: 'Выберите первую льготу',
      description: 'Начните использовать льготы',
      icon: Gift,
      route: '/my-benefits',
      xpReward: 0,
      completed: hasBenefits
    },
    {
      id: 'preferences',
      title: 'Пройдите тест предпочтений',
      description: 'Помогите AI узнать ваши интересы',
      icon: Sparkles,
      route: '/preferences',
      xpReward: 75,
      completed: hasPreferencesTest
    }
  ];

  // Фильтруем незавершенные действия в правильном порядке
  const incompleteActions = actions.filter(action => !action.completed);

  const handleActionClick = (route: string) => {
    navigate(route);
  };

  const handleSuccessClose = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // СРАЗУ скрываем компонент для мгновенной реакции
    setIsOnboardingCompleted(true);
    setShowSuccess(false);

    // Сохраняем в localStorage — после обновления страницы модалка не покажется снова
    if (userId && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`yoddle_onboarding_completed_${userId}`, '1');
      } catch (_) {}
    }
    
    // Затем обновляем БД асинхронно
    if (userId) {
      try {
        console.log('🔄 Updating onboarding_completed to true for user:', userId);
        const response = await fetch('/api/progress', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            field: 'onboarding_completed',
            value: true
          }),
        });
        
        const data = await response.json();
        console.log('📊 API Response:', data);
        
        if (response.ok) {
          // Перезагружаем прогресс из БД для гарантии синхронизации
          const refreshResponse = await fetch(`/api/progress?user_id=${userId}`);
          const refreshData = await refreshResponse.json();
          if (refreshData.progress) {
            console.log('✅ Progress refreshed from DB:', refreshData.progress.onboarding_completed);
          }
          if (onComplete) {
            onComplete();
          }
        } else {
          console.error('❌ API Error:', data);
          if (onComplete) {
            onComplete();
          }
        }
      } catch (error) {
        console.error('❌ Error updating onboarding completed:', error);
        // Вызываем callback даже при ошибке
        if (onComplete) {
          onComplete();
        }
      }
    } else {
      if (onComplete) {
        onComplete();
      }
    }
  };

  // Показываем сообщение об успехе если все выполнено и онбординг не завершен
  if (allCompleted && incompleteActions.length === 0 && !isOnboardingCompleted) {
    return (
      <div style={{ gridColumn: '1 / -1' }}>
        <Paper
          sx={{
            background: 'linear-gradient(135deg, #8B0000 0%, #750000 100%)',
            color: 'white',
            borderRadius: '12px',
            p: 4,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 6px 24px rgba(117, 0, 0, 0.15), 0 1.5px 6px rgba(0,0,0,0.08)',
            textAlign: 'center'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              zIndex: 0
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: '2rem',
                mb: 2,
                color: 'white'
              }}
            >
              Поздравляем!
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: '1.5rem',
                mb: 3,
                color: 'rgba(255,255,255,0.95)'
              }}
            >
              Вы успешно освоили работу с Yoddle
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.125rem',
                color: 'rgba(255,255,255,0.9)',
                mb: 3,
                lineHeight: 1.7
              }}
            >
              Теперь вы можете использовать все возможности платформы для управления льготами и повышения продуктивности.
            </Typography>
            <Paper
              component="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleSuccessClose(e)}
              sx={{
                display: 'inline-block',
                backgroundColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: '8px',
                px: 4,
                py: 1.5,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(255,255,255,0.3)',
                outline: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  transform: 'scale(1.05)'
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: 'white',
                  pointerEvents: 'none'
                }}
              >
                Понятно
              </Typography>
            </Paper>
          </Box>
        </Paper>
      </div>
    );
  }

  if (!shouldShow || incompleteActions.length === 0) {
    return null;
  }

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #8B0000 0%, #750000 100%)',
          color: 'white',
          borderRadius: '12px',
          p: 3,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 6px 24px rgba(117, 0, 0, 0.15), 0 1.5px 6px rgba(0,0,0,0.08)'
        }}
      >
        {/* Декоративные элементы */}
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            zIndex: 0
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
            zIndex: 0
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              fontSize: '1.5rem',
              mb: 1,
              color: 'white'
            }}
          >
            Начните здесь
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '0.95rem',
              mb: 3
            }}
          >
            Выполните эти шаги, чтобы начать использовать Yoddle
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {incompleteActions.slice(0, 4).map((action) => {
              const IconComponent = action.icon;
              return (
                <div key={action.id}>
                  <Paper
                    onClick={() => handleActionClick(action.route)}
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '8px',
                      p: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      border: '1px solid rgba(255,255,255,0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <IconComponent size={20} color="white" />
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '1rem',
                            color: 'white',
                            mb: 0.25
                          }}
                        >
                          {action.title}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.875rem',
                            color: 'rgba(255,255,255,0.8)'
                          }}
                        >
                          {action.description}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {action.xpReward > 0 && (
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: 'rgba(255,255,255,0.7)',
                            fontWeight: 500
                          }}
                        >
                          +{action.xpReward} XP
                        </Typography>
                      )}
                      <ArrowRight size={20} color="rgba(255,255,255,0.7)" />
                    </Box>
                  </Paper>
                </div>
              );
            })}
          </Box>
        </Box>
      </Paper>
    </div>
  );
};

export default QuickStartCard;
