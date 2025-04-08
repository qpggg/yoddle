import React from 'react';
import { Button, Box, Link, styled } from '@mui/material';
import { keyframes } from '@mui/system';

interface LoginButtonProps {
  isDisabled?: boolean;
  onClick?: () => void;
}

// Анимация нажатия
const pressAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.98);
  }
  100% {
    transform: scale(1);
  }
`;

// Стилизованная кнопка
const StyledButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(180deg, #A50000 0%, #8B0000 100%)',
  borderRadius: '12px',
  padding: '12px 8px', // Минимальный padding для мобильных
  fontSize: '1.125rem',
  fontWeight: 600,
  textTransform: 'none',
  color: '#fff',
  boxShadow: '0 4px 12px rgba(139, 0, 0, 0.2)',
  position: 'relative',
  overflow: 'hidden',
  height: '48px',
  width: '100%',

  [theme.breakpoints.up('sm')]: {
    width: 'auto',
    minWidth: '200px',
    padding: '12px 32px',
  },

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0)',
    transition: 'background-color 0.3s ease',
  },

  '&:hover': {
    background: 'linear-gradient(180deg, #A50000 0%, #8B0000 100%)',
    boxShadow: '0 6px 16px rgba(139, 0, 0, 0.3)',
    '&::before': {
      background: 'rgba(255, 255, 255, 0.1)',
    },
  },

  '&:active': {
    animation: `${pressAnimation} 0.2s ease-in-out`,
    boxShadow: '0 2px 8px rgba(139, 0, 0, 0.2)',
  },

  '&.Mui-disabled': {
    background: 'linear-gradient(180deg, #CCCCCC 0%, #B3B3B3 100%)',
    boxShadow: 'none',
    color: 'rgba(255, 255, 255, 0.8)',
    cursor: 'not-allowed',
  },
}));

// Стилизованная ссылка для восстановления пароля
const StyledLink = styled(Link)({
  color: '#666666',
  fontSize: '0.875rem',
  textDecoration: 'none',
  marginTop: '12px',
  display: 'inline-block',
  transition: 'color 0.2s ease',

  '&:hover': {
    color: '#8B0000',
    textDecoration: 'none',
  },
});

const LoginButton: React.FC<LoginButtonProps> = ({ isDisabled = false, onClick }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      width: '100%',
      px: { xs: 2, sm: 0 } // Добавляем отступы на мобильных
    }}>
      <StyledButton
        variant="contained"
        disabled={isDisabled}
        onClick={onClick}
        fullWidth
      >
        Войти
      </StyledButton>
      <StyledLink href="/reset-password">
        Забыли пароль?
      </StyledLink>
    </Box>
  );
};

export default LoginButton; 