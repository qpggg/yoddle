import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, ExternalLink, Users, Heart } from 'lucide-react';

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ open, onClose }) => {
  // Стили для кастомного скроллбара
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .support-modal-content::-webkit-scrollbar {
        width: 6px;
      }
      .support-modal-content::-webkit-scrollbar-track {
        background: transparent;
      }
      .support-modal-content::-webkit-scrollbar-thumb {
        background: #750000;
        border-radius: 10px;
      }
      .support-modal-content::-webkit-scrollbar-thumb:hover {
        background: #950000;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '100px 20px 20px 20px',
            overflow: 'hidden',
            willChange: 'backdrop-filter',
            backfaceVisibility: 'hidden'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              background: 'white',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: 'calc(100vh - 160px)',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              position: 'relative',
              willChange: 'transform',
              backfaceVisibility: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              style={{
                padding: '32px',
                maxHeight: 'calc(100vh - 160px)',
                overflowY: 'auto'
              }}
              className="support-modal-content"
            >
            {/* Заголовок */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #750000, #a00000)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageCircle size={24} color="white" />
                </div>
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#2c2c2c'
                  }}>
                    Поддержка Yoddle
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#666',
                    marginTop: '4px'
                  }}>
                    Мы готовы помочь!
                  </p>
                </div>
              </div>
              
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Телеграм-чат для маркетинга */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.2 }}
              style={{
                background: 'linear-gradient(135deg, #fdf7f7, #faf0f0)',
                border: '2px solid #e8d5d5',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Декоративные элементы */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '60px',
                height: '60px',
                background: 'linear-gradient(45deg, #750000, #a00000)',
                borderRadius: '50%',
                opacity: 0.12
              }} />
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <Users size={24} color="#750000" />
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#2c2c2c'
                }}>
                  Наш Телеграм-канал
                </h3>
              </div>
              
              <p style={{
                fontSize: '14px',
                color: '#555',
                lineHeight: '1.6',
                marginBottom: '16px'
              }}>
                📢 <strong>Присоединяйтесь к нашему каналу!</strong><br/>
                Здесь мы делимся:<br/>
                • 🏥 Новостями о wellness benefits<br/>
                • 💡 HR-трендами и лайфхаками<br/>
                • 🎯 Кейсами успешного внедрения<br/>
                • 🚀 Анонсами новых функций
              </p>
              
              <motion.button
                onClick={() => window.open('https://t.me/yoddlee', '_blank')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #750000, #a00000)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(117, 0, 0, 0.35)'
                }}
              >
                Подписаться на канал
                <ExternalLink size={18} />
              </motion.button>
            </motion.div>

            {/* Контакт поддержки */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              style={{
                background: 'linear-gradient(135deg, #fdfafa, #fcf5f5)',
                border: '2px solid #f0d5d5',
                borderRadius: '16px',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Декоративные элементы */}
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                width: '80px',
                height: '80px',
                background: 'linear-gradient(45deg, #950000, #750000)',
                borderRadius: '50%',
                opacity: 0.15
              }} />
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <Heart size={24} color="#950000" />
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#2c2c2c'
                }}>
                  Личная поддержка
                </h3>
              </div>
              
              <p style={{
                fontSize: '14px',
                color: '#555',
                lineHeight: '1.6',
                marginBottom: '16px'
              }}>
                🚀 <strong>Нужна помощь прямо сейчас?</strong><br/>
                Напишите напрямую основателю Yoddle:<br/>
                • ⚡ Быстрые ответы на вопросы<br/>
                • 🛠️ Помощь с настройкой<br/>
                • 💬 Обратная связь и предложения
              </p>
              
              <motion.button
                onClick={() => window.open('https://t.me/mpolshkov', '_blank')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #950000, #750000)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(149, 0, 0, 0.35)'
                }}
              >
                Написать в поддержку
                <ExternalLink size={18} />
              </motion.button>
              
              <p style={{
                fontSize: '12px',
                color: '#888',
                textAlign: 'center',
                marginTop: '12px',
                marginBottom: 0
              }}>
                Обычно отвечаем в течение часа
              </p>
            </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SupportModal; 