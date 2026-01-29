import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider
} from '@mui/material';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  LayoutDashboard,
  FileText,
  Gift,
  Coins,
  Sparkles
} from 'lucide-react';

interface WelcomeTourProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TOUR_STEPS = [
  {
    title: 'Добро пожаловать в Yoddle',
    description: 'Yoddle — платформа для управления корпоративными льготами с элементами геймификации и AI-рекомендаций. Давайте познакомимся с основными функциями платформы.',
    icon: Sparkles,
    color: '#750000',
    roadmapLabel: 'Приветствие'
  },
  {
    title: 'Dashboard — ваш центр управления',
    description: 'Здесь вы видите свой прогресс, баланс коинов, последние новости и быстрый доступ ко всем функциям платформы. Все важные данные собраны в одном месте.',
    icon: LayoutDashboard,
    color: '#750000',
    roadmapLabel: 'Dashboard'
  },
  {
    title: 'Продуктивность',
    description: 'Регулярно записывайте своё настроение и активность. Это помогает AI анализировать ваше состояние и давать персональные рекомендации для улучшения самочувствия.',
    icon: FileText,
    color: '#750000',
    roadmapLabel: 'Продуктивность'
  },
  {
    title: 'Выбор льгот',
    description: 'Выбирайте льготы из каталога: здоровье, спорт, обучение. AI подскажет наиболее подходящие варианты на основе ваших предпочтений и поведения.',
    icon: Gift,
    color: '#750000',
    roadmapLabel: 'Льготы'
  },
  {
    title: 'Баланс',
    description: 'Используйте коины для покупки льгот. Коины начисляются каждый месяц и за активность. Вы можете потратить их на любые доступные льготы из каталога.',
    icon: Coins,
    color: '#750000',
    roadmapLabel: 'Баланс'
  }
];

const WelcomeTour: React.FC<WelcomeTourProps> = ({ open, onClose, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    if (activeStep < TOUR_STEPS.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSkip = (e?: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (e) {
      e.stopPropagation();
    }
    handleComplete();
  };

  const handleComplete = () => {
    setActiveStep(0);
    onComplete();
  };

  const currentStep = TOUR_STEPS[activeStep];
  const IconComponent = currentStep.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            // Закрываем только при клике на фон, не на само модальное окно
            if (e.target === e.currentTarget) {
              handleSkip(e);
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
              e.stopPropagation();
            }}
            style={{
              width: '100%',
              maxWidth: '600px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 6px 24px rgba(117, 0, 0, 0.15), 0 1.5px 6px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #8B0000 0%, #750000 100%)',
                color: 'white',
                p: 3,
                position: 'relative',
                overflow: 'hidden'
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
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <IconComponent size={28} color="white" />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 600,
                        fontSize: '1.5rem',
                        mb: 0.5,
                        color: 'white'
                      }}
                    >
                      {currentStep.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: '0.875rem'
                      }}
                    >
                      Шаг {activeStep + 1} из {TOUR_STEPS.length}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    handleSkip(e);
                  }}
                  sx={{
                    minWidth: 'auto',
                    color: 'white',
                    '&:hover': { 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px'
                    },
                    p: 1
                  }}
                >
                  <X size={24} />
                </Button>
              </Box>
            </Box>

            {/* Content */}
            <DialogContent sx={{ p: 4 }}>
              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  backgroundColor: '#F8F8F8',
                  borderRadius: '8px',
                  border: '1px solid rgba(117, 0, 0, 0.08)'
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.125rem',
                    lineHeight: 1.7,
                    color: '#333',
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                  }}
                >
                  {currentStep.description}
                </Typography>
              </Paper>

              <Stepper 
                activeStep={activeStep} 
                alternativeLabel
                sx={{
                  mt: 2,
                  '& .MuiStepLabel-root': {
                    '& .MuiStepLabel-label': {
                      fontSize: '0.75rem',
                      fontWeight: activeStep >= 0 ? 500 : 400,
                      color: activeStep >= 0 ? '#750000' : '#999',
                      '&.Mui-active': {
                        color: '#750000',
                        fontWeight: 600
                      },
                      '&.Mui-completed': {
                        color: '#750000'
                      }
                    }
                  },
                  '& .MuiStepIcon-root': {
                    color: '#E0E0E0',
                    '&.Mui-active': {
                      color: '#750000'
                    },
                    '&.Mui-completed': {
                      color: '#750000'
                    }
                  }
                }}
              >
                {TOUR_STEPS.map((step, index) => (
                  <Step key={index}>
                    <StepLabel>
                      {step.roadmapLabel}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </DialogContent>

            <Divider />

            {/* Actions */}
            <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
              <Button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  handleSkip(e);
                }}
                sx={{
                  color: '#666',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: '#F5F5F5',
                    color: '#333'
                  }
                }}
              >
                Пропустить тур
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeStep > 0 && (
                  <Button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      handleBack();
                    }}
                    startIcon={<ArrowLeft size={20} />}
                    sx={{
                      color: '#750000',
                      borderColor: '#750000',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 500,
                      px: 3,
                      '&:hover': {
                        backgroundColor: 'rgba(117, 0, 0, 0.05)',
                        borderColor: '#600000'
                      }
                    }}
                    variant="outlined"
                  >
                    Назад
                  </Button>
                )}
                <Button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  endIcon={activeStep < TOUR_STEPS.length - 1 ? <ArrowRight size={20} /> : null}
                  variant="contained"
                  sx={{
                    backgroundColor: '#750000',
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    px: 3,
                    borderRadius: '8px',
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: '#600000',
                      boxShadow: '0 4px 12px rgba(117, 0, 0, 0.2)'
                    }
                  }}
                >
                  {activeStep < TOUR_STEPS.length - 1 ? 'Далее' : 'Завершить'}
                </Button>
              </Box>
            </DialogActions>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeTour;
