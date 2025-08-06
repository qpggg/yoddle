import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BalanceData {
  balance: number;
  total_earned: number;
  total_spent: number;
  user_name: string;
  company_name: string;
  coins_per_employee: number;
  updated_at: string;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  processed_by?: string;
}

interface BalanceCardProps {
  userId: number;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ userId }) => {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, [userId]);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/balance?user_id=${userId}&action=balance`);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки баланса');
      }

      const data = await response.json();
      setBalance(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/balance?user_id=${userId}&action=transactions&limit=10`);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки истории');
      }

      const data = await response.json();
      setTransactions(data.transactions);
    } catch (err) {
      console.error('Ошибка загрузки транзакций:', err);
    }
  };

  const handleShowTransactions = () => {
    if (!showTransactions && transactions.length === 0) {
      fetchTransactions();
    }
    setShowTransactions(!showTransactions);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
      case 'admin_add':
      case 'monthly_allowance':
        return '➕';
      case 'debit':
      case 'benefit_purchase':
        return '🛒';
      case 'admin_remove':
        return '➖';
      default:
        return '💰';
    }
  };

  const getTransactionColor = (type: string) => {
    return type.includes('credit') || type.includes('add') || type.includes('allowance') 
      ? 'text-green-600' 
      : 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-16 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center text-red-600">
          <h3 className="text-lg font-semibold mb-2">Ошибка загрузки</h3>
          <p>{error}</p>
          <button 
            onClick={fetchBalance}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white"
    >
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">💰</span>
          <h3 className="text-xl font-bold">Yoddle-коины</h3>
        </div>
        <button
          onClick={handleShowTransactions}
          className="text-sm bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition-colors"
        >
          {showTransactions ? 'Скрыть историю' : 'История'}
        </button>
      </div>

      {/* Основной баланс */}
      <div className="mb-6">
        <div className="text-3xl font-bold mb-2">
          {balance.balance.toFixed(2)} <span className="text-lg font-normal">коинов</span>
        </div>
        {balance.company_name && (
          <div className="text-white/80 text-sm">
            {balance.company_name} • {balance.coins_per_employee} коинов/месяц
          </div>
        )}
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-white/80 text-sm">Всего заработано</div>
          <div className="text-lg font-semibold">{balance.total_earned.toFixed(2)}</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-white/80 text-sm">Всего потрачено</div>
          <div className="text-lg font-semibold">{balance.total_spent.toFixed(2)}</div>
        </div>
      </div>

      {/* История транзакций */}
      {showTransactions && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-white/20 pt-4"
        >
          <h4 className="text-sm font-semibold mb-3 text-white/90">Последние операции</h4>
          {transactions.length === 0 ? (
            <div className="text-white/60 text-sm text-center py-4">
              История пуста
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-white/10 rounded-lg p-3 text-sm"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center space-x-2">
                      <span>{getTransactionIcon(transaction.type)}</span>
                      <span className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type.includes('credit') || transaction.type.includes('add') || transaction.type.includes('allowance') ? '+' : '-'}
                        {transaction.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-white/60 text-xs">
                      {formatDate(transaction.created_at)}
                    </div>
                  </div>
                  <div className="text-white/80 text-xs">{transaction.description}</div>
                  {transaction.processed_by && (
                    <div className="text-white/60 text-xs mt-1">
                      Обработано: {transaction.processed_by}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Последнее обновление */}
      <div className="text-white/60 text-xs text-center mt-4">
        Обновлено: {formatDate(balance.updated_at)}
      </div>
    </motion.div>
  );
};

export default BalanceCard;