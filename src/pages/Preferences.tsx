import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, Button, LinearProgress, CircularProgress, TextField, Chip, MenuItem, InputAdornment, Divider, Snackbar, Alert, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeartbeat, FaFutbol, FaGraduationCap, FaUsers, FaHandHoldingHeart, FaLeaf, FaRedo, FaLightbulb, FaClock, FaShieldAlt, FaBullseye, FaBook, FaFeatherAlt, FaTags, FaBan, FaLaptop, FaMoneyBillWave, FaRegClock, FaCheck, FaThumbsUp, FaThumbsDown, FaSpinner, FaTimes } from 'react-icons/fa';
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
  // AI поля - теперь всегда присутствуют
  explanations: string[];
  confidence: number;
  score?: number;
  algorithm_variant?: string;
  benefit_id?: number; // для отправки фидбека
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

  // Состояние фидбека
  const [feedbackSending, setFeedbackSending] = useState<{[key: number]: boolean}>({});
  const [feedbackSent, setFeedbackSent] = useState<{[key: number]: string}>({});
  const [feedbackAnimating, setFeedbackAnimating] = useState<{[key: number]: boolean}>({});
  const [feedbackPermanent, setFeedbackPermanent] = useState<{[key: number]: string}>({});

  // Состояния для AI анализа
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [aiRecommendationsReport, setAiRecommendationsReport] = useState<string | null>(null);
  const [aiProgress, setAiProgress] = useState<string>('Подготовка...');

  // Загрузка всех существующих данных при загрузке компонента
  useEffect(() => {
    const loadAllExistingData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      console.log('🔄 Загружаем все существующие данные для пользователя', user.id);

      try {
        // Параллельная загрузка всех данных
        const [recsResponse, feedbackResponse, preferencesResponse] = await Promise.all([
          // 1. Загружаем AI рекомендации
          fetch(`/api/ai/recommendations?user_id=${user.id}`),
          // 2. Загружаем feedback (оценки)
          fetch(`/api/recommendations-feedback?user_id=${user.id}&action=get`),
          // 3. Загружаем свободные предпочтения
          fetch(`/api/ai-preferences?user_id=${user.id}&action=get`)
        ]);

        // Обрабатываем рекомендации
        if (recsResponse.ok) {
          const recsData = await recsResponse.json();
          
          if (recsData.hasRecommendations && recsData.recommendations.length > 0) {
            console.log('📋 Загружены AI рекомендации:', recsData.recommendations.length);
            
            const loadedRecommendations = recsData.recommendations.map((rec: any) => ({
              category: rec.name,
              icon: categoryIcons[rec.category] || <FaBook />,
              title: rec.name,
              description: rec.description,
              examples: benefitExamples[rec.benefit_id] || ['Конкретные программы и услуги', 'Индивидуальный подход', 'Профессиональная поддержка'],
              explanations: Array.isArray(rec.explanations) && rec.explanations.length > 0 
                ? rec.explanations 
                : ['AI анализ', 'персональный подбор'],
              confidence: typeof rec.confidence === 'number' ? rec.confidence : 0.8,
              score: rec.score || 0.8,
              algorithm_variant: rec.algorithm_variant || 'hybrid_v1',
              benefit_id: rec.benefit_id
            }));

            setSavedRecommendations(loadedRecommendations);
            setHasExistingResults(true);
            setShowResults(true);
            setShowIntro(false);
          }
        }

        // Обрабатываем feedback (оценки)
        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json();
          
          if (feedbackData.success && feedbackData.feedback?.length > 0) {
            console.log('👍 Загружены оценки:', feedbackData.feedback.length);
            
            const permanentFeedback: {[key: number]: string} = {};
            const sentFeedback: {[key: number]: string} = {};
            
            feedbackData.feedback.forEach((fb: any) => {
              if (fb.benefit_id && fb.label) {
                permanentFeedback[fb.benefit_id] = fb.label;
                sentFeedback[fb.benefit_id] = fb.label;
              }
            });
            
            setFeedbackPermanent(permanentFeedback);
            setFeedbackSent(sentFeedback);
            console.log('✅ Восстановлены оценки для льгот:', Object.keys(permanentFeedback));
          }
        }

        // Обрабатываем свободные предпочтения
        if (preferencesResponse.ok) {
          const prefsData = await preferencesResponse.json();
          
          if (prefsData.success && prefsData.preferences) {
            console.log('🏷️ Загружены предпочтения:', prefsData.preferences);
            
            const prefs = prefsData.preferences;
            if (prefs.free_text) setFreeText(prefs.free_text);
            if (Array.isArray(prefs.tags)) setWantTags(prefs.tags);
            if (Array.isArray(prefs.avoid)) setAvoidTags(prefs.avoid);
            if (prefs.constraints?.format) setFormatPref(prefs.constraints.format);
            if (prefs.constraints?.budget) setBudgetPref(prefs.constraints.budget);
            if (prefs.constraints?.time) setTimePref(prefs.constraints.time);
            
            console.log('✅ Восстановлены предпочтения');
          }
        }

        // Загружаем AI отчет (персональные рекомендации)
        try {
          const aiReportResponse = await fetch(`/api/ai/insights?userId=${user.id}&type=personal_recommendations`);
          if (aiReportResponse.ok) {
            const reportData = await aiReportResponse.json();
            
            if (reportData.success && reportData.insights?.length > 0) {
              // Берем последний AI отчет
              const latestReport = reportData.insights[0];
              if (latestReport.content) {
                setAiRecommendationsReport(latestReport.content);
                console.log('📊 Загружен AI отчет');
              }
            }
          }
        } catch (reportError) {
          console.warn('⚠️ Не удалось загрузить AI отчет:', reportError);
        }
        
      } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllExistingData();
  }, [user?.id]);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Тест завершен - сначала AI анализ, потом результаты
      saveRecommendationsToDb(newAnswers);
      performAiAnalysis();
      // НЕ показываем результаты сразу - ждем завершения AI анализа
    }
  };

  // AI анализ результатов теста - РАЗБИТЫЙ НА ЭТАПЫ
  const performAiAnalysis = async () => {
    if (!user?.id) {
      console.error('❌ User ID отсутствует, не можем выполнить анализ');
      // Все равно показываем результаты с базовыми рекомендациями
      setShowResults(true);
      return;
    }

    console.log('🧠 Начинаем AI анализ для пользователя', user.id);
    
    // Сразу показываем модалку
    setAiAnalyzing(true);
    setShowAiModal(true);
    setAiProgress('Начинаем анализ...');

    try {
      // ЭТАП 1: Сохранение предпочтений (быстро, не критично)
      setAiProgress('Сохраняем предпочтения...');
      try {
        await saveUserPreferences();
      } catch (prefError) {
        console.warn('⚠️ Предпочтения не сохранены:', prefError);
      }
      
      // ЭТАП 2: Генерация AI рекомендаций (медленно, может упасть)
      setAiProgress('Генерируем AI рекомендации...');
      try {
        await generateAiRecommendations();
      } catch (aiError) {
        console.warn('⚠️ AI генерация не удалась:', aiError);
        setAiAnalysisResult('ИИ обрабатывает данные в фоне! Показываем статические результаты...');
      }
      
      // ЭТАП 3: Ожидание и загрузка результатов (может не найти)
      setAiProgress('Загружаем результаты...');
      try {
        await waitAndLoadRecommendations();
      } catch (loadError) {
        console.warn('⚠️ Загрузка AI результатов не удалась:', loadError);
      }
      
      // ЭТАП 4: Показ результатов (ВСЕГДА работает)
      setAiProgress('Готово! Показываем результаты...');
      console.log('🎉 Показываем результаты пользователю');
      
      // Гарантируем, что результаты всегда показываются
      setShowResults(true);
      setShowIntro(false);
      
    } catch (error) {
      console.error('❌ Критическая ошибка AI Analysis:', error);
      setAiAnalysisResult('ИИ обрабатывает ваши данные. Рекомендации появятся через несколько секунд...');
      
      // EMERGENCY: всегда показываем хоть что-то
      console.log('🚨 EMERGENCY: Показываем результаты принудительно');
      setShowResults(true);
      setShowIntro(false);
    } finally {
      setAiAnalyzing(false);
      // Автоматически закрываем модалку
      setTimeout(() => {
        setShowAiModal(false);
      }, 1500);
    }
  };

  // ЭТАП 1: Сохранение предпочтений (быстро)
  const saveUserPreferences = async () => {
    if (!user?.id || (!freeText && wantTags.length === 0 && avoidTags.length === 0)) {
      return;
    }

    console.log('💾 Сохраняем свободные предпочтения...');
    
    try {
      await fetch('/api/ai-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          free_text: freeText,
          tags: wantTags,
          avoid: avoidTags,
          constraints: {
            format: formatPref,
            budget: budgetPref,
            time: timePref
          }
        })
      });
      console.log('✅ Предпочтения сохранены');
    } catch (error) {
      console.error('⚠️ Ошибка сохранения предпочтений:', error);
    }
  };

  // ЭТАП 2: Генерация AI рекомендаций (с timeout)
  const generateAiRecommendations = async () => {
    if (!user?.id) return;

    console.log('🤖 Запускаем генерацию гибридных рекомендаций...');
    
    try {
      // Создаем timeout для защиты от зависания
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI timeout')), 15000) // 15 секунд максимум
      );

      // Запускаем оба запроса ПАРАЛЛЕЛЬНО с timeout защитой
      const result = await Promise.race([
        Promise.all([
          fetch('/api/ai/recommendations/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              variant: 'hybrid_v1'
            })
          }),
          fetch('/api/ai/generate-personal-recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id
            })
          })
        ]),
        timeout
      ]) as [Response, Response];

      const [hybridResponse, reportResponse] = result;

      const [hybridResult, reportResult] = await Promise.all([
        hybridResponse.json(),
        reportResponse.json()
      ]);

      console.log('📊 Гибридные рекомендации:', hybridResult.success);
      console.log('📋 Персональный отчет:', reportResult.success);

      // Устанавливаем результаты
      if (hybridResult.success) {
        setAiAnalysisResult('ИИ успешно проанализировал ваши предпочтения и сгенерировал персональные рекомендации!');
      } else {
        setAiAnalysisResult('ИИ проанализировал ваши ответы! Генерируем персональные рекомендации...');
      }

      if (reportResult.success && reportResult.recommendations) {
        setAiRecommendationsReport(reportResult.recommendations);
      }
      
    } catch (error) {
      console.error('⚠️ Ошибка генерации AI:', error);
      if (error instanceof Error && error.message === 'AI timeout') {
        console.log('⏰ AI запросы превысили timeout, продолжаем без ожидания');
        setAiAnalysisResult('ИИ обрабатывает данные в фоне! Показываем доступные результаты...');
      } else {
        setAiAnalysisResult('ИИ обработал ваши данные! Подготавливаем результаты...');
      }
    }
  };

  // ЭТАП 3: Ожидание и загрузка (поэтапно)
  const waitAndLoadRecommendations = async () => {
    if (!user?.id) return;

    console.log('⏱️ Ждем обработки на сервере...');
    
    // Короткие интервалы вместо одного длинного ожидания
    for (let i = 0; i < 6; i++) {
      setAiProgress(`Ждем AI рекомендации... (${i + 1}/6)`);
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms каждый раз
      
      try {
        const aiRecsResponse = await fetch(`/api/ai/recommendations?user_id=${user.id}`);
        const aiRecsData = await aiRecsResponse.json();
        
        console.log(`📥 Попытка ${i + 1}: Найдено ${aiRecsData.recommendations?.length || 0} рекомендаций`);
        
        if (aiRecsData.hasRecommendations && aiRecsData.recommendations?.length >= 3) {
          console.log('✅ Достаточно рекомендаций получено!');
          setAiProgress('AI рекомендации получены! ✅');
          
          const enhancedRecs = aiRecsData.recommendations.map((rec: any) => ({
            ...rec,
            confidence: rec.confidence || 0.8,
            explanations: rec.explanations || ['AI анализ', 'персональный подбор'],
            score: rec.score || rec.score_breakdown?.final || 0.8,
            algorithm_variant: rec.algorithm_variant || 'hybrid_v1'
          }));
          
          setSavedRecommendations(enhancedRecs);
          setHasExistingResults(true);
          console.log('✅ AI рекомендации готовы, количество:', enhancedRecs.length);
          return; // Успешно получили рекомендации
        }
      } catch (error) {
        console.error(`⚠️ Ошибка попытки ${i + 1}:`, error);
      }
    }
    
    console.log('⚠️ AI рекомендации не получены за отведенное время, используем статические');
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
      const res = await fetch('/api/ai-preferences', {
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

  // Отправка фидбека по рекомендации
  const handleSendFeedback = async (benefitId: number, label: string, reason?: string) => {
    if (!user?.id) return;
    
    // Проверяем валидность benefit_id
    if (!benefitId || benefitId === 0) {
      console.log('🚫 Невалидный benefit_id:', benefitId);
      console.log('⚠️ Эта рекомендация не может быть оценена (нет ID льготы)');
      return;
    }
    
    // Проверяем, не голосовал ли уже пользователь
    if (feedbackPermanent[benefitId] || feedbackSending[benefitId]) {
      console.log('🚫 Попытка повторного голосования заблокирована');
      return;
    }
    
    console.log('🎯 Пользователь оценил рекомендацию:', {
      user_id: user.id,
      benefit_id: benefitId,
      label: label,
      reason: reason,
      timestamp: new Date().toISOString(),
      page: 'preferences'
    });
    
    // Запускаем анимацию отправки
    setFeedbackSending(prev => ({...prev, [benefitId]: true}));
    setFeedbackAnimating(prev => ({...prev, [benefitId]: true}));
    
    try {
      const response = await fetch('/api/recommendations-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          benefit_id: benefitId,
          label: label,
          reason: reason || '',
          context: {
            source: 'preferences_page',
            variant: 'static_test',
            timestamp: new Date().toISOString()
          }
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // Специальная обработка для 409 (уже оценено)
        if (response.status === 409) {
          console.log('ℹ️ Рекомендация уже была оценена ранее:', result);
          
          // Устанавливаем постоянное состояние на основе существующей оценки
          const existingLabel = result.existing_feedback?.label || label;
          setFeedbackPermanent(prev => ({...prev, [benefitId]: existingLabel}));
          setFeedbackSent(prev => ({...prev, [benefitId]: existingLabel}));
          
          // Убираем анимацию загрузки
          setTimeout(() => {
            setFeedbackAnimating(prev => ({...prev, [benefitId]: false}));
          }, 1000);
          
          return; // Успешно обработали дубликат
        }
        
        // Для других ошибок показываем ошибку
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
      }
      
      console.log('✅ Фидбек успешно сохранен в БД:', result);
      
      // Устанавливаем постоянное состояние (нельзя голосовать повторно)
      setFeedbackPermanent(prev => ({...prev, [benefitId]: label}));
      
      // Показываем успешное состояние с анимацией
      setFeedbackSent(prev => ({...prev, [benefitId]: label}));
      
      // Убираем анимацию загрузки через задержку для красивого перехода
      setTimeout(() => {
        setFeedbackAnimating(prev => ({...prev, [benefitId]: false}));
      }, 1000);
      
      // Показываем успешное состояние постоянно (не убираем)
      
    } catch (error) {
      console.error('❌ Ошибка отправки фидбека:', error);
      
      // Убираем анимацию и состояния при ошибке
      setFeedbackAnimating(prev => ({...prev, [benefitId]: false}));
      setFeedbackSending(prev => ({...prev, [benefitId]: false}));
      
      // Показываем пользователю информативную ошибку
      const errorMessage = error instanceof Error && error.message.includes('benefit_id') 
        ? 'Эту рекомендацию нельзя оценить (нет ID льготы)'
        : error instanceof Error && (error.message.includes('Network') || error.message.includes('fetch'))
        ? 'Проблема с подключением. Попробуйте еще раз.'
        : 'Ошибка при сохранении оценки. Попробуйте еще раз.';
        
      alert(errorMessage);
      
    } finally {
      // Убираем состояние загрузки
      setTimeout(() => {
        setFeedbackSending(prev => ({...prev, [benefitId]: false}));
      }, 500);
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
    // Показываем ТОЛЬКО AI рекомендации
    let recommendations: BenefitRecommendation[] = [];
    
    if (hasExistingResults && savedRecommendations.length > 0) {
      // Используем AI рекомендации
      recommendations = savedRecommendations;
      console.log('✅ Используем AI рекомендации:', recommendations.length);
    } else {
      // Если AI рекомендации еще не готовы, показываем пустой список
      // Пользователь увидит сообщение о том, что рекомендации генерируются
      recommendations = [];
      console.log('⏳ AI рекомендации еще не готовы, показываем пустой список');
    }
    
    console.log('📊 Final AI recommendations:', recommendations);
    console.log('🔍 All recommendations have confidence:', recommendations.every(r => r.confidence));
    console.log('🎯 All recommendations have explanations:', recommendations.every(r => r.explanations && r.explanations.length > 0));


    
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

            {recommendations.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                px: 3
              }}>
                <CircularProgress 
                  size={60}
                  sx={{ 
                    color: '#8B0000',
                    mb: 3
                  }} 
                />
                <Typography variant="h5" sx={{ 
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 700,
                  color: '#1A1A1A',
                  mb: 2
                }}>
                  ИИ генерирует персональные рекомендации...
                </Typography>
                <Typography variant="body1" sx={{ 
                  fontFamily: 'Inter, system-ui, sans-serif',
                  color: '#666',
                  maxWidth: '500px',
                  mx: 'auto'
                }}>
                  Это может занять несколько секунд. Пожалуйста, подождите.
                </Typography>
              </Box>
            ) : (
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
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#8B0000', fontWeight: 700, mb: 1 }}
                        >
                          Почему подобрано:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {rec.explanations.map((explanation, idx) => (
                            <Chip key={idx} label={explanation} size="small" sx={{ borderRadius: '10px' }} />
                          ))}
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#666', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600 }}>
                          Уверенность: {Math.round(rec.confidence * 100)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.max(0, Math.min(100, rec.confidence * 100))}
                          sx={{ height: 6, borderRadius: 3, mt: 0.5, '& .MuiLinearProgress-bar': { background: 'linear-gradient(45deg, #8B0000, #B22222)' } }}
                        />
                      </Box>

                      <Box sx={{ mb: 3, flexGrow: 1 }}>
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
                      
                      {/* Блок оценки - показываем на всех карточках */}
                      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #F5F5F5' }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'Inter, system-ui, sans-serif',
                            color: '#8B0000',
                            fontWeight: 700,
                            mb: 2,
                            display: 'block'
                          }}
                        >
                          Оцените рекомендацию:
                        </Typography>
                        
                        {/* Кнопки фидбека - показываем только для карточек с benefit_id */}
                        {rec.benefit_id && rec.benefit_id > 0 ? (
                          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            {/* Кнопка "Полезно" */}
                            <motion.div
                              animate={{
                                scale: feedbackAnimating[rec.benefit_id] 
                                  ? [1, 1.08, 1.02, 1] 
                                  : feedbackSent[rec.benefit_id] === 'useful' 
                                  ? [1, 1.15, 1] 
                                  : 1,
                                y: feedbackSent[rec.benefit_id] === 'useful' ? [0, -3, 0] : 0
                              }}
                              transition={{ 
                                duration: feedbackSent[rec.benefit_id] === 'useful' ? 0.8 : 0.6, 
                                ease: "easeInOut",
                                times: [0, 0.4, 0.8, 1]
                              }}
                            >
                              <Button
                                onClick={() => rec.benefit_id && handleSendFeedback(rec.benefit_id, 'useful')}
                                disabled={!rec.benefit_id || feedbackSending[rec.benefit_id] || !!feedbackPermanent[rec.benefit_id]}
                                sx={{
                                  fontFamily: 'Inter, system-ui, sans-serif',
                                  background: feedbackPermanent[rec.benefit_id] === 'useful' || feedbackSent[rec.benefit_id] === 'useful'
                                    ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                                    : feedbackSending[rec.benefit_id]
                                    ? 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.15) 100%)'
                                    : feedbackPermanent[rec.benefit_id] && feedbackPermanent[rec.benefit_id] !== 'useful'
                                    ? 'linear-gradient(135deg, rgba(34,197,94,0.04) 0%, rgba(22,163,74,0.04) 100%)'
                                    : 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(22,163,74,0.08) 100%)',
                                  boxShadow: feedbackPermanent[rec.benefit_id] === 'useful' || feedbackSent[rec.benefit_id] === 'useful'
                                    ? '0 8px 24px rgba(34,197,94,0.25), 0 0 0 1px rgba(34,197,94,0.1)'
                                    : 'none',
                                  color: feedbackPermanent[rec.benefit_id] === 'useful' || feedbackSent[rec.benefit_id] === 'useful' 
                                    ? '#fff' 
                                    : feedbackPermanent[rec.benefit_id] && feedbackPermanent[rec.benefit_id] !== 'useful'
                                    ? 'rgba(22,163,74,0.4)'
                                    : '#16A34A',
                                  border: feedbackPermanent[rec.benefit_id] === 'useful' || feedbackSent[rec.benefit_id] === 'useful' 
                                    ? 'none' 
                                    : '1px solid rgba(22,163,74,0.2)',
                                  borderRadius: '10px',
                                  padding: '6px 14px',
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                  textTransform: 'none',
                                  minWidth: 'auto',
                                  transition: 'all 180ms ease',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  '&:hover': {
                                    background: feedbackSent[rec.benefit_id] === 'useful'
                                      ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                                      : 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(22,163,74,0.12) 100%)',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 4px 12px rgba(22,163,74,0.15)'
                                  },
                                  '&:disabled': {
                                    background: feedbackSent[rec.benefit_id] === 'useful'
                                      ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                                      : 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(22,163,74,0.08) 100%)',
                                    color: feedbackSent[rec.benefit_id] === 'useful' ? '#fff' : '#16A34A'
                                  },
                                  '&::after': feedbackAnimating[rec.benefit_id] ? {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: '-100%',
                                    width: '100%',
                                    height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                    animation: 'shimmer 0.8s ease-out',
                                    '@keyframes shimmer': {
                                      '0%': { left: '-100%' },
                                      '100%': { left: '100%' }
                                    }
                                  } : {}
                                }}
                                startIcon={
                                  feedbackSending[rec.benefit_id] ? (
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                      <FaSpinner style={{ fontSize: '12px' }} />
                                    </motion.div>
                                  ) : feedbackPermanent[rec.benefit_id] === 'useful' || feedbackSent[rec.benefit_id] === 'useful' ? (
                                    <motion.div
                                      initial={{ scale: 0, rotate: -90, opacity: 0 }}
                                      animate={{ 
                                        scale: [0, 1.3, 1], 
                                        rotate: [0, 10, 0],
                                        opacity: [0, 1, 1]
                                      }}
                                      transition={{ 
                                        duration: 0.7, 
                                        ease: "easeInOut",
                                        times: [0, 0.6, 1]
                                      }}
                                    >
                                      <FaCheck style={{ fontSize: '12px', filter: 'drop-shadow(0 0 3px rgba(22,163,74,0.3))' }} />
                                    </motion.div>
                                  ) : (
                                    <FaThumbsUp style={{ fontSize: '12px' }} />
                                  )
                                }
                              >
                                {feedbackSending[rec.benefit_id] 
                                  ? 'Сохранение...' 
                                  : feedbackPermanent[rec.benefit_id] === 'useful' || feedbackSent[rec.benefit_id] === 'useful'
                                  ? 'Оценено' 
                                  : feedbackPermanent[rec.benefit_id] && feedbackPermanent[rec.benefit_id] !== 'useful'
                                  ? 'Полезно'
                                  : 'Полезно'
                                }
                              </Button>
                            </motion.div>

                            {/* Кнопка "Не подходит" */}
                            <motion.div
                              animate={{
                                scale: feedbackAnimating[rec.benefit_id] 
                                  ? [1, 1.08, 1.02, 1] 
                                  : feedbackSent[rec.benefit_id] === 'not_useful' 
                                  ? [1, 1.15, 1] 
                                  : 1,
                                y: feedbackSent[rec.benefit_id] === 'not_useful' ? [0, -3, 0] : 0
                              }}
                              transition={{ 
                                duration: feedbackSent[rec.benefit_id] === 'not_useful' ? 0.8 : 0.6, 
                                ease: "easeInOut",
                                times: [0, 0.4, 0.8, 1]
                              }}
                            >
                              <Button
                                onClick={() => rec.benefit_id && handleSendFeedback(rec.benefit_id, 'not_useful', 'не подходит')}
                                disabled={!rec.benefit_id || feedbackSending[rec.benefit_id] || !!feedbackPermanent[rec.benefit_id]}
                                sx={{
                                  fontFamily: 'Inter, system-ui, sans-serif',
                                  background: feedbackPermanent[rec.benefit_id] === 'not_useful' || feedbackSent[rec.benefit_id] === 'not_useful'
                                    ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                    : feedbackSending[rec.benefit_id]
                                    ? 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.15) 100%)'
                                    : feedbackPermanent[rec.benefit_id] && feedbackPermanent[rec.benefit_id] !== 'not_useful'
                                    ? 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(220,38,38,0.04) 100%)'
                                    : 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(220,38,38,0.08) 100%)',
                                  boxShadow: feedbackPermanent[rec.benefit_id] === 'not_useful' || feedbackSent[rec.benefit_id] === 'not_useful' 
                                    ? '0 8px 24px rgba(239,68,68,0.25), 0 0 0 1px rgba(239,68,68,0.1)'
                                    : 'none',
                                  color: feedbackPermanent[rec.benefit_id] === 'not_useful' || feedbackSent[rec.benefit_id] === 'not_useful' 
                                    ? '#fff' 
                                    : feedbackPermanent[rec.benefit_id] && feedbackPermanent[rec.benefit_id] !== 'not_useful'
                                    ? 'rgba(220,38,38,0.4)'
                                    : '#DC2626',
                                  border: feedbackPermanent[rec.benefit_id] === 'not_useful' || feedbackSent[rec.benefit_id] === 'not_useful' 
                                    ? 'none' 
                                    : '1px solid rgba(220,38,38,0.2)',
                                  borderRadius: '10px',
                                  padding: '6px 14px',
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                  textTransform: 'none',
                                  minWidth: 'auto',
                                  transition: 'all 180ms ease',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  '&:hover': {
                                    background: feedbackSent[rec.benefit_id] === 'not_useful'
                                      ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                      : 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(220,38,38,0.12) 100%)',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 4px 12px rgba(220,38,38,0.15)'
                                  },
                                  '&:disabled': {
                                    background: feedbackSent[rec.benefit_id] === 'not_useful'
                                      ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                      : 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(220,38,38,0.08) 100%)',
                                    color: feedbackSent[rec.benefit_id] === 'not_useful' ? '#fff' : '#DC2626'
                                  }
                                }}
                                startIcon={
                                  feedbackSending[rec.benefit_id] ? (
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                      <FaSpinner style={{ fontSize: '12px' }} />
                                    </motion.div>
                                  ) : feedbackPermanent[rec.benefit_id] === 'not_useful' || feedbackSent[rec.benefit_id] === 'not_useful' ? (
                                    <motion.div
                                      initial={{ scale: 0, rotate: -90, opacity: 0 }}
                                      animate={{ 
                                        scale: [0, 1.3, 1], 
                                        rotate: [0, -10, 0],
                                        opacity: [0, 1, 1]
                                      }}
                                      transition={{ 
                                        duration: 0.7, 
                                        ease: "easeInOut",
                                        times: [0, 0.6, 1]
                                      }}
                                    >
                                      <FaCheck style={{ fontSize: '12px', filter: 'drop-shadow(0 0 3px rgba(220,38,38,0.3))' }} />
                                    </motion.div>
                                  ) : (
                                    <FaThumbsDown style={{ fontSize: '12px' }} />
                                  )
                                }
                              >
                                {feedbackSending[rec.benefit_id] 
                                  ? 'Сохранение...' 
                                  : feedbackPermanent[rec.benefit_id] === 'not_useful' || feedbackSent[rec.benefit_id] === 'not_useful'
                                  ? 'Отмечено' 
                                  : 'Не подходит'
                                }
                              </Button>
                            </motion.div>
                          </Box>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'Inter, system-ui, sans-serif',
                              color: '#999',
                              fontStyle: 'italic'
                            }}
                          >
                            💡 Эта рекомендация от ИИ пока не имеет ID для оценки
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </motion.div>
                ))}
              </Box>
            </motion.div>
            )}

            {/* AI Отчет по рекомендациям */}
            {aiRecommendationsReport && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(139,0,0,0.03) 0%, rgba(139,0,0,0.06) 100%)',
                    border: '2px solid rgba(139,0,0,0.08)',
                    borderRadius: '24px',
                    padding: '2.5rem',
                    mb: 4,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Декоративный фон */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '200px',
                      height: '200px',
                      background: 'radial-gradient(circle, rgba(139,0,0,0.05) 0%, transparent 70%)',
                      borderRadius: '50%'
                    }}
                  />
                  
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mb: 3
                    }}>
                      <motion.div
                        animate={{ 
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <GiBrain size={48} color="#8B0000" />
                      </motion.div>
                      <Typography
                        variant="h4"
                        sx={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                          fontWeight: 800,
                          color: '#8B0000',
                          ml: 2,
                          fontSize: { xs: '1.5rem', md: '2rem' }
                        }}
                      >
                        AI Анализ ваших предпочтений
                      </Typography>
                    </Box>

                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        color: '#333',
                        lineHeight: 1.7,
                        fontSize: '1.1rem',
                        whiteSpace: 'pre-line',
                        maxWidth: '800px',
                        mx: 'auto'
                      }}
                    >
                      {aiRecommendationsReport}
                    </Typography>

                    <Divider sx={{ my: 3, background: 'rgba(139,0,0,0.12)' }} />

                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                          color: '#666',
                          fontStyle: 'italic'
                        }}
                      >
                        💡 Этот анализ основан на ваших ответах и становится точнее с каждым использованием
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </motion.div>
            )}

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
      {/* Модальное окно AI анализа */}
      <Dialog
        open={showAiModal}
        onClose={() => setShowAiModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #8B0000 0%, #B91C1C 100%)',
            color: 'white',
            maxWidth: '500px',
            boxShadow: '0 25px 50px rgba(139,0,0,0.3)'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          pb: 1,
          position: 'relative'
        }}>
          <IconButton
            onClick={() => setShowAiModal(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'rgba(255,255,255,0.7)',
              '&:hover': { color: 'white' }
            }}
          >
            <FaTimes />
          </IconButton>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 2,
            mt: 2
          }}>
            <motion.div
              animate={aiAnalyzing ? { 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              } : {}}
              transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity }
              }}
            >
              <GiBrain size={40} color="#fff" />
            </motion.div>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              AI Анализ
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ textAlign: 'center', px: 4, pb: 4 }}>
          {aiAnalyzing ? (
            <Box>
              <CircularProgress 
                size={60}
                sx={{ 
                  color: 'white',
                  mb: 3
                }} 
              />
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                mb: 2,
                color: 'rgba(255,255,255,0.95)'
              }}>
                ИИ анализирует ваши предпочтения...
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.6,
                mb: 2
              }}>
                {aiProgress}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255,255,255,0.6)',
                fontStyle: 'italic'
              }}>
                Пожалуйста, подождите... Это может занять до 15 секунд
              </Typography>
            </Box>
          ) : (
            <Box>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15 
                }}
              >
                <FaCheck size={48} color="#fff" style={{ marginBottom: '1rem' }} />
              </motion.div>
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                mb: 2,
                color: 'rgba(255,255,255,0.95)'
              }}>
                Анализ завершен!
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1.6
              }}>
                {aiAnalysisResult || 'ИИ проанализировал ваши вкусы и сгенерировал персональные рекомендации!'}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {toast}
    </Box>
  );
};

export default Preferences; 