import React, { useState } from 'react';
import { Box, Container, Typography, Card, CardContent, Button, Radio, RadioGroup, FormControlLabel, FormControl, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';

interface Question {
  id: number;
  question: string;
  options: { value: string; label: string; emoji: string }[];
}

const questions: Question[] = [
  {
    id: 1,
    question: "Что для вас важнее всего в работе?",
    options: [
      { value: "health", label: "Здоровье и благополучие", emoji: "🏥" },
      { value: "growth", label: "Развитие и обучение", emoji: "📚" },
      { value: "balance", label: "Баланс работы и жизни", emoji: "⚖️" },
      { value: "finance", label: "Финансовая стабильность", emoji: "💰" }
    ]
  },
  {
    id: 2,
    question: "Как вы предпочитаете проводить свободное время?",
    options: [
      { value: "sport", label: "Спорт и фитнес", emoji: "🏃‍♂️" },
      { value: "family", label: "Время с семьей", emoji: "👨‍👩‍👧‍👦" },
      { value: "travel", label: "Путешествия", emoji: "✈️" },
      { value: "culture", label: "Культурные мероприятия", emoji: "🎭" }
    ]
  },
  {
    id: 3,
    question: "Что вас больше всего мотивирует?",
    options: [
      { value: "recognition", label: "Признание достижений", emoji: "🏆" },
      { value: "flexibility", label: "Гибкость в работе", emoji: "🔄" },
      { value: "team", label: "Работа в команде", emoji: "👥" },
      { value: "innovation", label: "Инновации и творчество", emoji: "💡" }
    ]
  },
  {
    id: 4,
    question: "Какой тип поддержки вам нужен больше всего?",
    options: [
      { value: "medical", label: "Медицинская поддержка", emoji: "🩺" },
      { value: "educational", label: "Образовательная поддержка", emoji: "🎓" },
      { value: "social", label: "Социальная поддержка", emoji: "🤝" },
      { value: "financial", label: "Финансовая поддержка", emoji: "💳" }
    ]
  }
];

const Preferences: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const restartTest = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const getRecommendations = () => {
    const values = Object.values(answers);
    const healthCount = values.filter(v => ['health', 'medical', 'sport'].includes(v)).length;
    const growthCount = values.filter(v => ['growth', 'educational', 'innovation'].includes(v)).length;
    const balanceCount = values.filter(v => ['balance', 'family', 'flexibility'].includes(v)).length;
    const financeCount = values.filter(v => ['finance', 'financial'].includes(v)).length;

    if (healthCount >= 2) return { type: "Здоровье и благополучие", emoji: "🏥", benefits: ["Медицинское страхование", "Фитнес-абонементы", "Массаж и SPA"] };
    if (growthCount >= 2) return { type: "Развитие и карьера", emoji: "📚", benefits: ["Курсы и тренинги", "Конференции", "Коучинг"] };
    if (balanceCount >= 2) return { type: "Work-Life Balance", emoji: "⚖️", benefits: ["Гибкий график", "Удаленная работа", "Дополнительные выходные"] };
    if (financeCount >= 2) return { type: "Финансовые льготы", emoji: "💰", benefits: ["Бонусы", "Компенсации", "Накопительные программы"] };
    
    return { type: "Комплексный пакет", emoji: "🌟", benefits: ["Смешанный пакет льгот", "Персональный подход", "Гибкие условия"] };
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (showResults) {
    const recommendation = getRecommendations();
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Card sx={{ p: 4, textAlign: 'center', border: '3px solid #750000' }}>
            <Typography variant="h3" sx={{ mb: 2, color: '#750000' }}>
              🎉 РЕЗУЛЬТАТЫ ТЕСТА ✅
            </Typography>
            <Typography variant="h4" sx={{ mb: 3, color: '#333' }}>
              {recommendation.emoji} {recommendation.type}
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: '#666', fontSize: '1.1rem' }}>
              Основываясь на ваших ответах, мы рекомендуем следующие льготы:
            </Typography>
            <Box sx={{ mb: 4 }}>
              {recommendation.benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      p: 2, 
                      backgroundColor: '#f8f8f8', 
                      borderRadius: 2,
                      color: '#750000',
                      fontWeight: 600
                    }}
                  >
                    ✅ {benefit}
                  </Typography>
                </motion.div>
              ))}
            </Box>
            <Button
              variant="contained"
              size="large"
              onClick={restartTest}
              sx={{
                backgroundColor: '#750000',
                '&:hover': { backgroundColor: '#8B0000' },
                px: 4,
                py: 1.5,
                mr: 2
              }}
            >
              🔄 Пройти тест заново
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: '#750000',
                color: '#750000',
                px: 4,
                py: 1.5
              }}
            >
              📋 Сохранить предпочтения
            </Button>
          </Card>
        </motion.div>
      </Container>
    );
  }

  const question = questions[currentQuestion];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ mb: 2, color: '#750000', fontWeight: 700 }}>
            🎯 ТЕСТ ПРЕДПОЧТЕНИЙ ЛЬГОТ ✅
          </Typography>
          <Typography variant="h6" sx={{ color: '#666', mb: 3 }}>
            Узнайте, какие льготы подходят именно вам
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: '#f0f0f0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#750000'
              }
            }} 
          />
          <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
            Вопрос {currentQuestion + 1} из {questions.length}
          </Typography>
        </Box>

        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
        >
          <Card sx={{ p: 4, border: '2px solid #750000' }}>
            <Typography variant="h5" sx={{ mb: 4, color: '#333', fontWeight: 600, textAlign: 'center' }}>
              {question.question}
            </Typography>
            
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <RadioGroup
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
              >
                {question.options.map((option, index) => (
                  <motion.div
                    key={option.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <FormControlLabel
                      value={option.value}
                      control={<Radio sx={{ color: '#750000', '&.Mui-checked': { color: '#750000' } }} />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                          <Typography variant="h6" sx={{ mr: 2 }}>
                            {option.emoji}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {option.label}
                          </Typography>
                        </Box>
                      }
                      sx={{
                        width: '100%',
                        m: 0,
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid #e0e0e0',
                        mb: 2,
                        '&:hover': {
                          backgroundColor: '#f8f8f8',
                          borderColor: '#750000'
                        },
                        '&.Mui-checked': {
                          backgroundColor: '#fff5f5',
                          borderColor: '#750000'
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </RadioGroup>
            </FormControl>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                variant="outlined"
                sx={{
                  borderColor: '#750000',
                  color: '#750000',
                  '&:disabled': { opacity: 0.5 }
                }}
              >
                ← Назад
              </Button>
              <Button
                onClick={handleNext}
                disabled={!answers[question.id]}
                variant="contained"
                sx={{
                  backgroundColor: '#750000',
                  '&:hover': { backgroundColor: '#8B0000' },
                  '&:disabled': { opacity: 0.5 }
                }}
              >
                {currentQuestion === questions.length - 1 ? 'Получить результат' : 'Далее →'}
              </Button>
            </Box>
          </Card>
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default Preferences; 