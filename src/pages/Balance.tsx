import React from 'react';
import { Box, Typography, Card, CardContent, Button, List, ListItem, ListItemText, Chip, Divider, Skeleton, ToggleButtonGroup, ToggleButton, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../hooks/useUser';
import { BarChart3 as BarChart3Icon } from 'lucide-react';

type Tx = {
  id: number;
  transaction_type: string;
  amount: number;
  description?: string;
  reference_id?: string;
  benefit_name?: string;
  created_at: string;
};

const typeToLabel: Record<string, { label: string; tone: 'positive' | 'negative' | 'neutral' }> = {
  monthly_allowance: { label: 'Пополнение', tone: 'positive' },
  credit: { label: 'Пополнение', tone: 'positive' },
  admin_add: { label: 'Пополнение (админ)', tone: 'positive' },
  benefit_purchase: { label: 'Покупка', tone: 'neutral' },
  refund: { label: 'Возврат', tone: 'positive' },
  debit: { label: 'Списание', tone: 'negative' },
  admin_remove: { label: 'Списание (админ)', tone: 'negative' },
};

const BalancePage: React.FC = () => {
  const { user } = useUser();
  const [loadingBalance, setLoadingBalance] = React.useState(true);
  const [loadingList, setLoadingList] = React.useState(true);
  const [balance, setBalance] = React.useState<{ balance: number; total_earned: number; total_spent: number } | null>(null);
  const [txs, setTxs] = React.useState<Tx[]>([]);
  const [filter, setFilter] = React.useState<'all' | 'topup' | 'purchase' | 'debit'>('all');
  const [page, setPage] = React.useState(0);
  const pageSize = 5;
  const [hasMore, setHasMore] = React.useState(true);
  const [policyHint, setPolicyHint] = React.useState<string>('');

  const loadBase = React.useCallback(async () => {
    if (!user?.id) return;
    setLoadingBalance(true);
    try {
      const [b, pol] = await Promise.all([
        fetch(`/api/wallet?user_id=${user.id}`).then((r) => r.json()),
        fetch(`/api/wallet/policy?user_id=${user.id}`).then((r) => r.json()),
      ]);
      if (b && b.success) setBalance({ balance: Number(b.balance || 0), total_earned: Number(b.total_earned || 0), total_spent: Number(b.total_spent || 0) });
      if (pol && pol.success) {
        setPolicyHint(pol.hint || '');
      } else {
        // Fallback подсказки по умолчанию
        const now = new Date();
        const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
        setPolicyHint(`Следующее начисление: ${next.toLocaleDateString('ru-RU')} • Политика переноса: без переноса`);
      }
    } finally {
      setLoadingBalance(false);
    }
  }, [user?.id]);

  const loadPage = React.useCallback(async (reset = false) => {
    if (!user?.id) return;
    setLoadingList(true);
    const nextOffset = reset ? 0 : page * pageSize;
    const res = await fetch(`/api/wallet/transactions?user_id=${user.id}&limit=${pageSize}&offset=${nextOffset}&type=${filter}`);
    const data = await res.json();
    if (data && data.success) {
      const items: Tx[] = data.data || [];
      setHasMore(items.length === pageSize);
      setTxs(reset ? items : [...txs, ...items]);
      if (reset) setPage(1); else setPage(page + 1);
    }
    setLoadingList(false);
  }, [user?.id, page, pageSize, filter, txs]);

  React.useEffect(() => { loadBase(); }, [loadBase]);
  React.useEffect(() => {
    setPage(0);
    setHasMore(true);
    setTxs([]);
    loadPage(true);
  }, [filter, user?.id]);

  return (
    <motion.div className="balance-page" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeInOut' }}>
      <Box sx={{ maxWidth: 960, mx: 'auto', my: 6, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box sx={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(139,0,0,0.3)'
          }}>
            <Box component="img" src="/coins.png" alt="coins" sx={{ width: 32, height: 32 }} />
          </Box>
          <Box>
            <Typography variant="h3" sx={{ 
              fontWeight: 900, 
              color: '#1A1A1A',
              fontSize: { xs: '2rem', md: '2.5rem' },
              lineHeight: 1.1,
              letterSpacing: '-1px'
            }}>
              Финансовый баланс
            </Typography>
            <Typography variant="h6" sx={{ 
              fontWeight: 500, 
              color: '#666',
              mt: 0.5
            }}>
              Управление Y-coins и историей операций
            </Typography>
          </Box>
        </Box>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card sx={{ 
            borderRadius: '24px', 
            background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
            color: '#fff',
            boxShadow: '0 20px 40px rgba(139,0,0,0.3), 0 8px 16px rgba(0,0,0,0.1)', 
            mb: 4, 
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Декоративные элементы */}
            <Box sx={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              zIndex: 0
            }} />
            <Box sx={{
              position: 'absolute',
              bottom: -50,
              left: -50,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              zIndex: 0
            }} />
            
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Box component="img" src="/coins.png" alt="coins" sx={{ width: 28, height: 28 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                  Ваш баланс Y‑coins
                </Typography>
              </Box>
              
              {loadingBalance ? (
                <Skeleton variant="text" width={220} height={56} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Typography variant="h2" sx={{ 
                      color: '#fff', 
                      fontWeight: 900,
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      fontSize: { xs: '2.5rem', md: '3.5rem' }
                    }}>
                      {(balance?.balance ?? 0).toLocaleString('ru-RU')}
                    </Typography>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Box component="img" src="/coins.png" alt="coins" sx={{ width: 32, height: 32 }} />
                    </motion.div>
                  </Box>
                </motion.div>
              )}
              
              <Box sx={{ 
                display: 'flex', 
                gap: 4, 
                color: 'rgba(255,255,255,0.8)',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  px: 2,
                  py: 1
                }}>
                  <span style={{ fontWeight: 600 }}>Начислено: {(balance?.total_earned ?? 0).toLocaleString('ru-RU')}</span>
                  <Box component="img" src="/coins.png" alt="coins" sx={{ width: 16, height: 16 }} />
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  px: 2,
                  py: 1
                }}>
                  <span style={{ fontWeight: 600 }}>Потрачено: {(balance?.total_spent ?? 0).toLocaleString('ru-RU')}</span>
                  <Box component="img" src="/coins.png" alt="coins" sx={{ width: 16, height: 16 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Box sx={{ display: 'flex', gap: 2, mt: -2, mb: 3, justifyContent: 'center' }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                size="medium"
                onClick={async () => {
                  if (!user?.id) return;
                  try {
                    await fetch('/api/wallet/refresh', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ user_id: user.id })
                    });
                    await loadBase();
                    await loadPage(true);
                  } catch {}
                }}
                sx={{
                  background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                  color: '#fff',
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3,
                  py: 1.5,
                  boxShadow: '0 8px 24px rgba(139,0,0,0.3)',
                  '&:hover': { 
                    background: 'linear-gradient(135deg, #B22222 0%, #DC143C 100%)',
                    boxShadow: '0 12px 32px rgba(139,0,0,0.4)'
                  }
                }}
              >
                Обновить баланс
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outlined"
                size="medium"
                href="/my-benefits"
                sx={{
                  borderColor: '#8B0000',
                  color: '#8B0000',
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3,
                  py: 1.5,
                  borderWidth: '2px',
                  '&:hover': { 
                    borderColor: '#8B0000',
                    background: 'rgba(139,0,0,0.05)',
                    borderWidth: '2px'
                  }
                }}
              >
                Каталог льгот
              </Button>
            </motion.div>
          </Box>
        </motion.div>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(139,0,0,0.3)'
          }}>
            <BarChart3Icon size={28} color="#fff" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1A1A1A' }}>
            История операций
          </Typography>
        </Box>
      {policyHint && (
        <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>
          {policyHint}
        </Alert>
      )}
      <Box sx={{ mb: 1.5 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={filter}
          onChange={(_, v) => v && setFilter(v)}
          sx={{
            borderRadius: 2,
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
              borderColor: '#eee',
              outline: 'none',
              boxShadow: 'none',
              fontFamily: (theme) => theme.typography.fontFamily
            },
            '& .Mui-selected': {
              bgcolor: '#8B0000',
              color: '#fff',
              borderColor: 'transparent',
              outline: 'none',
              boxShadow: 'none',
            },
            '& .MuiToggleButton-root:hover': {
              backgroundColor: 'rgba(139,0,0,0.06)'
            }
          }}
        >
          <ToggleButton value="all">Все</ToggleButton>
          <ToggleButton value="topup">Пополнения</ToggleButton>
          <ToggleButton value="purchase">Покупки</ToggleButton>
          <ToggleButton value="debit">Списания</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Card sx={{ 
        borderRadius: '20px', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04)',
        border: '1px solid rgba(139,0,0,0.1)'
      }}>
        <AnimatePresence mode="wait">
        <motion.div key={filter + '-' + page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
        <List>
           {loadingList ? (
            Array.from({ length: 6 }).map((_, i) => (
              <ListItem key={i}>
                <Skeleton variant="rectangular" width="100%" height={24} />
              </ListItem>
            ))
          ) : txs.length === 0 ? (
            <ListItem>
              <ListItemText primary="Пока нет операций" />
            </ListItem>
          ) : (
            txs.map((tx, idx) => (
              <React.Fragment key={tx.id}>
                <ListItem sx={{ alignItems: 'flex-start' }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Chip
                            size="small"
                            label={typeToLabel[tx.transaction_type]?.label || tx.transaction_type}
                            sx={{
                              fontWeight: 800,
                              color: typeToLabel[tx.transaction_type]?.tone === 'negative' ? '#fff' : '#fff',
                              bgcolor: typeToLabel[tx.transaction_type]?.tone === 'positive' ? '#8B0000' : typeToLabel[tx.transaction_type]?.tone === 'negative' ? '#B22222' : '#8B0000',
                              borderRadius: '999px'
                            }}
                          />
                           <Typography sx={{ fontWeight: 600 }}>
                            {(tx.transaction_type === 'benefit_purchase' || tx.transaction_type === 'refund') && tx.benefit_name
                              ? `Льгота: ${tx.benefit_name}`
                              : tx.description || ''}
                           </Typography>
                        </Box>
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                           <Typography sx={{ fontWeight: 900, color: tx.transaction_type.match(/allowance|credit|add|refund/) ? '#2e7d32' : '#b00020' }}>
                             {`${tx.transaction_type.match(/allowance|credit|add|refund/) ? '+' : '-'}${Number(tx.amount).toLocaleString('ru-RU')}`}
                           </Typography>
                           <Box component="img" src="/coins.png" alt="coins" sx={{ width: 16, height: 16 }} />
                        </Box>
                        {/* Кнопка возврата из истории скрыта по требованию */}
                      </Box>
                    }
                    secondary={new Date(tx.created_at).toLocaleString('ru-RU')}
                  />
                </ListItem>
                {idx < txs.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))
          )}
        </List>
        </motion.div>
        </AnimatePresence>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
          {hasMore && !loadingList && txs.length > 0 && txs.length % pageSize === 0 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outlined" 
                onClick={() => loadPage()} 
                sx={{ 
                  borderRadius: '16px',
                  borderColor: '#8B0000',
                  color: '#8B0000',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  borderWidth: '2px',
                  '&:hover': {
                    borderColor: '#8B0000',
                    background: 'rgba(139,0,0,0.05)',
                    borderWidth: '2px'
                  }
                }}
              >
                Показать ещё
              </Button>
            </motion.div>
          )}
        </Box>
      </Box>
    </motion.div>
  );
};

export default BalancePage;


