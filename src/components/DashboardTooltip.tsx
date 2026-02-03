import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { HelpCircle, X } from 'lucide-react';

interface DashboardTooltipProps {
  title: string;
  content: string | React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  iconColor?: string; // Цвет иконки (для темных фонов)
  iconBgColor?: string; // Цвет фона иконки
}

const DashboardTooltip: React.FC<DashboardTooltipProps> = ({
  title,
  content,
  position = 'top-right',
  iconColor = '#750000',
  iconBgColor = 'rgba(117, 0, 0, 0.1)'
}) => {
  const [open, setOpen] = useState(false);

  const positionStyles = {
    'top-right': { top: '12px', right: '12px' },
    'top-left': { top: '12px', left: '12px' },
    'bottom-right': { bottom: '12px', right: '12px' },
    'bottom-left': { bottom: '12px', left: '12px' }
  };

  return (
    <>
      <motion.div
        data-tooltip-trigger
        style={{
          position: 'absolute',
          ...positionStyles[position],
          zIndex: 10,
          cursor: 'pointer'
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
      >
        <Box
          sx={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: iconBgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${iconColor}40`,
            transition: 'all 0.2s ease',
            '&:hover': {
              background: iconBgColor.replace('0.1', '0.15').replace('0.25', '0.3'),
              borderColor: `${iconColor}60`
            }
          }}
        >
          <HelpCircle size={16} color={iconColor} />
        </Box>
      </motion.div>

      <Dialog
        open={open}
        onClose={(e, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            setOpen(false);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            background: '#ffffff',
            margin: '16px'
          },
          onClick: (e: React.MouseEvent) => e.stopPropagation()
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 28px',
            borderBottom: '1px solid #e9ecef',
            background: 'linear-gradient(135deg, #750000 0%, #8B0000 100%)',
            color: 'white',
            margin: 0
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '18px' }}>
            <HelpCircle size={22} />
            {title}
          </Typography>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            sx={{
              color: 'white',
              padding: '8px',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.15)'
              }
            }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent 
          sx={{ 
            padding: '28px',
            '&.MuiDialogContent-root': {
              paddingTop: '28px'
            }
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Typography
            variant="body1"
            sx={{
              color: '#1A1A1A',
              lineHeight: 1.75,
              fontSize: '15px',
              margin: 0,
              padding: 0
            }}
          >
            {content}
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardTooltip;
