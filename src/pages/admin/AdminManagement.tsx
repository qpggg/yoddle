import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const AdminManagement: React.FC = () => {
  return (
    <Box sx={{ py: 4, minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#8B0000', mb: 3 }}>
          Управление
        </Typography>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography color="text.secondary">
            Управление льготами и настройками. Минимум для контроля льгот — далее по запросу.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminManagement;
