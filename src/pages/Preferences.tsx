import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, Button, LinearProgress, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeartbeat, FaFutbol, FaGraduationCap, FaUsers, FaHandHoldingHeart, FaLeaf, FaRedo, FaLightbulb, FaClock, FaShieldAlt, FaBullseye, FaBook } from 'react-icons/fa';
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



const Preferences: React.FC = () => {
  const { user } = useUser();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [savedRecommendations, setSavedRecommendations] = useState<BenefitRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingResults, setHasExistingResults] = useState(false);

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
            examples: [rec.category] // Показываем категорию как пример
          }));

          console.log('Loaded specific benefits for display:', loadedRecommendations);

          setSavedRecommendations(loadedRecommendations);
          setHasExistingResults(true);
          setShowResults(true);
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
        examples: [benefit.category]
      };
    });
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setHasExistingResults(false);
    setSavedRecommendations([]);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

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

  if (showResults) {
    // Используем сохраненные рекомендации если есть, иначе вычисляем новые
    const recommendations = hasExistingResults && savedRecommendations.length > 0 
      ? savedRecommendations 
      : getRecommendations();
    
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
                  background: 'linear-gradient(45deg, #8B0000, #B22222)',
                  color: '#fff',
                  borderRadius: '50px',
                  padding: '12px 36px',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 15px rgba(139,0,0,0.2)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #A00000, #D32222)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(139,0,0,0.3)'
                  }
                }}
                startIcon={<FaRedo />}
              >
                Пройти тест заново
              </Button>
            </Box>
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
              Тест на льготы
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
              Ответьте на несколько вопросов, и мы подберем льготы специально для вас
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
              <Paper elevation={0} sx={{ ...cardStyle, textAlign: 'center', maxWidth: '700px', mx: 'auto' }}>
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
                        whileHover={{ 
                          scale: 1.02,
                          borderRadius: '16px'
                        }}
                        whileTap={{ scale: 0.98 }}
                        style={{ borderRadius: '16px' }}
                      >
                        <Button
                          onClick={() => handleAnswer(option.value)}
                          sx={{
                            fontFamily: 'Inter, system-ui, sans-serif',
                            width: '100%',
                            height: '100px',
                            padding: '20px 16px',
                            borderRadius: '16px',
                            border: '1px solid #E5E5E5',
                            backgroundColor: '#fff',
                            color: '#1A1A1A',
                            textTransform: 'none',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            gap: 2,
                            transition: 'none',
                            '&:hover': {
                              backgroundColor: 'rgba(139, 0, 0, 0.05)',
                              borderColor: '#8B0000',
                              boxShadow: '0 4px 15px rgba(139,0,0,0.1)',
                              transform: 'none'
                            }
                          }}
                        >
                          <Box
                            sx={{
                              color: '#8B0000',
                              '& svg': { fontSize: '20px' }
                            }}
                          >
                            {option.icon}
                          </Box>
                          <Typography sx={{ 
                            fontFamily: 'Inter, system-ui, sans-serif',
                            fontWeight: 700,
                            fontSize: '1rem', 
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
    </Box>
  );
};

export default Preferences; 