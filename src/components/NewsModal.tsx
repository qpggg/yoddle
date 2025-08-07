import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Calendar, User, Loader2 } from 'lucide-react';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  date: string;
  author: string;
  category: string;
  categoryIcon: string;
  image?: string;
}

interface NewsModalProps {
  open: boolean;
  onClose: () => void;
}

const NewsModal: React.FC<NewsModalProps> = ({ open, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем новости при открытии модального окна
  useEffect(() => {
    if (open) {
      fetchNews();
    }
  }, [open]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/news?action=modal-data&limit=10');
      const data = await response.json();
      
      if (data.success) {
        setNewsData(data.data);
        setCurrentIndex(0); // Сбрасываем на первую новость
      } else {
        setError('Ошибка при загрузке новостей');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Не удалось загрузить новости');
    } finally {
      setLoading(false);
    }
  };

  const nextNews = () => {
    setCurrentIndex((prev) => (prev + 1) % newsData.length);
  };

  const prevNews = () => {
    setCurrentIndex((prev) => (prev - 1 + newsData.length) % newsData.length);
  };

  const currentNews = newsData[currentIndex];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Продукт': '#750000',
      'Интеграция': '#2E8B57',
      'Геймификация': '#FF6347',
      'Партнерства': '#4682B4',
      'Анонс': '#9370DB'
    };
    return colors[category] || '#750000';
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="news-modal-backdrop"
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
            className="news-modal"
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
            {/* Header с закрытием */}
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
                  Новости Yoddle
                </h2>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  color: '#666', 
                  fontSize: '14px' 
                }}>
                  {loading ? 'Загрузка...' : newsData.length === 0 ? 'Нет новостей' : `${currentIndex + 1} из ${newsData.length}`}
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
                onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <X size={24} color="#666" />
              </button>
            </div>

            {/* Контент новости */}
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
                  <Loader2 
                    size={40} 
                    color="#750000" 
                    style={{
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                  <p style={{ color: '#666', fontSize: '16px' }}>Загружаем новости...</p>
                </div>
              ) : error ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '300px',
                  gap: '16px'
                }}>
                  <p style={{ color: '#dc2626', fontSize: '16px' }}>{error}</p>
                  <button
                    onClick={fetchNews}
                    style={{
                      padding: '12px 24px',
                      background: '#750000',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Попробовать снова
                  </button>
                </div>
              ) : newsData.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '300px',
                  gap: '16px'
                }}>
                  <p style={{ color: '#666', fontSize: '16px' }}>Пока нет новостей</p>
                </div>
              ) : (
                <>
                  {/* Категория */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: getCategoryColor(currentNews.category),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '16px'
                  }}>
                    {currentNews.categoryIcon && (
                      <img 
                        src={currentNews.categoryIcon} 
                        alt={currentNews.category}
                        style={{
                          width: '16px',
                          height: '16px',
                          objectFit: 'contain'
                        }}
                      />
                    )}
                    {currentNews.category}
                  </div>

                  {/* Заголовок */}
                  <h1 style={{
                    margin: '0 0 16px 0',
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#333',
                    lineHeight: '1.2'
                  }}>
                    {currentNews.title}
                  </h1>

                  {/* Мета информация */}
                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '24px',
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={16} />
                      {formatDate(currentNews.date)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={16} />
                      {currentNews.author}
                    </div>
                  </div>

                  {/* Изображение (если есть) */}
                  {currentNews.image && (
                    <div style={{
                      marginBottom: '24px',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}>
                      <img 
                        src={currentNews.image} 
                        alt={currentNews.title}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  )}

                  {/* Текст новости */}
                  <div style={{
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#444',
                    whiteSpace: 'pre-line'
                  }}>
                    {currentNews.content}
                  </div>
                </>
              )}
            </div>

            {/* Navigation */}
            {!loading && !error && newsData.length > 0 && (
              <div style={{
                padding: '20px 30px',
                borderTop: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fafafa'
              }}>
                <motion.button
                  onClick={prevNews}
                  disabled={newsData.length <= 1}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: '#750000',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: newsData.length <= 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: newsData.length <= 1 ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (newsData.length > 1) {
                      e.currentTarget.style.background = '#600000';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#750000';
                  }}
                >
                  <ChevronLeft size={20} />
                  Предыдущая
                </motion.button>

                {/* Dots indicator */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {newsData.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        border: 'none',
                        background: index === currentIndex ? '#750000' : '#ddd',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                    />
                  ))}
                </div>

                <motion.button
                  onClick={nextNews}
                  disabled={newsData.length <= 1}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: '#750000',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: newsData.length <= 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: newsData.length <= 1 ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (newsData.length > 1) {
                      e.currentTarget.style.background = '#600000';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#750000';
                  }}
                >
                  Следующая
                  <ChevronRight size={20} />
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewsModal; 