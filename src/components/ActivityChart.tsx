import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../hooks/useUser';

interface ActivityData {
  day: number;
  actions: number;
}

interface ActivityChartProps {
  className?: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: string;
  day: number;
  actions: number;
}

const ActivityChart: React.FC<ActivityChartProps> = ({ className }) => {
  const { user } = useUser();
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState('');
  const [currentYear, setCurrentYear] = useState(2024);
  const [totalActions, setTotalActions] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
    day: 0,
    actions: 0
  });

  useEffect(() => {
    const fetchActivityData = async () => {
      if (!user?.id) {
        console.log('ActivityChart: Нет user.id');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('ActivityChart: Запрос данных для user_id:', user.id);
        const response = await fetch(`/api/activity?user_id=${user.id}`);
        const data = await response.json();
        console.log('ActivityChart: Ответ API:', data);
        
        if (data.success) {
          setActivityData(data.data);
          setCurrentMonth(data.month);
          setCurrentYear(data.year);
          setTotalActions(data.totalActions);
        } else {
          console.error('ActivityChart: API вернул ошибку:', data);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных активности:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivityData();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className={className} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '200px',
        background: 'linear-gradient(135deg, #fff 0%, #f8fafe 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(139, 0, 0, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '12px' 
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #8B0000',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ 
            color: '#666', 
            fontSize: '14px',
            fontWeight: 500 
          }}>
            Загрузка активности...
          </div>
        </div>
      </div>
    );
  }

  if (!activityData.length) {
    return (
      <div className={className} style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '200px',
        background: 'linear-gradient(135deg, #fff 0%, #f8fafe 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(139, 0, 0, 0.1)',
        color: '#666'
      }}>
        <div style={{ 
          fontSize: '32px', 
          marginBottom: '12px',
          opacity: 0.6 
        }}>📊</div>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: 600, 
          marginBottom: '8px' 
        }}>
          Нет данных за этот месяц
        </div>
        <div style={{ 
          fontSize: '14px', 
          opacity: 0.7 
        }}>
          Начните использовать платформу для отслеживания активности
        </div>
      </div>
    );
  }

  const maxActions = Math.max(...activityData.map(d => d.actions), 1);
  const chartHeight = 120;
  const barWidth = 10;
  const barGap = 2;

  // Статистика
  const avgActions = Math.round(totalActions / activityData.length * 10) / 10;
  const activeDays = activityData.filter(d => d.actions > 0).length;
  const currentDay = new Date().getDate();

  // Улучшенные функции для tooltip
  const showTooltip = (event: React.MouseEvent, day: number, actions: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content: `${day} ${currentMonth}`,
      day,
      actions
    });
  };

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className={className} style={{ 
      padding: '20px', 
      position: 'relative',
      background: 'linear-gradient(135deg, #fff 0%, #f8fafe 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(139, 0, 0, 0.1)',
      boxShadow: '0 4px 20px rgba(139, 0, 0, 0.08)'
    }}>
      {/* Компактный заголовок с статистикой */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 700, 
            color: '#1a1a1a',
            marginBottom: '4px'
          }}>
            Активность за {currentMonth.toLowerCase()} {currentYear}
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            fontSize: '13px' 
          }}>
            <div style={{ color: '#666' }}>
              <span style={{ fontWeight: 600, color: '#8B0000' }}>{totalActions}</span> действий
            </div>
            <div style={{ color: '#666' }}>
              <span style={{ fontWeight: 600, color: '#555' }}>{activeDays}</span> активных дней
            </div>
            <div style={{ color: '#666' }}>
              <span style={{ fontWeight: 600, color: '#777' }}>{avgActions}</span> в среднем
            </div>
          </div>
        </div>
      </div>

      {/* Компактный график */}
      <div style={{ 
        height: chartHeight,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: `${barGap}px`,
        padding: '0 16px',
        background: 'linear-gradient(180deg, rgba(139, 0, 0, 0.02) 0%, transparent 100%)',
        borderRadius: '12px',
        marginBottom: '16px',
        position: 'relative'
      }}>
        {/* Легкая сетка фона */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(to top, 
            rgba(139, 0, 0, 0.05) 0px, transparent 1px,
            transparent 1px, transparent ${chartHeight / 2}px,
            rgba(139, 0, 0, 0.03) ${chartHeight / 2}px, transparent ${chartHeight / 2 + 1}px
          )`,
          pointerEvents: 'none'
        }} />

        {activityData.map((dataPoint, index) => {
          const barHeight = maxActions > 0 ? (dataPoint.actions / maxActions) * chartHeight : 0;
          const isToday = dataPoint.day === currentDay;
          const intensity = dataPoint.actions / maxActions;
          
          return (
            <motion.div
              key={dataPoint.day}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: barHeight, opacity: 1 }}
              transition={{ 
                delay: index * 0.01, 
                duration: 0.5, 
                ease: [0.25, 0.1, 0.25, 1] 
              }}
              style={{
                width: barWidth,
                minHeight: dataPoint.actions > 0 ? 3 : 1,
                background: dataPoint.actions > 0 
                  ? (isToday 
                    ? 'linear-gradient(180deg, #8B0000 0%, #B22222 100%)'
                    : `linear-gradient(180deg, 
                        rgba(139, 0, 0, ${0.3 + intensity * 0.7}) 0%, 
                        rgba(117, 0, 0, ${0.4 + intensity * 0.6}) 100%)`
                    )
                  : 'rgba(0, 0, 0, 0.05)',
                borderRadius: '3px',
                position: 'relative',
                cursor: 'pointer',
                boxShadow: dataPoint.actions > 0 
                  ? `0 2px 6px rgba(139, 0, 0, ${intensity * 0.2})`
                  : 'none'
              }}
              whileHover={{ 
                scale: 1.05,
                y: -1,
                boxShadow: isToday 
                  ? '0 6px 20px rgba(139, 0, 0, 0.3)'
                  : `0 6px 20px rgba(139, 0, 0, ${intensity * 0.3})`,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
              onMouseEnter={(e) => showTooltip(e, dataPoint.day, dataPoint.actions)}
              onMouseLeave={hideTooltip}
            >
              {/* Подсветка для сегодняшнего дня */}
              {isToday && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  background: '#8B0000',
                  borderRadius: '50%',
                  boxShadow: '0 0 8px rgba(139, 0, 0, 0.6)'
                }} />
              )}

              {/* Показываем номер дня */}
              {(dataPoint.day % 5 === 0 || isToday) && (
                <div style={{
                  position: 'absolute',
                  bottom: '-18px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '10px',
                  color: isToday ? '#8B0000' : '#999',
                  fontWeight: isToday ? 700 : 500
                }}>
                  {dataPoint.day}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Компактная легенда */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        gap: '24px',
        fontSize: '12px',
        color: '#666'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
            borderRadius: '2px',
            boxShadow: '0 1px 4px rgba(139, 0, 0, 0.3)'
          }} />
          <span style={{ fontWeight: 500 }}>Сегодня</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.6) 0%, rgba(117, 0, 0, 0.7) 100%)',
            borderRadius: '2px'
          }} />
          <span style={{ fontWeight: 500 }}>Активность</span>
        </div>
      </div>

      {/* Исправленный Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)',
            background: 'rgba(26, 26, 26, 0.95)',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 500,
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.25)',
            zIndex: 1000,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '3px',
            alignItems: 'center'
          }}>
            <div style={{ 
              fontSize: '13px', 
              fontWeight: 600,
              color: '#8B0000'
            }}>
              {tooltip.content}
            </div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 700 
            }}>
              {tooltip.actions} {tooltip.actions === 1 ? 'действие' : tooltip.actions < 5 ? 'действия' : 'действий'}
            </div>
            {tooltip.day === currentDay && (
              <div style={{ 
                fontSize: '10px', 
                color: '#8B0000',
                fontWeight: 600 
              }}>
                СЕГОДНЯ
              </div>
            )}
          </div>
          
          {/* Стрелочка */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid rgba(26, 26, 26, 0.95)'
            }}
          />
        </div>
      )}

      {/* CSS для анимации загрузки */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ActivityChart; 