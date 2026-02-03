import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { UserCircle, FileText, Gift } from 'lucide-react';

interface OnboardingProgressProps {
  profileCompletion: number;
  hasMoodEntries: boolean;
  hasBenefits: boolean;
}

interface ProgressItem {
  id: string;
  label: string;
  icon: React.ElementType;
  percentage: number;
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  profileCompletion,
  hasMoodEntries,
  hasBenefits
}) => {
  const progressItems: ProgressItem[] = [
    {
      id: 'profile',
      label: 'Профиль',
      icon: UserCircle,
      percentage: profileCompletion
    },
    {
      id: 'mood',
      label: 'Настроение',
      icon: FileText,
      percentage: hasMoodEntries ? 100 : 0
    },
    {
      id: 'benefits',
      label: 'Льготы',
      icon: Gift,
      percentage: hasBenefits ? 100 : 0
    }
  ];

  const overallProgress = Math.round(
    progressItems.reduce((sum, item) => sum + item.percentage, 0) / progressItems.length
  );

  return (
    <div>
      <Box
        sx={{
          background: 'white',
          borderRadius: '12px',
          p: 3,
          boxShadow: '0 6px 24px rgba(117, 0, 0, 0.15), 0 1.5px 6px rgba(0,0,0,0.08)'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: '1.25rem',
            color: '#333',
            mb: 3
          }}
        >
          Прогресс онбординга
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {progressItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <div key={item.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      background: item.percentage === 100 ? '#750000' : '#F8F8F8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <IconComponent 
                      size={18} 
                      color={item.percentage === 100 ? 'white' : '#750000'} 
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography
                        sx={{
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          color: '#333'
                        }}
                      >
                        {item.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: item.percentage === 100 ? '#750000' : '#666'
                        }}
                      >
                        {item.percentage}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={item.percentage}
                      sx={{
                        height: 6,
                        borderRadius: '3px',
                        backgroundColor: '#F0F0F0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: item.percentage === 100 ? '#750000' : '#8B0000',
                          borderRadius: '3px'
                        }
                      }}
                    />
                  </Box>
                </Box>
              </div>
            );
          })}
        </Box>

        <Box
          sx={{
            mt: 3,
            pt: 3,
            borderTop: '1px solid #F0F0F0'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#333'
              }}
            >
              Общий прогресс
            </Typography>
            <Typography
              sx={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#750000'
              }}
            >
              {overallProgress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={overallProgress}
            sx={{
              height: 8,
              borderRadius: '4px',
              backgroundColor: '#F0F0F0',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #8B0000 0%, #750000 100%)',
                borderRadius: '4px'
              }
            }}
          />
        </Box>
      </Box>
    </div>
  );
};

export default OnboardingProgress;
