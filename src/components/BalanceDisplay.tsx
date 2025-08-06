import React from 'react';
import { motion } from 'framer-motion';
import { useBalanceOnly } from '../hooks/useWallet';

interface BalanceDisplayProps {
  userId: number;
  variant?: 'navbar' | 'dashboard' | 'profile' | 'compact';
  showIcon?: boolean;
  className?: string;
  onClick?: () => void;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  userId,
  variant = 'compact',
  showIcon = true,
  className = '',
  onClick
}) => {
  const { balance, loading } = useBalanceOnly(userId);

  const formatBalance = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(0);
  };

  const getDisplayStyle = () => {
    switch (variant) {
      case 'navbar':
        return {
          container: 'flex items-center space-x-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer',
          icon: 'text-lg',
          text: 'font-medium text-sm',
          balanceText: 'font-bold'
        };
      
      case 'dashboard':
        return {
          container: 'flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all',
          icon: 'text-2xl',
          text: 'text-sm opacity-90',
          balanceText: 'text-xl font-bold'
        };
      
      case 'profile':
        return {
          container: 'flex items-center justify-between p-3 bg-gray-50 rounded-lg',
          icon: 'text-xl',
          text: 'text-gray-600 text-sm',
          balanceText: 'text-lg font-semibold text-gray-900'
        };
      
      default: // compact
        return {
          container: 'flex items-center space-x-1 text-sm',
          icon: 'text-base',
          text: '',
          balanceText: 'font-medium'
        };
    }
  };

  const style = getDisplayStyle();

  if (loading) {
    return (
      <div className={`${style.container} ${className}`}>
        <div className="animate-pulse flex items-center space-x-2">
          {showIcon && <span className={style.icon}>💰</span>}
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    );
  }

  const displayContent = () => {
    switch (variant) {
      case 'navbar':
        return (
          <>
            {showIcon && <span className={style.icon}>💰</span>}
            <span className={style.balanceText}>{formatBalance(balance)} Y</span>
          </>
        );
      
      case 'dashboard':
        return (
          <>
            {showIcon && <span className={style.icon}>💰</span>}
            <div>
              <div className={style.text}>Баланс</div>
              <div className={style.balanceText}>{balance.toFixed(2)} Y-коинов</div>
            </div>
          </>
        );
      
      case 'profile':
        return (
          <>
            <div className="flex items-center space-x-2">
              {showIcon && <span className={style.icon}>💰</span>}
              <span className={style.text}>Баланс Yoddle-коинов</span>
            </div>
            <span className={style.balanceText}>{balance.toFixed(2)}</span>
          </>
        );
      
      default: // compact
        return (
          <>
            {showIcon && <span className={style.icon}>💰</span>}
            <span className={style.balanceText}>{formatBalance(balance)} Y</span>
          </>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      className={`${style.container} ${className}`}
      onClick={onClick}
      title={`Баланс: ${balance.toFixed(2)} Yoddle-коинов`}
    >
      {displayContent()}
    </motion.div>
  );
};

export default BalanceDisplay;