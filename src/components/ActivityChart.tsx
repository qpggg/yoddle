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
    content: ''
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
        color: '#666'
      }}>
        Загрузка...
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
        color: '#666'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
        <div>Нет данных за этот месяц</div>
      </div>
    );
  }

  const maxActions = Math.max(...activityData.map(d => d.actions), 1);
  const chartHeight = 140;
  const barWidth = 8;
  const barGap = 2;

  // Функции для tooltip
  const showTooltip = (event: React.MouseEvent, day: number, actions: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const monthNames = [
      'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
      'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'
    ];
    
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content: `${day} ${monthNames[currentYear === 2025 ? 5 : new Date().getMonth()]}: ${actions} ${actions === 1 ? 'действие' : actions < 5 ? 'действия' : 'действий'}`
    });
  };

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className={className} style={{ padding: '16px 0' }}>
      {/* Заголовок с общей статистикой */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: '#8B0000' 
        }}>
          {currentMonth} {currentYear}
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: '#666',
          background: '#f8f8f8',
          padding: '4px 8px',
          borderRadius: '12px'
        }}>
          {totalActions} действий
        </div>
      </div>

      {/* График */}
      <div style={{ 
        height: chartHeight,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: `${barGap}px`,
        padding: '0 10px',
        overflow: 'hidden'
      }}>
        {activityData.map((dataPoint, index) => {
          const barHeight = maxActions > 0 ? (dataPoint.actions / maxActions) * chartHeight : 0;
          const isToday = dataPoint.day === new Date().getDate();
          
          return (
            <motion.div
              key={dataPoint.day}
              initial={{ height: 0 }}
              animate={{ height: barHeight }}
              transition={{ delay: index * 0.02, duration: 0.4, ease: 'easeOut' }}
              style={{
                width: barWidth,
                minHeight: dataPoint.actions > 0 ? 3 : 1,
                background: dataPoint.actions > 0 
                  ? (isToday 
                    ? 'linear-gradient(180deg, #8B0000 0%, #B22222 100%)'
                    : 'linear-gradient(180deg, #C0C0C0 0%, #A0A0A0 100%)')
                  : '#E5E5E5',
                borderRadius: '2px',
                position: 'relative',
                cursor: 'pointer'
              }}
              whileHover={{ 
                scale: 1.15,
                y: -3,
                background: isToday 
                  ? 'linear-gradient(180deg, #A00000 0%, #D32222 100%)'
                  : 'linear-gradient(180deg, #8B0000 0%, #B22222 100%)',
                boxShadow: '0 4px 12px rgba(139, 0, 0, 0.3)',
                zIndex: 10,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
              onMouseEnter={(e) => showTooltip(e, dataPoint.day, dataPoint.actions)}
              onMouseLeave={hideTooltip}
            >
              {/* Показываем номер дня только для каждого 5-го дня или если сегодня */}
              {(dataPoint.day % 5 === 0 || isToday) && (
                <div style={{
                  position: 'absolute',
                  bottom: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '10px',
                  color: isToday ? '#8B0000' : '#999',
                  fontWeight: isToday ? 600 : 400
                }}>
                  {dataPoint.day}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Легенда */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        gap: '16px',
        marginTop: '30px',
        fontSize: '11px',
        color: '#666'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: 'linear-gradient(180deg, #8B0000 0%, #B22222 100%)',
            borderRadius: '2px'
          }} />
          Сегодня
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: 'linear-gradient(180deg, #C0C0C0 0%, #A0A0A0 100%)',
            borderRadius: '2px'
          }} />
          Активность
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)',
            background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(139, 0, 0, 0.3)',
            zIndex: 1000,
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          {tooltip.content}
          {/* Треугольная стрелочка */}
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
              borderTop: '5px solid #8B0000'
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default ActivityChart; 