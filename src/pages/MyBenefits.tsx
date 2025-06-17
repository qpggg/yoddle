import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, Modal, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { useUser } from '../hooks/useUser';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: 'easeOut' }
  }
};

const buttonStyle = {
  background: '#750000',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '12px 32px',
  fontWeight: 600,
  fontSize: 16,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(139,0,0,0.08)',
  transition: 'background 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 48,
  minWidth: 180,
  marginTop: 24
};

const overlayStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.18)',
  zIndex: 9999
};

const modalBoxStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: '2rem 2.5rem',
  boxShadow: '0 8px 32px rgba(139,0,0,0.12)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: 320
};

const MyBenefits: React.FC = () => {
  const { user } = useUser();
  const [allBenefits, setAllBenefits] = useState<{id: number, name: string}[]>([]);
  const [userBenefits, setUserBenefits] = useState<number[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/benefits')
      .then(res => res.json())
      .then(data => setAllBenefits(data.benefits || []));
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/user-benefits?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => setUserBenefits((data.benefits || []).map((b: any) => b.id)));
    }
  }, [user]);

  const handleAdd = (idx: number) => setOpenIdx(idx);
  const handleClose = () => { setOpenIdx(null); setSuccess(false); };
  const handleConfirm = async () => {
    if (!user) return;
    const benefit = allBenefits[openIdx!];
    await fetch('/api/user-benefits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, benefit_id: benefit.id })
    });
    setSuccess(true);
    setUserBenefits(prev => [...prev, benefit.id]);
    setTimeout(handleClose, 1200);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)', pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          <Typography variant="h2" align="center" sx={{ fontWeight: 800, color: '#8B0000', mb: 6, fontSize: { xs: '2.2rem', md: '3rem' } }}>
            Мои льготы
          </Typography>
          <Grid container spacing={4}>
            {allBenefits.map((benefit, idx) => (
              <Grid item xs={12} md={4} key={benefit.id}>
                <motion.div variants={itemVariants}>
                  <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', background: '#fff', boxShadow: '0 8px 32px rgba(139,0,0,0.06)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.3s', '&:hover': { boxShadow: '0 16px 48px rgba(139,0,0,0.10)', transform: 'translateY(-6px)' } }}>
                    <Box sx={{ mb: 2 }}>
                      {/* Можно добавить иконки по benefit.name, если нужно */}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A', mb: 1 }}>{benefit.name}</Typography>
                    <button
                      style={{ ...buttonStyle, opacity: userBenefits.includes(benefit.id) ? 0.5 : 1, pointerEvents: userBenefits.includes(benefit.id) ? 'none' : 'auto' }}
                      onClick={() => handleAdd(idx)}
                    >
                      {userBenefits.includes(benefit.id) ? 'Добавлено' : 'Добавить'}
                    </button>
                  </Paper>
                </motion.div>
                <Modal open={openIdx === idx} onClose={handleClose}>
                  <Box sx={overlayStyle as any}>
                    <Box sx={modalBoxStyle as any}>
                      {!success ? <>
                        <Typography variant="h6" sx={{ mb: 3, color: '#8B0000', fontWeight: 700 }}>Вы уверены в своем выборе?</Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button variant="contained" sx={{ background: '#750000', color: '#fff', fontWeight: 600, px: 4, borderRadius: 2, boxShadow: 'none', '&:hover': { background: '#8B0000' } }} onClick={handleConfirm}>Да</Button>
                          <Button variant="outlined" sx={{ color: '#750000', borderColor: '#750000', fontWeight: 600, px: 4, borderRadius: 2, boxShadow: 'none', '&:hover': { borderColor: '#8B0000', color: '#8B0000' } }} onClick={handleClose}>Нет</Button>
                        </Box>
                      </> : <Typography variant="h6" sx={{ color: '#8B0000', fontWeight: 700 }}>Льгота добавлена!</Typography>}
                    </Box>
                  </Box>
                </Modal>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default MyBenefits; 