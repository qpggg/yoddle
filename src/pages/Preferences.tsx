import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, Button, LinearProgress, CircularProgress, TextField, Chip, MenuItem, InputAdornment, Divider, Snackbar, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeartbeat, FaFutbol, FaGraduationCap, FaUsers, FaHandHoldingHeart, FaLeaf, FaRedo, FaLightbulb, FaClock, FaShieldAlt, FaBullseye, FaBook, FaFeatherAlt, FaTags, FaBan, FaLaptop, FaMoneyBillWave, FaRegClock, FaCheck } from 'react-icons/fa';
import { GiBrain } from 'react-icons/gi';
import { useUser } from '../hooks/useUser';

// Маппинг категорий на иконки
const categoryIcons: { [key: string]: React.ReactElement } = {
  'Здоровье': <FaHeartbeat />,
  'Спорт': <FaFutbol />,
  'Обучение': <FaGraduationCap />,
  'Психология': <GiBrain />,
  'Социальная поддержка': <FaHandHoldingHeart />,
  'Отдых': <FaLeaf />
};

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

const cardStyle = {
  background: '#fff',
  borderRadius: '16px',
  padding: '2rem',
  boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
  border: '1px solid #E5E5E5',
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
};

interface Question {
  id: number;
  text: string;
  icon: React.ReactElement;
  options: {
    text: string;
    value: string;
    icon: React.ReactElement;
  }[];
}

interface BenefitRecommendation {
  category: string;
  icon: React.ReactElement;
  title: string;
  description: string;
  examples: string[];
  explanations?: string[];
  confidence?: number;
}

const questions: Question[] = [
  {
    id: 1,
    text: 'Что для вас важнее всего в работе?',
    icon: <FaLightbulb />,
    options: [
      { text: 'Забота о здоровье', value: 'health', icon: <FaHeartbeat /> },
      { text: 'Развитие навыков', value: 'education', icon: <FaGraduationCap /> },
      { text: 'Баланс работа-жизнь', value: 'wellness', icon: <FaLeaf /> },
      { text: 'Командная работа', value: 'social', icon: <FaUsers /> }
    ]
  },
  {
    id: 2,
    text: 'Как вы предпочитаете проводить свободное время?',
    icon: <FaClock />,
    options: [
      { text: 'Активный отдых и спорт', value: 'sports', icon: <FaFutbol /> },
      { text: 'Обучение и развитие', value: 'education', icon: <FaGraduationCap /> },
      { text: 'Релаксация и восстановление', value: 'wellness', icon: <FaLeaf /> },
      { text: 'Время с семьей', value: 'social', icon: <FaHandHoldingHeart /> }
    ]
  },
  {
    id: 3,
    text: 'Что вас больше всего беспокоит в рабочем процессе?',
    icon: <FaShieldAlt />,
    options: [
      { text: 'Стресс и усталость', value: 'psychology', icon: <GiBrain /> },
      { text: 'Недостаток времени на обучение', value: 'education', icon: <FaGraduationCap /> },
      { text: 'Проблемы со здоровьем', value: 'health', icon: <FaHeartbeat /> },
      { text: 'Отсутствие мотивации', value: 'wellness', icon: <FaLeaf /> }
    ]
  },
  {
    id: 4,
    text: 'Какая поддержка от компании была бы для вас наиболее ценной?',
    icon: <FaBullseye />,
    options: [
      { text: 'Медицинское страхование', value: 'health', icon: <FaHeartbeat /> },
      { text: 'Психологическая поддержка', value: 'psychology', icon: <GiBrain /> },
      { text: 'Социальные программы', value: 'social', icon: <FaHandHoldingHeart /> },
      { text: 'Корпоративные мероприятия', value: 'wellness', icon: <FaLeaf /> }
    ]
  }
];

