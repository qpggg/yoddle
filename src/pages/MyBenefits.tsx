import React, { useState, useEffect, useMemo } from 'react';
import { Container, Typography, Box, Grid, Paper, Modal, Button, Chip, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../hooks/useUser';
import { useActivity } from '../hooks/useActivity';
import { FaHeartbeat, FaFutbol, FaGraduationCap, FaBook, FaCheck, FaTimes, FaLeaf, FaUsers, FaHandHoldingHeart, FaExclamationTriangle } from 'react-icons/fa';
import { GiBrain } from "react-icons/gi";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 100 }
  }
};

const buttonStyle = {
  background: 'linear-gradient(45deg, #8B0000, #B22222)',
  color: '#fff',
  border: 'none',
  borderRadius: '50px',
  padding: '10px 24px',
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(139,0,0,0.2)',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  marginTop: 'auto'
};

const modalBoxStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: '2rem 2.5rem',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  minWidth: 320,
  borderTop: '5px solid #8B0000'
};

const categoryIcons: { [key: string]: React.ReactElement } = {
  'Здоровье': <FaHeartbeat size={30} />,
  'Спорт': <FaFutbol size={30} />,
  'Обучение': <FaGraduationCap size={30} />,
  'Психология': <GiBrain size={30} />,
  'Социальная поддержка': <FaHandHoldingHeart size={30}/>,
  'Отдых': <FaLeaf size={30}/>,
  'Транспорт': <FaUsers size={30}/>,
  'Default': <FaBook size={30} />
};

interface Benefit {
  id: number;
  name: string;
  description: string;
  category: string;
  price_coins?: number;
}

// Функция проверки рекомендации
const checkIfRecommended = (benefit: Benefit, userRecommendedBenefitIds: number[]): boolean => {
  const isRecommended = userRecommendedBenefitIds.includes(benefit.id);
  
  // Отладка для первых нескольких вызовов
  if (Math.random() < 0.1) { // 10% вероятность логирования
    console.log(`Checking benefit: ${benefit.name} (ID: ${benefit.id}), recommendedIds: [${userRecommendedBenefitIds.join(', ')}], result: ${isRecommended}`);
  }
  
  return isRecommended;
};

