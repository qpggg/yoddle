import { useState, useEffect, useContext, createContext, ReactNode } from 'react';

interface WalletData {
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
  balance_before: number;
  balance_after: number;
  description: string;
  created_at: string;
  processed_by?: string;
}

interface WalletContextType {
  wallet: WalletData | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refreshWallet: () => Promise<void>;
  fetchTransactions: (limit?: number, period?: string) => Promise<void>;
  spendCoins: (amount: number, description: string, reference_id?: number) => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode; userId: number }> = ({ 
  children, 
  userId 
}) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWallet = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/balance?user_id=${userId}&action=balance`);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки кошелька');
      }

      const data = await response.json();
      setWallet(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      console.error('Ошибка загрузки кошелька:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (limit: number = 20, period?: string) => {
    if (!userId) return;

    try {
      let url = `/api/balance?user_id=${userId}&action=transactions&limit=${limit}`;
      if (period) {
        url += `&period=${period}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки транзакций');
      }

      const data = await response.json();
      setTransactions(data.transactions);
    } catch (err) {
      console.error('Ошибка загрузки транзакций:', err);
    }
  };

  const spendCoins = async (
    amount: number, 
    description: string, 
    reference_id?: number
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      const response = await fetch('/api/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          action: 'spend_coins',
          amount,
          description,
          reference_id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка списания коинов');
      }

      const data = await response.json();
      
      // Обновляем баланс после успешного списания
      await refreshWallet();
      
      // Обновляем транзакции
      await fetchTransactions();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка списания коинов');
      console.error('Ошибка списания коинов:', err);
      return false;
    }
  };

  // Автоматическая загрузка при смене пользователя
  useEffect(() => {
    if (userId) {
      refreshWallet();
    }
  }, [userId]);

  const value = {
    wallet,
    transactions,
    loading,
    error,
    refreshWallet,
    fetchTransactions,
    spendCoins
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Хук для простого отображения баланса без контекста
export const useBalanceOnly = (userId: number) => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/balance?user_id=${userId}&action=balance`);
        if (response.ok) {
          const data = await response.json();
          setBalance(data.balance || 0);
        }
      } catch (err) {
        console.error('Ошибка загрузки баланса:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [userId]);

  return { balance, loading };
};