import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (hash === '#cta') {
        const element = document.getElementById('cta');
        if (element) {
          const navbarHeight = 64; // Высота навбара
          const elementPosition = element.offsetTop;
          
          window.scrollTo({
            top: elementPosition - navbarHeight,
            behavior: 'smooth'
          });
        }
      } else if (!hash) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    };

    // Выполняем прокрутку после полной загрузки страницы
    if (document.readyState === 'complete') {
      handleScroll();
    } else {
      window.addEventListener('load', handleScroll);
      return () => window.removeEventListener('load', handleScroll);
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop; 