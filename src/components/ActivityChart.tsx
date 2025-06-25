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

const ActivityChart: React.FC<ActivityChartProps> = ({ className }) => {
  const { user } = useUser();
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState('');
  const [totalActions, setTotalActions] = useState(0);

  useEffect(() => {
    const fetchActivityData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/activity?user_id=${user.id}`);
        const data = await response.json();
        
        if (data.success) {
          setActivityData(data.data);
          setCurrentMonth(data.month);
          setTotalActions(data.totalActions);
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
          {currentMonth} 2024
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
                transform: 'scaleY(1.1)',
                background: dataPoint.actions > 0 
                  ? 'linear-gradient(180deg, #8B0000 0%, #B22222 100%)'
                  : '#D0D0D0'
              }}
              title={`${dataPoint.day} число: ${dataPoint.actions} действий`}
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
    </div>
  );
};

export default ActivityChart; 