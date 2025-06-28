import React, { useState } from 'react';
import { Container, Typography, Box, Grid, Paper, Button, LinearProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeartbeat, FaFutbol, FaGraduationCap, FaUsers, FaHandHoldingHeart, FaLeaf, FaRedo, FaLightbulb, FaClock, FaShieldAlt, FaBullseye } from 'react-icons/fa';
import { GiBrain } from 'react-icons/gi';

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

const benefitCategories: { [key: string]: BenefitRecommendation } = {
  health: {
    category: 'Здоровье',
    icon: <FaHeartbeat />,
    title: 'Забота о здоровье',
    description: 'Медицинские программы и услуги для поддержания вашего здоровья',
    examples: ['Медицинское страхование', 'Стоматологические услуги', 'Профилактические осмотры', 'Льготы на лекарства']
  },
  sports: {
    category: 'Спорт',
    icon: <FaFutbol />,
    title: 'Активный образ жизни',
    description: 'Спортивные программы и фитнес для поддержания формы',
    examples: ['Абонементы в спортзал', 'Корпоративные турниры', 'Занятия йогой', 'Спортивное оборудование']
  },
  education: {
    category: 'Обучение',
    icon: <FaGraduationCap />,
    title: 'Профессиональное развитие',
    description: 'Образовательные программы и курсы для роста компетенций',
    examples: ['Онлайн курсы', 'Профессиональные тренинги', 'Языковые программы', 'Сертификации']
  },
  psychology: {
    category: 'Психология',
    icon: <GiBrain />,
    title: 'Ментальное здоровье',
    description: 'Психологическая поддержка и программы против стресса',
    examples: ['Консультации психолога', 'Программы снижения стресса', 'Медитация', 'Work-life balance']
  },
  social: {
    category: 'Социальная поддержка',
    icon: <FaHandHoldingHeart />,
    title: 'Социальные программы',
    description: 'Поддержка семьи и социальные инициативы',
    examples: ['Помощь семьям', 'Детские программы', 'Волонтерство', 'Корпоративные события']
  },
  wellness: {
    category: 'Отдых',
    icon: <FaLeaf />,
    title: 'Отдых и восстановление',
    description: 'Программы для релаксации и восстановления сил',
    examples: ['Спа-процедуры', 'Массаж', 'Отпускные программы', 'Санаторно-курортное лечение']
  }
};

const Preferences: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const getRecommendations = (): BenefitRecommendation[] => {
    const scores: { [key: string]: number } = {};
    
    answers.forEach(answer => {
      scores[answer] = (scores[answer] || 0) + 1;
    });

    const sortedCategories = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => benefitCategories[category])
      .filter(Boolean);

    // Добавляем популярные категории если недостаточно
    const fallbackCategories = ['health', 'education', 'wellness'];
    const additionalCategories = fallbackCategories
      .filter(cat => !sortedCategories.find(rec => rec.category === benefitCategories[cat].category))
      .map(cat => benefitCategories[cat])
      .slice(0, 3 - sortedCategories.length);

    return [...sortedCategories, ...additionalCategories];
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (showResults) {
    const recommendations = getRecommendations();
    
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
                            minHeight: '80px',
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