const BenefitCard = ({ benefit, onAdd, isAdded, isDisabled, isSelectedCard, isRecommended: recommended, onRefund, refundSecondsLeft }: { 
  benefit: Benefit; 
  onAdd: () => void; 
  isAdded: boolean; 
  isDisabled: boolean;
  isSelectedCard?: boolean;
  isRecommended?: boolean;
  onRefund?: () => void;
  refundSecondsLeft?: number;
}) => (
  <motion.div variants={itemVariants} whileHover={isSelectedCard ? {} : { y: -8, boxShadow: '0 20px 40px rgba(139,0,0,0.15)' }} style={{ height: '100%', borderRadius: '24px', transition: 'box-shadow 0.3s ease' }}>
    <Paper elevation={0} sx={{ 
      p: 3, 
      borderRadius: '24px', 
      background: '#fff', 
      boxShadow: '0 8px 32px rgba(0,0,0,0.05)', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      border: recommended ? '2px solid #FFD700' : '1px solid #eee',
      position: 'relative',
      overflow: 'visible'
    }}>
      {recommended && (
        <Chip 
          label="Рекомендуем" 
          size="small"
          sx={{
            position: 'absolute',
            top: -8,
            right: 16,
            background: 'linear-gradient(135deg, #E6C200 0%, #FFD800 50%, #FFDC33 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.7rem',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            zIndex: 2,
            height: '22px',
            borderRadius: '11px',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 3px 12px rgba(160,118,28,0.4), 0 1px 3px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(10px)',
            '& .MuiChip-label': {
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '0 8px',
              '&::before': {
                content: '"✦"',
                fontSize: '0.6rem',
                color: '#FFF8DC',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(255,248,220,0.1) 100%)',
              borderRadius: '11px',
              pointerEvents: 'none'
            }
          }}
        />
      )}
      <Box sx={{ color: '#8B0000', mb: 2 }}>
        {categoryIcons[benefit.category] || categoryIcons['Default']}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A', mb: 1, minHeight: '64px' }}>
        {benefit.name}
      </Typography>
      <Typography variant="body2" sx={{ color: '#555', mb: 3, lineHeight: 1.6, flexGrow: 1 }}>
        {benefit.description}
      </Typography>
      <Chip label={benefit.category} size="small" sx={{ background: '#f5f5f5', color: '#555', fontWeight: 500, alignSelf: 'flex-start', mb: 3 }} />
      {!isSelectedCard && (
        <button
          style={{ 
            ...buttonStyle,
            opacity: isAdded || isDisabled ? 0.6 : 1,
            background: isAdded ? '#555' : 'linear-gradient(45deg, #8B0000, #B22222)',
            cursor: isAdded || isDisabled ? 'not-allowed' : 'pointer'
          }}
          onClick={onAdd}
          disabled={isAdded || isDisabled}
        >
          {!isAdded && (
            <>
              <Box component="img" src="/coins.png" alt="coins" sx={{ width: 16, height: 16 }} />
              { (benefit.price_coins ?? 0).toLocaleString('ru-RU') }
            </>
          )}
          {isAdded && <><FaCheck />Добавлено</>}
        </button>
      )}
      {isSelectedCard && (
        <Box sx={{ display: 'flex', alignItems: 'center', alignSelf: 'flex-start' }}>
          <button
            style={{ 
              ...buttonStyle,
              background: 'linear-gradient(45deg, #8B0000, #B22222)',
              color: '#fff',
              border: 'none',
              alignSelf: 'auto',
              display: 'inline-flex'
            }}
            onClick={onRefund}
          >
            <Box component="img" src="/coins.png" alt="coins" sx={{ width: 16, height: 16 }} />
            Вернуть
          </button>
          {typeof refundSecondsLeft === 'number' && refundSecondsLeft > 0 && (
            <Chip 
              label={`${Math.floor(refundSecondsLeft / 3600).toString().padStart(2, '0')}:${Math.floor((refundSecondsLeft % 3600) / 60).toString().padStart(2, '0')}:${(refundSecondsLeft % 60).toString().padStart(2, '0')}`}
              size="small"
              sx={{ ml: 2, background: 'rgba(139,0,0,0.08)', color: '#8B0000', fontWeight: 700, borderRadius: '12px' }}
            />
          )}
        </Box>
      )}
    </Paper>
  </motion.div>
);

// Лимит отключен по требованию
const MAX_BENEFITS = Infinity;

