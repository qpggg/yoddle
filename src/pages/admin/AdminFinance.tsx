import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const AdminFinance: React.FC = () => {
  return (
    <Box sx={{ py: 4, minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#8B0000', mb: 3 }}>
          Финансы
        </Typography>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography color="text.secondary">
            Финансовая сводка и отчёты. Будет расширено по запросу руководства.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminFinance;
