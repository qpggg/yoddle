import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';

interface User {
  id: number;
  name: string;
  email: string;
}

const Wallet: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [transactionsLimit, setTransactionsLimit] = useState(20);

  // Получаем пользователя из localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const { 
    wallet, 
    transactions, 
    loading, 
    error, 
    refreshWallet, 
    fetchTransactions 
  } = useWallet();

  // Загружаем транзакции при изменении фильтров
  useEffect(() => {
    if (user) {
      fetchTransactions(transactionsLimit, selectedPeriod);
    }
  }, [selectedPeriod, transactionsLimit, user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getTransactionDescription = (type: string) => {
    switch (type) {
      case 'credit':
        return 'Пополнение';
      case 'admin_add':
        return 'Начисление администратором';
      case 'monthly_allowance':
        return 'Ежемесячное начисление';
      case 'debit':
        return 'Списание';
      case 'benefit_purchase':
        return 'Покупка льготы';
      case 'admin_remove':
        return 'Списание администратором';
      default:
        return 'Операция';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Вход в систему</h2>
          <p className="text-gray-600">Пожалуйста, войдите в систему для доступа к кошельку</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Ошибка</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshWallet}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💰 Мой кошелек
          </h1>
          <p className="text-gray-600">
            Управляйте вашими Yoddle-коинами и отслеживайте транзакции
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основная информация о кошельке */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg p-8 text-white mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Ваш баланс</h2>
                  <p className="text-purple-100">
                    {wallet?.company_name && `${wallet.company_name} • `}
                    {user.name}
                  </p>
                </div>
                <button
                  onClick={refreshWallet}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  title="Обновить баланс"
                >
                  🔄
                </button>
              </div>

              <div className="mb-8">
                <div className="text-5xl font-bold mb-2">
                  {wallet?.balance.toFixed(2) || '0.00'}
                  <span className="text-2xl font-normal ml-2">Y-коинов</span>
                </div>
                {wallet?.coins_per_employee && (
                  <p className="text-purple-100">
                    Ежемесячное начисление: {wallet.coins_per_employee} коинов
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-purple-100 text-sm mb-1">Всего заработано</div>
                  <div className="text-2xl font-semibold">
                    {wallet?.total_earned.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-purple-100 text-sm mb-1">Всего потрачено</div>
                  <div className="text-2xl font-semibold">
                    {wallet?.total_spent.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
            </div>

            {/* История транзакций */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">История операций</h3>
                
                <div className="flex space-x-4">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="week">Неделя</option>
                    <option value="month">Месяц</option>
                    <option value="year">Год</option>
                    <option value="">Все время</option>
                  </select>

                  <select
                    value={transactionsLimit}
                    onChange={(e) => setTransactionsLimit(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value={10}>10 записей</option>
                    <option value={20}>20 записей</option>
                    <option value={50}>50 записей</option>
                    <option value={100}>100 записей</option>
                  </select>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📋</div>
                  <h4 className="text-lg font-medium mb-2">История пуста</h4>
                  <p>Ваши транзакции появятся здесь</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {transaction.description}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getTransactionDescription(transaction.type)} • {formatDate(transaction.created_at)}
                          </div>
                          {transaction.processed_by && (
                            <div className="text-xs text-gray-400">
                              Обработано: {transaction.processed_by}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type.includes('credit') || transaction.type.includes('add') || transaction.type.includes('allowance') ? '+' : '-'}
                          {transaction.amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Баланс: {transaction.balance_after.toFixed(2)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Боковая панель */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Быстрые действия */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Быстрые действия</h3>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/my-benefits'}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <span className="flex items-center">
                    🛒 <span className="ml-2">Потратить коины</span>
                  </span>
                  <span>→</span>
                </button>
                
                <button
                  onClick={() => fetchTransactions(transactionsLimit, selectedPeriod)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center">
                    🔄 <span className="ml-2">Обновить</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Информация о тарифе */}
            {wallet?.company_name && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Ваш тариф</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Компания:</span>
                    <span className="font-medium">{wallet.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Коинов/месяц:</span>
                    <span className="font-medium">{wallet.coins_per_employee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Последнее обновление:</span>
                    <span className="font-medium text-sm">
                      {formatDate(wallet.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Помощь */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Нужна помощь?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Если у вас есть вопросы по использованию коинов, обратитесь в поддержку.
              </p>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Связаться с поддержкой
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;