const MyBenefits: React.FC = () => {
  const { user } = useUser();
  const { logBenefitAdded } = useActivity();
  const [allBenefits, setAllBenefits] = useState<Benefit[]>([]);
  const [userBenefitIds, setUserBenefitIds] = useState<number[]>([]);
  const [openBenefit, setOpenBenefit] = useState<Benefit | null>(null);
  const [modalType, setModalType] = useState<'confirm' | 'limit' | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [userRecommendedBenefitIds, setUserRecommendedBenefitIds] = useState<number[]>([]);
  const [refundLeft, setRefundLeft] = useState<Record<number, number>>({}); // benefit_id -> seconds_left

  useEffect(() => {
    setIsLoading(true);
    const fetchBenefits = fetch('/api/benefits').then(res => res.json());
    const fetchUserBenefits = user?.id ? fetch(`/api/user-benefits?user_id=${user.id}`).then(res => res.json()) : Promise.resolve({ benefits: [] });
    const fetchUserRecommendations = user?.id ? fetch(`/api/user-recommendations?user_id=${user.id}`).then(res => res.json()) : Promise.resolve({ recommendations: [] });

    Promise.all([fetchBenefits, fetchUserBenefits, fetchUserRecommendations])
      .then(([allBenefitsData, userBenefitsData, userRecommendationsData]) => {
        setAllBenefits(allBenefitsData.benefits || []);
        setUserBenefitIds((userBenefitsData.benefits || []).map((b: any) => b.id));
        
        // Загружаем ID рекомендованных льгот
        const recommendedBenefitIds = (userRecommendationsData.recommendations || []).map((rec: any) => rec.benefit_id);
        console.log('Loaded recommendations:', userRecommendationsData.recommendations);
        console.log('Recommended benefit IDs:', recommendedBenefitIds);
        setUserRecommendedBenefitIds(recommendedBenefitIds);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleAddClick = (benefit: Benefit) => {
    if (userBenefitIds.length >= MAX_BENEFITS) {
      setModalType('limit');
    } else {
      setOpenBenefit(benefit);
      setModalType('confirm');
    }
  };

  const handleClose = () => { 
    setOpenBenefit(null); 
    setModalType(null);
    setTimeout(() => setSuccess(false), 300); 
  };
  
  const handleConfirm = async () => {
    if (!user || !openBenefit) return;
    
    // 1) Списываем монеты за льготу (если есть цена)
    const purchaseRes = await fetch('/api/wallet/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, benefit_id: openBenefit.id })
    });
    if (!purchaseRes.ok) {
      const data = await purchaseRes.json().catch(() => ({}));
      if (data?.error === 'insufficient_funds') {
        alert(`Недостаточно средств: нужно ${data.required}, доступно ${data.balance}`);
      } else {
        alert('Не удалось выполнить покупку');
      }
      return;
    }

    // 2) Добавляем льготу пользователю для отображения
    await fetch('/api/user-benefits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, benefit_id: openBenefit.id })
    });

    // 2.1) Перезапускаем таймер возврата на 48 часов для этой льготы
    setRefundLeft(prev => ({ ...prev, [openBenefit.id]: 48 * 3600 }));

    // 🎉 АВТОЛОГИРОВАНИЕ ДОБАВЛЕНИЯ ЛЬГОТЫ
    await logBenefitAdded(openBenefit.name);
    
    setSuccess(true);
    setUserBenefitIds(prev => [...prev, openBenefit.id]);
    setTimeout(handleClose, 1200);
  };

  const categories = useMemo(() => ['Все', ...Array.from(new Set(allBenefits.map(b => b.category)))], [allBenefits]);
  const filteredBenefits = useMemo(() => selectedCategory === 'Все'
    ? allBenefits
    : allBenefits.filter(b => b.category === selectedCategory), [allBenefits, selectedCategory]);
    
  const selectedBenefits = useMemo(() => allBenefits.filter(b => userBenefitIds.includes(b.id)), [allBenefits, userBenefitIds]);

  // Загружаем окна возврата для выбранных льгот (последняя покупка по каждой)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) return;
      const updates: Record<number, number> = {};
      for (const b of selectedBenefits) {
        try {
          const r = await fetch(`/api/wallet/purchases?user_id=${user.id}&benefit_id=${b.id}&limit=1`).then(res => res.json());
          const last = r?.data && r.data[0];
          if (last?.created_at) {
            const createdAt = new Date(last.created_at).getTime();
            const now = Date.now();
            const seconds = Math.max(0, Math.floor(48 * 3600 - (now - createdAt) / 1000));
            updates[b.id] = seconds;
          } else {
            updates[b.id] = 0;
          }
        } catch {
          updates[b.id] = 0;
        }
      }
      if (!cancelled) setRefundLeft((prev) => ({ ...prev, ...updates }));
    };
    load();
    const id = setInterval(() => load(), 1000 * 30); // раз в 30 секунд обновляем таймер из сервера
    return () => { cancelled = true; clearInterval(id); };
  }, [user?.id, selectedBenefits.map(b => b.id).join(',')]);

  // Тикающий таймер, уменьшаем оставшееся время каждую секунду
  useEffect(() => {
    const id = setInterval(() => {
      setRefundLeft(prev => {
        const next: Record<number, number> = {};
        let changed = false;
        for (const [k, v] of Object.entries(prev)) {
          const nv = Math.max(0, (v as number) - 1);
          next[Number(k)] = nv;
          if (nv !== v) changed = true;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f9fafb' }}>
        <CircularProgress sx={{ color: '#8B0000' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f9fafb', pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box
              sx={{
                width: '80px',
                height: '80px',
                borderRadius: '16px',
                backgroundColor: 'rgba(139, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                '& svg': {
                  fontSize: '36px',
                  color: '#8B0000'
                }
              }}
            >
              <FaHeartbeat />
            </Box>
            
            <Typography
              variant="h3"
              sx={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 900,
                color: '#1A1A1A',
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              {user?.name}, ваши льготы
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 500,
                color: '#666',
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Выберите бенефиты, которые помогут вам работать продуктивнее и чувствовать себя лучше
            </Typography>
          </Box>
        </motion.div>

        {/* --- ВЫБРАННЫЕ ЛЬГОТЫ --- */}
        <Box sx={{ mb: 10, p: 4, background: '#fff', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1A1A1A', mb: 4, textAlign: 'center' }}>
            Выбранные льготы
          </Typography>
          <AnimatePresence>
            {selectedBenefits.length > 0 ? (
              <Grid container spacing={4} component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
                {selectedBenefits.map((benefit) => (
              <Grid item xs={12} sm={6} md={4} key={`selected-${benefit.id}`} component={motion.div} layout>
                <BenefitCard 
                      benefit={benefit} 
                      onAdd={() => {}} 
                      isAdded={true} 
                      isDisabled={false} 
                      isSelectedCard={true}
                        refundSecondsLeft={refundLeft[benefit.id] ?? 0}
                      onRefund={async () => {
                          if (!user?.id) return;
                          // Ищем последнюю покупку по этой льготе
                          let last: any = null;
                          try {
                            const purchases = await fetch(`/api/wallet/purchases?user_id=${user.id}&benefit_id=${benefit.id}&limit=1`).then(r => r.json());
                            last = purchases?.data && purchases.data[0];
                          } catch {}

                          // Пытаемся выполнить возврат: по transaction_id если есть, иначе по benefit_id (fallback на бэке)
                          const txIdOrBenefit = last?.id ?? benefit.id;
                          const res = await fetch('/api/wallet/refund', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user_id: user.id, transaction_id: txIdOrBenefit })
                          });
                          if (res.ok) {
                            await fetch('/api/wallet/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id }) });
                            // Удаляем льготу из выбранных локально
                            setUserBenefitIds(prev => prev.filter(id => id !== benefit.id));
                            // Также убираем из user_benefits на сервере для консистентности
                            await fetch('/api/user-benefits', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, benefit_id: benefit.id }) });
                            setRefundLeft(prev => ({ ...prev, [benefit.id]: 0 }));
                            try { await fetch(`/api/wallet/transactions?user_id=${user.id}&limit=5&offset=0&type=all`); } catch {}
                          } else {
                            const data = await res.json().catch(() => ({}));
                            const left = data?.seconds_left ? Math.max(0, Math.floor(data.seconds_left / 3600)) : null;
                            alert(data?.error ? `Возврат недоступен. ${left !== null ? `Осталось ${left} ч.` : ''}` : 'Ошибка возврата');
                          }
                        }}
                      isRecommended={checkIfRecommended(benefit, userRecommendedBenefitIds)}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Typography align="center" sx={{ color: '#555', fontStyle: 'italic' }}>
                  Пока вы ничего не выбрали, посмотрите список бенефитов ниже
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* --- ВСЕ ДОСТУПНЫЕ ЛЬГОТЫ --- */}
        <motion.div>
          <Typography variant="h3" align="center" sx={{ fontWeight: 800, color: '#8B0000', mb: 2 }}>
            Все доступные льготы
          </Typography>
          <Typography align="center" sx={{ color: '#555', mb: 6, maxWidth: '600px', mx: 'auto' }}>
            Выберите бенефиты, которые помогут вам работать продуктивнее и чувствовать себя лучше.
          </Typography>
          
          {userBenefitIds.length >= MAX_BENEFITS && (
             <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Paper sx={{ p: 3, mb: 6, borderRadius: '16px', background: 'linear-gradient(45deg, #8B0000, #B22222)', color: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FaExclamationTriangle size={30} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Вы выбрали максимум льгот</Typography>
                    <Typography variant="body2">Удачного использования! Вы сможете выбрать новые льготы в следующем месяце.</Typography>
                  </Box>
                </Paper>
             </motion.div>
          )}

          {/* Фильтр по категориям */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6, flexWrap: 'wrap', gap: 1.5 }}>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => setSelectedCategory(category)}
                sx={{
                  background: selectedCategory === category ? '#8B0000' : '#fff',
                  color: selectedCategory === category ? '#fff' : '#444',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '15px',
                  padding: '18px 12px',
                  borderRadius: '16px',
                  border: selectedCategory === category ? 'none' : '1px solid #ddd',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: selectedCategory === category ? '#A52A2A' : '#f5f5f5',
                    transform: 'translateY(-2px)'
                  }
                }}
              />
            ))}
          </Box>

          <Grid container spacing={4} component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
            {filteredBenefits.map((benefit) => (
              <Grid item xs={12} sm={6} md={4} key={benefit.id} component={motion.div} layout>
                <BenefitCard 
                  benefit={benefit} 
                  onAdd={() => handleAddClick(benefit)} 
                  isAdded={userBenefitIds.includes(benefit.id)}
                  isDisabled={userBenefitIds.length >= MAX_BENEFITS && !userBenefitIds.includes(benefit.id)}
                  isRecommended={checkIfRecommended(benefit, userRecommendedBenefitIds)}
                />
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Модальное окно */}
        <Modal open={!!modalType} onClose={handleClose} sx={{ backdropFilter: 'blur(5px)'}}>
          <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
            <AnimatePresence>
            {modalType === 'confirm' && openBenefit && (
              <motion.div initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.8}}>
                <Box sx={modalBoxStyle}>
                  {!success ? (
                    <>
                      <Typography variant="h6" sx={{ mb: 1, color: '#1A1A1A', fontWeight: 700 }}>Подтвердите ваш выбор</Typography>
                      <Typography sx={{ color: '#555', mb: 3 }}>Вы хотите добавить льготу "{openBenefit?.name}"?</Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="contained" sx={{ background: '#32CD32', color: '#fff', fontWeight: 600, px: 4, borderRadius: '50px', '&:hover': { background: '#228B22' } }} onClick={handleConfirm}>
                          <FaCheck style={{marginRight: '8px'}}/>Да
                        </Button>
                        <Button variant="outlined" sx={{ color: '#D32F2F', borderColor: '#D32F2F', fontWeight: 600, px: 4, borderRadius: '50px', '&:hover': { background: 'rgba(211, 47, 47, 0.04)', borderColor: '#C62828' } }} onClick={handleClose}>
                           <FaTimes style={{marginRight: '8px'}}/>Нет
                        </Button>
                      </Box>
                    </>
                      ) : (
                     <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}>
                        <FaCheck size={40} color="#32CD32"/>
                        <Typography variant="h6" sx={{ color: '#1A1A1A', fontWeight: 700, mt: 2 }}>Льгота добавлена!</Typography>
                        {/* Таймер окна возврата: показываем 48 часов для UX-подтверждения */}
                        <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>Возврат доступен в течение 48 часов.</Typography>
                     </motion.div>
                  )}
                </Box>
              </motion.div>
            )}
            {modalType === 'limit' && (
               <motion.div initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.8}}>
                <Box sx={modalBoxStyle}>
                    <FaExclamationTriangle size={40} color="#D32F2F"/>
                    <Typography variant="h6" sx={{ color: '#1A1A1A', fontWeight: 700, mt: 2, mb: 1 }}>Достигнут лимит</Typography>
                    <Typography sx={{ color: '#555', mb: 3 }}>Вы уже выбрали максимальное количество льгот в этом месяце (2).</Typography>
                    <Button variant="contained" sx={{ background: '#8B0000', color: '#fff', fontWeight: 600, px: 4, borderRadius: '50px', '&:hover': { background: '#A52A2A' } }} onClick={handleClose}>
                      Понятно
                    </Button>
                </Box>
              </motion.div>
            )}
            </AnimatePresence>
          </Box>
        </Modal>
      </Container>
    </Box>
  );
};

export default MyBenefits; 