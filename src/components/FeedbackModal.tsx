import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, User, Calendar, Loader2 } from 'lucide-react';

interface FeedbackItem {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string;
  position: string;
  avatar?: string;
}

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ open, onClose, userId }) => {
  const [recentFeedback, setRecentFeedback] = useState<FeedbackItem[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Форма нового отзыва
  const [newFeedback, setNewFeedback] = useState({
    rating: 0,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, userId]);

  const fetchData = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Получаем последние отзывы
      const recentResponse = await fetch('/api/feedback?action=recent');
      const recentData = await recentResponse.json();
      
      // Проверяем отзыв текущего пользователя
      const userResponse = await fetch(`/api/feedback?action=check-user&user_id=${userId}`);
      const userData = await userResponse.json();
      
      if (recentData.success) {
        setRecentFeedback(recentData.data);
      }
      
      if (userData.success) {
        setHasSubmitted(userData.hasSubmitted);
      }
    } catch (err) {
      console.error('Error fetching feedback data:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!userId || !newFeedback.rating || !newFeedback.comment.trim()) {
      setError('Пожалуйста, поставьте оценку и напишите комментарий');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          rating: newFeedback.rating,
          comment: newFeedback.comment.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setHasSubmitted(true);
        setNewFeedback({ rating: 0, comment: '' });
        // Обновляем список отзывов
        fetchData();
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Не удалось отправить отзыв');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={interactive ? 24 : 16}
            color={star <= rating ? '#FFA500' : '#ddd'}
            fill={star <= rating ? '#FFA500' : 'none'}
            style={{ 
              cursor: interactive ? 'pointer' : 'default',
              transition: 'all 0.2s ease'
            }}
            onClick={interactive && onStarClick ? () => onStarClick(star) : undefined}
          />
        ))}
      </div>
    );
  };

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
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              background: '#fff',
              borderRadius: '20px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px 30px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fafafa'
            }}>
              <div>
                <h2 style={{ 
                  margin: 0, 
                  color: '#750000', 
                  fontSize: '24px', 
                  fontWeight: 700 
                }}>
                  Отзывы сотрудников
                </h2>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  color: '#666', 
                  fontSize: '14px' 
                }}>
                  {loading ? 'Загрузка...' : `${recentFeedback.length} отзывов`}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s ease'
                }}
              >
                <X size={24} color="#666" />
              </button>
            </div>

            {/* Content */}
            <div style={{
              padding: '30px',
              maxHeight: 'calc(90vh - 200px)',
              overflowY: 'auto'
            }}>
              {loading ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '300px',
                  gap: '16px'
                }}>
                  <Loader2 size={40} color="#750000" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: '#666', fontSize: '16px' }}>Загружаем отзывы...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Форма нового отзыва */}
                  {!hasSubmitted && (
                    <div style={{
                      padding: '20px',
                      background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                      borderRadius: '12px',
                      border: '1px solid #e8e8e8'
                    }}>
                      <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Оставить отзыв</h3>
                      
                      {/* Рейтинг */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '8px', 
                          fontWeight: 600, 
                          color: '#333' 
                        }}>
                          Оценка:
                        </label>
                        {renderStars(
                          newFeedback.rating, 
                          true, 
                          (rating) => setNewFeedback(prev => ({ ...prev, rating }))
                        )}
                      </div>

                      {/* Комментарий */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '8px', 
                          fontWeight: 600, 
                          color: '#333' 
                        }}>
                          Комментарий:
                        </label>
                        <textarea
                          value={newFeedback.comment}
                          onChange={(e) => setNewFeedback(prev => ({ ...prev, comment: e.target.value }))}
                          placeholder="Поделитесь своим мнением о работе в компании..."
                          style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '14px',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>

                      {/* Кнопка отправки */}
                      <button
                        onClick={handleSubmitFeedback}
                        disabled={submitting || !newFeedback.rating || !newFeedback.comment.trim()}
                        style={{
                          padding: '12px 24px',
                          background: submitting || !newFeedback.rating || !newFeedback.comment.trim() 
                            ? '#ccc' : '#750000',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: submitting || !newFeedback.rating || !newFeedback.comment.trim() 
                            ? 'not-allowed' : 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {submitting ? 'Отправка...' : 'Отправить отзыв'}
                      </button>

                      {error && (
                        <p style={{ color: '#dc2626', margin: '12px 0 0 0', fontSize: '14px' }}>
                          {error}
                        </p>
                      )}
                    </div>
                  )}

                  {hasSubmitted && (
                    <div style={{
                      padding: '20px',
                      background: 'linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%)',
                      borderRadius: '12px',
                      border: '1px solid #c3e6cb',
                      textAlign: 'center'
                    }}>
                      <h3 style={{ margin: '0 0 8px 0', color: '#155724' }}>Спасибо за отзыв!</h3>
                      <p style={{ margin: 0, color: '#155724' }}>Ваш отзыв поможет нам стать лучше</p>
                    </div>
                  )}

                  {/* Список последних отзывов */}
                  <div>
                    <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Последние отзывы</h3>
                    {recentFeedback.length === 0 ? (
                      <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                        Пока нет отзывов
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {recentFeedback.map((feedback) => (
                          <div
                            key={feedback.id}
                            style={{
                              padding: '16px',
                              background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                              borderRadius: '12px',
                              border: '1px solid #e8e8e8'
                            }}
                          >
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'flex-start',
                              marginBottom: '12px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {feedback.avatar ? (
                                  <img 
                                    src={feedback.avatar} 
                                    alt={feedback.user_name}
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: '50%',
                                      objectFit: 'cover'
                                    }}
                                  />
                                ) : (
                                  <User size={40} color="#750000" />
                                )}
                                <div>
                                  <div style={{ fontWeight: 600, color: '#333' }}>
                                    {feedback.user_name}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#666' }}>
                                    {feedback.position}
                                  </div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                {renderStars(feedback.rating)}
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: '#666', 
                                  marginTop: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <Calendar size={12} />
                                  {formatDate(feedback.created_at)}
                                </div>
                              </div>
                            </div>
                            <p style={{ 
                              margin: 0, 
                              color: '#444', 
                              lineHeight: '1.5',
                              fontStyle: 'italic'
                            }}>
                              "{feedback.comment}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal; 