// Маппинг ответов теста на конкретные ID льгот
const answerToBenefitMapping: { [key: string]: number[] } = {
  'health': [1, 3, 4, 6], // Профилактика выгорания, Правильное питание, Психологическая поддержка, Здоровые привычки
  'education': [10, 2], // Soft-skills тренинги, Режим дня и баланс работы
  'wellness': [5, 2], // Массаж, Режим дня и баланс работы
  'social': [7, 9], // Командные виды спорта, Тимбилдинг через спорт
  'sports': [7, 8, 9], // Командные виды спорта, Фитнес-программы, Тимбилдинг через спорт
  'psychology': [1, 4] // Профилактика выгорания, Психологическая поддержка
};

// Примеры льгот для каждой конкретной программы
const benefitExamples: { [key: number]: string[] } = {
  1: ['Консультации психолога', 'Программы снижения стресса', 'Тренинги по стрессоустойчивости', 'Медитация'],
  2: ['Тренинги по тайм-менеджменту', 'Консультации по work-life balance', 'Гибкий график работы', 'Удаленная работа'],
  3: ['Консультации нутрициолога', 'Здоровые обеды в офисе', 'Программы питания', 'Витаминные комплексы'],
  4: ['Индивидуальные консультации', 'Группы поддержки', 'Кризисная помощь 24/7', 'Семейная терапия'],
  5: ['Еженедельные сеансы', 'SPA-процедуры', 'Расслабляющие техники', 'Массаж в офисе'],
  6: ['Фитнес-трекеры', 'Программы отказа от курения', 'Здоровый сон', 'Регулярные медосмотры'],
  7: ['Корпоративный футбол', 'Волейбол', 'Баскетбол', 'Командные турниры'],
  8: ['Абонементы в спортзал', 'Персональные тренировки', 'Групповые занятия', 'Йога'],
  9: ['Спортивные квесты', 'Корпоративные соревнования', 'Активный отдых', 'Приключенческие программы'],
  10: ['Коммуникативные навыки', 'Лидерство', 'Эмоциональный интеллект', 'Публичные выступления']
};



