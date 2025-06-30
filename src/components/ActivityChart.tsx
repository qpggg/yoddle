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
        height: '280px',
        background: 'linear-gradient(135deg, #fff 0%, #f8fafe 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 217, 0, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '12px' 
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid rgb(255, 217, 0)',
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
        height: '280px',
        background: 'linear-gradient(135deg, #fff 0%, #f8fafe 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 217, 0, 0.1)',
        color: '#666'
      }}>
        <div style={{ 
          fontSize: '48px', 
          marginBottom: '16px',
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
  const chartHeight = 160;
  const barWidth = 12;
  const barGap = 3;

  // Статистика
  const avgActions = Math.round(totalActions / activityData.length * 10) / 10;
  const activeDays = activityData.filter(d => d.actions > 0).length;
  const bestDay = activityData.reduce((best, day) => day.actions > best.actions ? day : best, activityData[0]);
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
      padding: '24px', 
      position: 'relative',
      background: 'linear-gradient(135deg, #fff 0%, #f8fafe 100%)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 217, 0, 0.1)',
      boxShadow: '0 8px 32px rgba(255, 217, 0, 0.1)'
    }}>
      {/* Заголовок с расширенной статистикой */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '32px'
      }}>
        <div>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            color: '#1a1a1a',
            marginBottom: '8px'
          }}>
            Активность за {currentMonth.toLowerCase()} {currentYear}
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '24px', 
            fontSize: '14px' 
          }}>
            <div style={{ color: '#666' }}>
              <span style={{ fontWeight: 600, color: 'rgb(255, 217, 0)' }}>{totalActions}</span> действий
            </div>
            <div style={{ color: '#666' }}>
              <span style={{ fontWeight: 600, color: '#22c55e' }}>{activeDays}</span> активных дней
            </div>
            <div style={{ color: '#666' }}>
              <span style={{ fontWeight: 600, color: '#3b82f6' }}>{avgActions}</span> в среднем
            </div>
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, rgb(255, 217, 0) 0%, rgb(255, 193, 7) 100%)',
          color: '#000',
          padding: '8px 16px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 4px 16px rgba(255, 217, 0, 0.3)'
        }}>
          🏆 Лучший день: {bestDay.day} ({bestDay.actions})
        </div>
      </div>

      {/* График */}
      <div style={{ 
        height: chartHeight,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: `${barGap}px`,
        padding: '0 20px',
        background: 'linear-gradient(180deg, rgba(255, 217, 0, 0.03) 0%, transparent 100%)',
        borderRadius: '12px',
        marginBottom: '24px',
        position: 'relative'
      }}>
        {/* Сетка фона */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(to top, 
            rgba(255, 217, 0, 0.1) 0px, transparent 1px,
            transparent 1px, transparent ${chartHeight / 4}px,
            rgba(255, 217, 0, 0.05) ${chartHeight / 4}px, transparent ${chartHeight / 4 + 1}px,
            transparent ${chartHeight / 4 + 1}px, transparent ${chartHeight / 2}px,
            rgba(255, 217, 0, 0.05) ${chartHeight / 2}px, transparent ${chartHeight / 2 + 1}px,
            transparent ${chartHeight / 2 + 1}px, transparent ${chartHeight * 3/4}px,
            rgba(255, 217, 0, 0.05) ${chartHeight * 3/4}px, transparent ${chartHeight * 3/4 + 1}px
          )`,
          pointerEvents: 'none'
        }} />

        {activityData.map((dataPoint, index) => {
          const barHeight = maxActions > 0 ? (dataPoint.actions / maxActions) * chartHeight : 0;
          const isToday = dataPoint.day === currentDay;
          const isBestDay = dataPoint.day === bestDay.day;
          const intensity = dataPoint.actions / maxActions;
          
          return (
            <motion.div
              key={dataPoint.day}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: barHeight, opacity: 1 }}
              transition={{ 
                delay: index * 0.015, 
                duration: 0.6, 
                ease: [0.25, 0.1, 0.25, 1] 
              }}
              style={{
                width: barWidth,
                minHeight: dataPoint.actions > 0 ? 4 : 2,
                background: dataPoint.actions > 0 
                  ? (isToday 
                    ? 'linear-gradient(180deg, rgb(255, 217, 0) 0%, rgb(255, 193, 7) 100%)'
                    : isBestDay
                    ? 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)'
                    : `linear-gradient(180deg, 
                        rgba(255, 217, 0, ${0.3 + intensity * 0.7}) 0%, 
                        rgba(255, 193, 7, ${0.4 + intensity * 0.6}) 100%)`
                    )
                  : 'rgba(0, 0, 0, 0.05)',
                borderRadius: '4px',
                position: 'relative',
                cursor: 'pointer',
                boxShadow: dataPoint.actions > 0 
                  ? `0 2px 8px rgba(255, 217, 0, ${intensity * 0.3})`
                  : 'none'
              }}
              whileHover={{ 
                scale: 1.1,
                y: -2,
                boxShadow: isToday 
                  ? '0 8px 24px rgba(255, 217, 0, 0.4)'
                  : isBestDay
                  ? '0 8px 24px rgba(34, 197, 94, 0.4)'
                  : `0 8px 24px rgba(255, 217, 0, ${intensity * 0.4})`,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
              onMouseEnter={(e) => showTooltip(e, dataPoint.day, dataPoint.actions)}
              onMouseLeave={hideTooltip}
            >
              {/* Подсветка для сегодняшнего дня */}
              {isToday && (
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '6px',
                  height: '6px',
                  background: 'rgb(255, 217, 0)',
                  borderRadius: '50%',
                  boxShadow: '0 0 12px rgba(255, 217, 0, 0.6)'
                }} />
              )}

              {/* Подсветка для лучшего дня */}
              {isBestDay && !isToday && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '12px'
                }}>
                  👑
                </div>
              )}

              {/* Показываем номер дня */}
              {(dataPoint.day % 5 === 0 || isToday || isBestDay) && (
                <div style={{
                  position: 'absolute',
                  bottom: '-24px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '11px',
                  color: isToday ? 'rgb(255, 217, 0)' : isBestDay ? '#22c55e' : '#999',
                  fontWeight: (isToday || isBestDay) ? 700 : 500
                }}>
                  {dataPoint.day}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Современная легенда */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        gap: '32px',
        fontSize: '12px',
        color: '#666'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            background: 'linear-gradient(135deg, rgb(255, 217, 0) 0%, rgb(255, 193, 7) 100%)',
            borderRadius: '3px',
            boxShadow: '0 2px 8px rgba(255, 217, 0, 0.3)'
          }} />
          <span style={{ fontWeight: 500 }}>Сегодня</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            borderRadius: '3px',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
          }} />
          <span style={{ fontWeight: 500 }}>Лучший день</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            background: 'linear-gradient(135deg, rgba(255, 217, 0, 0.6) 0%, rgba(255, 193, 7, 0.7) 100%)',
            borderRadius: '3px'
          }} />
          <span style={{ fontWeight: 500 }}>Активность</span>
        </div>
      </div>

      {/* Улучшенный Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)',
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
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
            gap: '4px',
            alignItems: 'center'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 600,
              color: 'rgb(255, 217, 0)'
            }}>
              {tooltip.content}
            </div>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 700 
            }}>
              {tooltip.actions} {tooltip.actions === 1 ? 'действие' : tooltip.actions < 5 ? 'действия' : 'действий'}
            </div>
            {tooltip.day === currentDay && (
              <div style={{ 
                fontSize: '11px', 
                color: 'rgb(255, 217, 0)',
                fontWeight: 600 
              }}>
                СЕГОДНЯ
              </div>
            )}
            {tooltip.day === bestDay.day && tooltip.day !== currentDay && (
              <div style={{ 
                fontSize: '11px', 
                color: '#22c55e',
                fontWeight: 600 
              }}>
                ЛУЧШИЙ ДЕНЬ
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
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(0, 0, 0, 0.9)'
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