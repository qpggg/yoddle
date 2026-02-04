import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  InputAdornment,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';

const AdminFinance: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string; balance?: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    const uid = userId.trim();
    const amt = Number(amount);
    if (!uid) {
      setResult({ type: 'error', message: 'Укажите ID пользователя (например 6)' });
      return;
    }
    if (!amt || amt <= 0 || !Number.isFinite(amt)) {
      setResult({ type: 'error', message: 'Укажите положительную сумму коинов' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: uid,
          amount: amt,
          description: description.trim() || `Начисление администратором: ${amt} коинов`,
          transaction_type: 'admin_add',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ type: 'error', message: data.error || `Ошибка ${res.status}` });
        return;
      }
      setResult({
        type: 'success',
        message: `Начислено ${data.amount} коинов пользователю ${uid}. Баланс: ${data.balance_before} → ${data.balance_after}`,
        balance: data.balance,
      });
      setAmount('');
      setDescription('');
    } catch (err) {
      setResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Ошибка сети',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 4, minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#8B0000', mb: 3 }}>
          Финансы
        </Typography>

        <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Финансовая сводка и отчёты. Будет расширено по запросу руководства.
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#8B0000', mb: 2 }}>
            Начисление коинов сотрудникам
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Укажите ID пользователя (например 6), сумму коинов и при необходимости описание. Транзакция записывается в историю.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
            <TextField
              label="ID пользователя"
              placeholder="например 6"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              fullWidth
              type="text"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#8B0000' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Сумма коинов"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              fullWidth
              type="number"
              inputProps={{ min: 1, step: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoneyIcon sx={{ color: '#8B0000' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Описание (необязательно)"
              placeholder="Тестовое начисление"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              maxRows={2}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DescriptionIcon sx={{ color: '#8B0000' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                alignSelf: 'flex-start',
                borderRadius: 2,
                bgcolor: '#8B0000',
                '&:hover': { bgcolor: '#A52A2A' },
              }}
            >
              {loading ? 'Начисление…' : 'Начислить коины'}
            </Button>
          </Box>

          {result && (
            <Alert
              severity={result.type}
              onClose={() => setResult(null)}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              {result.message}
              {result.balance != null && (
                <Typography component="span" sx={{ display: 'block', mt: 0.5 }}>
                  Текущий баланс: {result.balance} коинов
                </Typography>
              )}
            </Alert>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminFinance;