const Preferences: React.FC = () => {
  const { user } = useUser();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [savedRecommendations, setSavedRecommendations] = useState<BenefitRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingResults, setHasExistingResults] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // Состояние формы свободных предпочтений
  const [freeText, setFreeText] = useState('');
  const [wantTags, setWantTags] = useState<string[]>([]);
  const [avoidTags, setAvoidTags] = useState<string[]>([]);
  const [formatPref, setFormatPref] = useState<'any' | 'online' | 'offline'>('any');
  const [budgetPref, setBudgetPref] = useState<'any' | 'low' | 'medium' | 'high'>('any');
  const [timePref, setTimePref] = useState<'any' | 'morning' | 'day' | 'evening'>('any');
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  // Загрузка существующих рекомендаций при загрузке компонента
  useEffect(() => {
    const loadExistingRecommendations = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user-recommendations?user_id=${user.id}`);
        const data = await response.json();

        if (data.hasRecommendations && data.recommendations.length > 0) {
          // Конвертируем конкретные льготы в формат для отображения
          const loadedRecommendations = data.recommendations.map((rec: any) => ({
            category: rec.name,
            icon: categoryIcons[rec.category] || <FaBook />,
            title: rec.name,
            description: rec.description,
            examples: benefitExamples[rec.benefit_id] || ['Конкретные программы и услуги', 'Индивидуальный подход', 'Профессиональная поддержка'],
            explanations: Array.isArray(rec.explanations) ? rec.explanations : undefined,
            confidence: typeof rec.confidence === 'number' ? rec.confidence : undefined
          }));

          console.log('Loaded specific benefits for display:', loadedRecommendations);

          setSavedRecommendations(loadedRecommendations);
          setHasExistingResults(true);
          setShowResults(true);
          setShowIntro(false);
        }
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingRecommendations();
  }, [user?.id]);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Тест завершен - показываем результаты и сохраняем в БД
      setShowResults(true);
      saveRecommendationsToDb(newAnswers);
    }
  };

  // Сохранение рекомендаций в БД
  const saveRecommendationsToDb = async (testAnswers: string[]) => {
    if (!user?.id) return;

    try {
      // Подсчитываем "очки" для каждой льготы на основе ответов
      const benefitScores: { [key: number]: number } = {};
      
      testAnswers.forEach(answer => {
        const benefitIds = answerToBenefitMapping[answer] || [];
        benefitIds.forEach(benefitId => {
          benefitScores[benefitId] = (benefitScores[benefitId] || 0) + 1;
        });
      });

      // Сортируем льготы по очкам и берем топ-3
      const recommendedBenefitIds = Object.entries(benefitScores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([benefitId]) => parseInt(benefitId));

      console.log('Answer scores by benefit:', benefitScores);
      console.log('Top 3 recommended benefit IDs:', recommendedBenefitIds);

      // Отправляем в БД конкретные ID льгот
      const response = await fetch('/api/user-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          benefit_ids: recommendedBenefitIds,
          answers: testAnswers
        })
      });

      const result = await response.json();
      console.log('Save result:', result);

      setHasExistingResults(true);
    } catch (error) {
      console.error('Error saving recommendations:', error);
    }
  };

  const getRecommendations = (): BenefitRecommendation[] => {
    // Используем ту же логику, что и в saveRecommendationsToDb
    const benefitScores: { [key: number]: number } = {};
    
    answers.forEach(answer => {
      const benefitIds = answerToBenefitMapping[answer] || [];
      benefitIds.forEach(benefitId => {
        benefitScores[benefitId] = (benefitScores[benefitId] || 0) + 1;
      });
    });

    // Сортируем льготы по очкам и берем топ-3
    const recommendedBenefitIds = Object.entries(benefitScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([benefitId]) => parseInt(benefitId));

    // Создаем заглушки рекомендаций на основе benefit_id
    // В реальном случае здесь должен быть запрос к БД для получения названий
    const mockBenefitNames: { [key: number]: { name: string; description: string; category: string } } = {
      1: { name: 'Профилактика выгорания', description: 'Программы по предотвращению эмоционального выгорания', category: 'Здоровье' },
      2: { name: 'Режим дня и баланс работы', description: 'Помощь в организации рабочего времени', category: 'Обучение' },
      3: { name: 'Правильное питание', description: 'Консультации по здоровому питанию', category: 'Здоровье' },
      4: { name: 'Психологическая поддержка', description: 'Индивидуальные консультации психолога', category: 'Психология' },
      5: { name: 'Массаж', description: 'Релаксационные массажные процедуры', category: 'Отдых' },
      6: { name: 'Здоровые привычки', description: 'Программы формирования здорового образа жизни', category: 'Здоровье' },
      7: { name: 'Командные виды спорта', description: 'Корпоративные спортивные мероприятия', category: 'Спорт' },
      8: { name: 'Фитнес-программы', description: 'Абонементы в спортивные залы', category: 'Спорт' },
      9: { name: 'Тимбилдинг через спорт', description: 'Командообразующие спортивные активности', category: 'Спорт' },
      10: { name: 'Soft-skills тренинги', description: 'Развитие личностных навыков', category: 'Обучение' }
    };

    return recommendedBenefitIds.map(benefitId => {
      const benefit = mockBenefitNames[benefitId] || { name: 'Неизвестная льгота', description: '', category: 'Здоровье' };
      return {
        category: benefit.name,
        icon: categoryIcons[benefit.category] || <FaBook />,
        title: benefit.name,
        description: benefit.description,
        examples: benefitExamples[benefitId] || ['Конкретные программы и услуги', 'Индивидуальный подход', 'Профессиональная поддержка']
      };
    });
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setHasExistingResults(false);
    setSavedRecommendations([]);
    setShowIntro(true);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Сохранение свободных предпочтений
  const handleSaveFreePreferences = async () => {
    if (!user?.id) return;
    setPrefsSaving(true);
    setPrefsSaved(false);
    try {
      const payload = {
        user_id: user.id,
        free_text: freeText,
        tags: wantTags,
        avoid: avoidTags,
        constraints: {
          format: formatPref,
          budget: budgetPref,
          time: timePref
        }
      };
      const res = await fetch('/ai/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save preferences');
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 3000);
      setToastOpen(true);
    } catch (e) {
      console.error('Failed to save free preferences', e);
    } finally {
      setPrefsSaving(false);
    }
  };

  // Компонент формы свободных предпочтений (нижний блок)
  const FreePreferencesForm = () => {
    const presetWant = ['психология', 'спорт', 'обучение', 'онлайн', 'сон'];
    const presetAvoid = ['массаж', 'вечеринки', 'групповые занятия'];
    const pillSx = {
      borderRadius: '14px',
      '& .MuiOutlinedInput-root': {
        borderRadius: '14px',
        background: '#fff',
        transition: 'border-color 180ms ease',
        '& fieldset': { borderColor: '#E5E5E5' },
        '&:hover fieldset': { borderColor: 'rgba(139,0,0,0.35)' },
        '&.Mui-focused fieldset': {
          borderColor: 'rgba(139,0,0,0.6) !important'
        }
      }
    } as const;

    return (
      <Box sx={{ mt: 8 }}>
        <Box
          sx={{
            position: 'relative',
            p: { xs: 3, md: 4 },
            borderRadius: '24px',
            border: '1px solid rgba(139,0,0,0.12)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(249,250,251,0.92) 100%)',
            boxShadow: '0 20px 50px rgba(139,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'absolute', top: -60, left: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(139,0,0,0.06)' }} />
          <Box sx={{ position: 'absolute', bottom: -70, right: -70, width: 200, height: 200, borderRadius: '50%', background: 'rgba(139,0,0,0.05)' }} />

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{
              width: 64,
              height: 64,
              borderRadius: '18px',
              background: 'linear-gradient(180deg, #9C0F0F 0%, #7E0A0A 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              boxShadow: '0 12px 30px rgba(139,0,0,0.25)'
            }}>
              <FaFeatherAlt />
            </Box>
            <Typography variant="h4" sx={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 900, color: '#1A1A1A', mt: 2 }}>
              Свободные предпочтения
            </Typography>
            <Typography variant="h6" sx={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500, color: '#666', maxWidth: '800px', mx: 'auto', mt: 1 }}>
              Расскажите, что важно именно вам — мы учтём это при формировании умных рекомендаций.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Что вам важно?"
                placeholder="Например: хочу онлайн‑психолога, избегаю групповых активностей"
                multiline
                minRows={3}
                fullWidth
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                InputProps={{ startAdornment: (<InputAdornment position="start"><FaFeatherAlt style={{ color: '#8B0000' }} /></InputAdornment>) }}
                sx={pillSx}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Хочу (через запятую)"
                placeholder="психология, спорт, удалёнка"
                fullWidth
                value={wantTags.join(', ')}
                onChange={(e) => setWantTags(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                InputProps={{ startAdornment: (<InputAdornment position="start"><FaTags style={{ color: '#8B0000' }} /></InputAdornment>) }}
                sx={pillSx}
              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {presetWant.map(tag => (
                  <Chip key={tag} label={tag} variant="outlined" onClick={() => !wantTags.includes(tag) && setWantTags([...wantTags, tag])} />
                ))}
                {wantTags.map(tag => (
                  <Chip key={tag} label={tag} color="default" onDelete={() => setWantTags(wantTags.filter(t => t !== tag))} />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Не хочу (через запятую)"
                placeholder="массаж, вечеринки"
                fullWidth
                value={avoidTags.join(', ')}
                onChange={(e) => setAvoidTags(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                InputProps={{ startAdornment: (<InputAdornment position="start"><FaBan style={{ color: '#B00000' }} /></InputAdornment>) }}
                sx={pillSx}
              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {presetAvoid.map(tag => (
                  <Chip key={tag} label={tag} variant="outlined" onClick={() => !avoidTags.includes(tag) && setAvoidTags([...avoidTags, tag])} />
                ))}
                {avoidTags.map(tag => (
                  <Chip key={tag} label={tag} color="default" onDelete={() => setAvoidTags(avoidTags.filter(t => t !== tag))} />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Формат" value={formatPref} onChange={(e) => setFormatPref(e.target.value as any)} sx={pillSx}
                InputProps={{ startAdornment: (<InputAdornment position="start"><FaLaptop style={{ color: '#8B0000' }} /></InputAdornment>) }}>
                <MenuItem value="any">Не важно</MenuItem>
                <MenuItem value="online">Онлайн</MenuItem>
                <MenuItem value="offline">Офлайн</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Бюджет" value={budgetPref} onChange={(e) => setBudgetPref(e.target.value as any)} sx={pillSx}
                InputProps={{ startAdornment: (<InputAdornment position="start"><FaMoneyBillWave style={{ color: '#8B0000' }} /></InputAdornment>) }}>
                <MenuItem value="any">Любой</MenuItem>
                <MenuItem value="low">Низкий</MenuItem>
                <MenuItem value="medium">Средний</MenuItem>
                <MenuItem value="high">Высокий</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Время" value={timePref} onChange={(e) => setTimePref(e.target.value as any)} sx={pillSx}
                InputProps={{ startAdornment: (<InputAdornment position="start"><FaRegClock style={{ color: '#8B0000' }} /></InputAdornment>) }}>
                <MenuItem value="any">Не важно</MenuItem>
                <MenuItem value="morning">Утро</MenuItem>
                <MenuItem value="day">День</MenuItem>
                <MenuItem value="evening">Вечер</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Button
                onClick={handleSaveFreePreferences}
                disabled={prefsSaving}
                sx={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                  color: '#fff',
                  borderRadius: '14px',
                  padding: '14px 32px',
                  fontWeight: 800,
                  textTransform: 'none',
                  boxShadow: '0 16px 40px rgba(139,0,0,0.25)',
                  transition: 'transform 120ms ease, box-shadow 200ms ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #A00000 0%, #D32222 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 24px 50px rgba(139,0,0,0.30)'
                  }
                }}
                startIcon={prefsSaved ? <FaCheck /> : undefined}
              >
                {prefsSaving ? 'Сохранение…' : (prefsSaved ? 'Сохранено' : 'Сохранить предпочтения')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  };

  // Показываем загрузку пока данные загружаются
  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        background: '#f9fafb' 
      }}>
        <CircularProgress sx={{ color: '#8B0000' }} />
      </Box>
    );
  }

  const toast = (
    <Snackbar
      open={toastOpen}
      autoHideDuration={2800}
      onClose={() => setToastOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={() => setToastOpen(false)} severity="success" variant="filled" sx={{ borderRadius: '12px' }}>
        Предпочтения сохранены
      </Alert>
    </Snackbar>
  );

  // Начальный экран с CTA «Пройти тест» и описанием умных рекомендаций
  if (showIntro && !showResults && !hasExistingResults && answers.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', background: '#f9fafb' }}>
        <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Box
                sx={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(139,0,0,0.08), rgba(178,34,34,0.08))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}
              >
                <FaBullseye style={{ color: '#8B0000', fontSize: 40 }} />
              </Box>
              <Typography variant="h3" sx={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 900, color: '#1A1A1A', mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}>
                Умные рекомендации льгот
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500, color: '#666', maxWidth: '700px', mx: 'auto', lineHeight: 1.6 }}>
                ИИ подберёт льготы на основе ваших целей, свободных предпочтений и активности. Советуем чаще писать в свободной форме и логировать активности — так рекомендации будут точнее.
              </Typography>
              <Box sx={{ mt: 4 }}>
                <Button
                  onClick={() => setShowIntro(false)}
                  sx={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '14px 32px',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                    boxShadow: '0 10px 30px rgba(139,0,0,0.25)',
                    '&:hover': { background: 'linear-gradient(135deg, #A00000 0%, #D32222 100%)' }
                  }}
                  startIcon={<FaBullseye />}
                >
                  Пройти тест
                </Button>
              </Box>
            </Box>

            {/* Форма свободных предпочтений внизу начального экрана (без внешней белой карточки) */}
            <Box sx={{ maxWidth: '1000px', mx: 'auto' }}>
              <FreePreferencesForm />
            </Box>
            {toast}
          </motion.div>
        </Container>
      </Box>
    );
  }

  if (showResults) {
    // Используем сохраненные рекомендации если есть, иначе вычисляем новые
    const recommendations = hasExistingResults && savedRecommendations.length > 0 
      ? savedRecommendations 
      : getRecommendations();

    const answerReasonMap: Record<string, string> = {
      health: 'Ответы теста: здоровье',
      education: 'Ответы теста: развитие',
      wellness: 'Ответы теста: баланс',
      social: 'Ответы теста: социальная поддержка',
      sports: 'Ответы теста: спорт',
      psychology: 'Ответы теста: стресс/психология'
    };

    const buildFallbackExplanations = (): string[] => {
      const reasons: string[] = [];
      // из ответов теста берем последние 2 уникальные
      const uniqueAns = Array.from(new Set(answers.slice(-3)));
      uniqueAns.forEach(a => {
        if (answerReasonMap[a]) reasons.push(answerReasonMap[a]);
      });
      // из свободных предпочтений добавим 1–2 причины
      if (wantTags.length > 0) reasons.push(`Теги: ${wantTags.slice(0, 2).join(', ')}`);
      if (formatPref !== 'any') reasons.push(`Формат: ${formatPref === 'online' ? 'онлайн' : 'офлайн'}`);
      if (budgetPref !== 'any') reasons.push(`Бюджет: ${budgetPref}`);
      if (timePref !== 'any') reasons.push(`Время: ${timePref}`);
      if (reasons.length === 0 && freeText.trim()) reasons.push('Учтены свободные предпочтения');
      return reasons.slice(0, 3);
    };
    
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
                <FaBullseye />
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
              Ваши рекомендации готовы!
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
                Основываясь на ваших ответах, мы подобрали льготы, которые лучше всего подходят именно вам
              </Typography>
            </Box>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 3,
                justifyContent: 'center',
                mb: 6
              }}>
                {recommendations.map((rec) => (
                  <motion.div
                    key={rec.category}
                    variants={itemVariants}
                    whileHover={{ 
                      y: -8, 
                      borderRadius: '16px',
                      boxShadow: '0 20px 40px rgba(139,0,0,0.15)' 
                    }}
                    style={{ 
                      flex: '1 1 300px',
                      maxWidth: '360px',
                      minWidth: '300px',
                      borderRadius: '16px'
                    }}
                  >
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        ...cardStyle,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '16px',
                          backgroundColor: 'rgba(139, 0, 0, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 3,
                          '& svg': {
                            fontSize: '28px',
                            color: '#8B0000'
                          }
                        }}
                      >
                        {rec.icon}
                      </Box>
                      
                      <Typography
                        variant="h5"
                        sx={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                          fontWeight: 800,
                          color: '#1A1A1A',
                          mb: 2
                        }}
                      >
                        {rec.title}
                      </Typography>
                      
                      <Typography
                        sx={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                          fontWeight: 500,
                          color: '#666',
                          mb: 3,
                          lineHeight: 1.6
                        }}
                      >
                        {rec.description}
                      </Typography>
                      
                      {(() => {
                        const reasons = Array.isArray((rec as any).explanations) && (rec as any).explanations.length > 0 
                          ? (rec as any).explanations
                          : buildFallbackExplanations();
                        if (!reasons || reasons.length === 0) return null;
                        return (
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#8B0000', fontWeight: 700, mb: 1 }}
                          >
                            Почему подобрано:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {reasons.map((e: string, idx: number) => (
                              <Chip key={idx} label={e} size="small" sx={{ borderRadius: '10px' }} />
                            ))}
                          </Box>
                        </Box>
                        );
                      })()}

                      {typeof (rec as any).confidence === 'number' && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: '#666', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600 }}>
                            Уверенность: {Math.round(((rec as any).confidence as number) * 100)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.max(0, Math.min(100, ((rec as any).confidence as number) * 100))}
                            sx={{ height: 6, borderRadius: 3, mt: 0.5, '& .MuiLinearProgress-bar': { background: 'linear-gradient(45deg, #8B0000, #B22222)' } }}
                          />
                        </Box>
                      )}

                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontFamily: 'Inter, system-ui, sans-serif',
                            color: '#8B0000',
                            fontWeight: 700,
                            mb: 1
                          }}
                        >
                          Примеры льгот:
                        </Typography>
                        {rec.examples.map((example, idx) => (
                          <Typography
                            key={idx}
                            variant="body2"
                            sx={{
                              fontFamily: 'Inter, system-ui, sans-serif',
                              fontWeight: 500,
                              color: '#555',
                              fontSize: '0.9rem',
                              mb: 0.5,
                              '&::before': {
                                content: '"•"',
                                color: '#8B0000',
                                marginRight: '8px'
                              }
                            }}
                          >
                            {example}
                          </Typography>
                        ))}
                      </Box>
                    </Paper>
                  </motion.div>
                ))}
              </Box>
            </motion.div>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                onClick={resetTest}
                sx={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                  color: '#fff',
                  borderRadius: '50px',
                  padding: '12px 36px',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  boxShadow: '0 10px 30px rgba(139,0,0,0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #A00000 0%, #D32222 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(139,0,0,0.3)'
                  }
                }}
                startIcon={<FaRedo />}
              >
                Пройти тест заново
              </Button>
            </Box>

            {/* Форма свободных предпочтений под результатами (без внешней белой карточки) */}
            <Box sx={{ mt: 6 }}>
              <FreePreferencesForm />
            </Box>
            {toast}
          </motion.div>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f9fafb', pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="md">
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
              <FaBullseye />
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
              Умные рекомендации льгот
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 500,
                color: '#666',
                maxWidth: '500px',
                mx: 'auto',
                lineHeight: 1.6,
                mb: 4
              }}
            >
              Ответьте на 4 вопроса — ИИ подберёт льготы под ваши цели и контекст
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#E5E5E5',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(45deg, #8B0000, #B22222)',
                    borderRadius: 4
                  }
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  color: '#8B0000',
                  fontWeight: 700,
                  mt: 1
                }}
              >
                Вопрос {currentQuestion + 1} из {questions.length}
              </Typography>
            </Box>
          </Box>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Paper
                elevation={0}
                sx={{
                  ...cardStyle,
                  textAlign: 'center',
                  maxWidth: '760px',
                  mx: 'auto',
                  borderRadius: '24px',
                  border: '1px solid rgba(139,0,0,0.12)',
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(249,250,251,0.96) 100%)',
                  boxShadow: '0 20px 50px rgba(139,0,0,0.08)'
                }}
              >
                <Box
                  sx={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(139, 0, 0, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    '& svg': {
                      fontSize: '28px',
                      color: '#8B0000'
                    }
                  }}
                >
                  {questions[currentQuestion].icon}
                </Box>
                
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontWeight: 800,
                    color: '#1A1A1A',
                    mb: 4,
                    lineHeight: 1.4
                  }}
                >
                  {questions[currentQuestion].text}
                </Typography>

                <Grid container spacing={3}>
                  {questions[currentQuestion].options.map((option, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <motion.div
                        whileHover={{ y: -4, borderRadius: '16px' }}
                        whileTap={{ scale: 0.98 }}
                        style={{ borderRadius: '16px' }}
                      >
                        <Button
                          onClick={() => handleAnswer(option.value)}
                          sx={{
                            fontFamily: 'Inter, system-ui, sans-serif',
                            width: '100%',
                            height: '100px',
                            padding: '20px 18px',
                            borderRadius: '18px',
                            border: '1px solid #E5E5E5',
                            background:
                              'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(249,250,251,1) 100%)',
                            color: '#1A1A1A',
                            textTransform: 'none',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            gap: 2,
                            transition: 'none',
                            '&:hover': {
                              background:
                                'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(253,243,243,1) 100%)',
                              borderColor: 'rgba(139,0,0,0.35)',
                              boxShadow: '0 10px 24px rgba(139,0,0,0.12)'
                            }
                          }}
                        >
                          <Box
                            sx={{
                              color: '#8B0000',
                              '& svg': { fontSize: '22px' }
                            }}
                          >
                            {option.icon}
                          </Box>
                          <Typography sx={{ 
                            fontFamily: 'Inter, system-ui, sans-serif',
                            fontWeight: 700,
                            fontSize: '1.05rem', 
                            textAlign: 'left' 
                          }}>
                            {option.text}
                          </Typography>
                        </Button>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </Container>
      {toast}
    </Box>
  );
};

export default Preferences; 