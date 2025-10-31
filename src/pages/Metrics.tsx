import React, { useState } from 'react';
import { Container, Typography, Box, Grid, Card, Button, Chip, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import {
  TrendingUpIcon,
  BarChart3Icon,
  DollarSignIcon,
  UsersIcon,
  TargetIcon,
  ArrowUpIcon,
  InfoIcon
} from 'lucide-react';

// SaaS метрики данные
// Тарифная сетка: 250₽ для малых, 350₽ для средних, 450₽ для крупных
const calculateWeightedAveragePrice = (totalEmployees: number, totalCompanies: number): number => {
  // Модель распределения компаний:
  // 60% - малые (до 50 сотр.), средний размер 25 сотр.
  // 30% - средние (51-200 сотр.), средний размер 100 сотр.  
  // 10% - крупные (200+ сотр.), средний размер по остатку
  
  const smallCompaniesRatio = 0.6;
  const mediumCompaniesRatio = 0.3;
  
  const smallCompanies = Math.floor(totalCompanies * smallCompaniesRatio);
  const mediumCompanies = Math.floor(totalCompanies * mediumCompaniesRatio);
  
  // Распределяем сотрудников
  const smallAvgSize = 25;
  const mediumAvgSize = 100;
  
  const smallEmployees = smallCompanies * smallAvgSize;
  const mediumEmployees = mediumCompanies * mediumAvgSize;
  const largeEmployees = Math.max(0, totalEmployees - smallEmployees - mediumEmployees);
  
  // Рассчитываем выручку по группам
  const smallRevenue = smallEmployees * 250;
  const mediumRevenue = mediumEmployees * 350;
  const largeRevenue = largeEmployees * 450;
  
  const totalRevenue = smallRevenue + mediumRevenue + largeRevenue;
  
  // Средневзвешенная цена
  return totalEmployees > 0 ? totalRevenue / totalEmployees : 350;
};

const GROSS_MARGIN = 0.80;
const COGS_SHARE = 0.20;
const OPEX_SHARE_BY_YEAR = [0.75, 0.60, 0.50, 0.45, 0.45];
const EMPLOYEES_BY_YEAR = [9300, 37000, 93000, 222000, 556000];
const COMPANIES_BY_YEAR = [100, 500, 1500, 3500, 8000];

// Форматирование чисел
const formatKMB = (value: number): string => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1).replace('.0', '') + 'B';
  if (abs >= 1_000_000) return (value / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (abs >= 1_000) return (value / 1_000).toFixed(1).replace('.0', '') + 'K';
  return Math.round(value).toString();
};

const formatCurrency = (value: number): string => {
  return formatKMB(value) + ' ₽';
};

const formatSpaced = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

// Анимационные варианты
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.15,
      ease: 'easeOut'
    }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: 'easeOut'
    }
  }
};

const cardStyle = {
  background: '#fff',
  borderRadius: '24px',
  padding: '2rem',
  boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
  border: '1px solid #eee',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
};

// Интерфейсы
interface MetricRow {
  year: number;
  employees: number;
  companies: number;
  mrr: number;
  arr: number;
  cogs: number;
  grossProfit: number;
  opex: number;
  ebitda: number;
  ebitdaMargin: number;
  arpu: number;
  avgEmployeesPerCompany: number;
  acvPerCompany: number;
}

// Вычисление метрик
const computeMetrics = (): MetricRow[] => {
  return Array.from({ length: 5 }, (_, idx) => {
    const year = idx + 1;
    const employees = EMPLOYEES_BY_YEAR[idx];
    const companies = COMPANIES_BY_YEAR[idx];
    const opexShare = OPEX_SHARE_BY_YEAR[idx];

    // Вычисляем средневзвешенную цену с учётом распределения по размерам
    const avgEmployeesPerCompany = companies ? employees / companies : 0;
    const weightedAvgPrice = calculateWeightedAveragePrice(employees, companies);
    
    const mrr = employees * weightedAvgPrice;
    const arr = mrr * 12;
    const cogs = arr * COGS_SHARE;
    const grossProfit = arr * GROSS_MARGIN;
    const opex = arr * opexShare;
    const ebitda = grossProfit - opex;
    const ebitdaMargin = arr ? ebitda / arr : 0;
    const arpu = Math.round(weightedAvgPrice);
    const acvPerCompany = avgEmployeesPerCompany * weightedAvgPrice * 12;

    return {
      year,
      employees,
      companies,
      mrr,
      arr,
      cogs,
      grossProfit,
      opex,
      ebitda,
      ebitdaMargin,
      arpu,
      avgEmployeesPerCompany,
      acvPerCompany,
    };
  });
};

// Компонент для карточки с ключевыми метриками
interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  growth?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, gradient, growth }) => (
  <motion.div variants={itemVariants}>
    <Card sx={{ ...cardStyle, '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A', fontSize: '14px' }}>
            {title}
          </Typography>
          {growth && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ArrowUpIcon size={14} color="#059669" />
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                {growth}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 900, color: '#8B0000', mb: 1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ color: '#666', fontSize: '13px' }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  </motion.div>
);

// Главный компонент страницы
const Metrics: React.FC = () => {
  const [metrics] = useState<MetricRow[]>(computeMetrics());
  const [selectedYear, setSelectedYear] = useState<number>(5);

  const currentMetrics = metrics[selectedYear - 1];

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FBF7F7 0%, #F8F8F8 100%)' }}>
      <Container maxWidth="xl" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Hero секция */}
          <motion.div variants={itemVariants}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Box
                sx={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(139,0,0,0.08), rgba(178,34,34,0.08))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}
              >
                <BarChart3Icon style={{ color: '#8B0000', fontSize: 40 }} />
              </Box>
              <Typography variant="h2" sx={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 900, color: '#1A1A1A', mb: 2 }}>
                SaaS Метрики Yoddle
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500, color: '#666', maxWidth: '700px', mx: 'auto', lineHeight: 1.6 }}>
                Прогноз ключевых финансовых показателей на 5 лет с детализацией по годам
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="250-450 ₽/сотр./мес" color="primary" sx={{ background: 'linear-gradient(135deg, #8B0000, #B22222)', color: 'white' }} />
                <Chip label="GM: 80%" variant="outlined" />
                <Chip label="COGS: 20%" variant="outlined" />
              </Box>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="250₽ до 50 сотр." size="small" variant="outlined" />
                <Chip label="350₽ 51-200 сотр." size="small" variant="outlined" />
                <Chip label="450₽ 200+ сотр." size="small" variant="outlined" />
              </Box>
            </Box>
          </motion.div>

          {/* Ключевые метрики по выбранному году */}
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A', mb: 2, textAlign: 'center' }}>
                Ключевые показатели — Год {selectedYear}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map((year) => (
                  <Button
                    key={year}
                    variant={selectedYear === year ? 'contained' : 'outlined'}
                    onClick={() => setSelectedYear(year)}
                    sx={{
                      minWidth: '50px',
                      background: selectedYear === year ? 'linear-gradient(135deg, #8B0000, #B22222)' : 'transparent',
                      '&:hover': {
                        background: selectedYear === year ? 'linear-gradient(135deg, #8B0000, #B22222)' : 'rgba(139,0,0,0.04)'
                      }
                    }}
                  >
                    {year}
                  </Button>
                ))}
              </Box>
            </Box>
          </motion.div>

          {/* Карточки с ключевыми метриками */}
          <motion.div variants={containerVariants}>
            <Grid container spacing={3} sx={{ mb: 6 }}>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="ARR"
                  value={formatCurrency(currentMetrics.arr)}
                  subtitle="Годовая повторяющаяся выручка"
                  icon={<DollarSignIcon size={24} color="white" />}
                  gradient="linear-gradient(135deg, #8B0000, #B22222)"
                  growth={selectedYear > 1 ? `+${Math.round((currentMetrics.arr / metrics[selectedYear - 2].arr - 1) * 100)}%` : undefined}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="EBITDA"
                  value={formatCurrency(currentMetrics.ebitda)}
                  subtitle={`Маржа: ${(currentMetrics.ebitdaMargin * 100).toFixed(1)}%`}
                  icon={<TrendingUpIcon size={24} color="white" />}
                  gradient="linear-gradient(135deg, #059669, #10B981)"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Сотрудники"
                  value={formatKMB(currentMetrics.employees)}
                  subtitle={`В ${formatKMB(currentMetrics.companies)} компаниях`}
                  icon={<UsersIcon size={24} color="white" />}
                  gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="ACV на компанию"
                  value={formatCurrency(currentMetrics.acvPerCompany)}
                  subtitle={`AVG: ${currentMetrics.avgEmployeesPerCompany.toFixed(1)} сотр/ком`}
                  icon={<TargetIcon size={24} color="white" />}
                  gradient="linear-gradient(135deg, #F59E0B, #D97706)"
                />
              </Grid>
            </Grid>
          </motion.div>

          {/* Детальная таблица */}
          <motion.div variants={itemVariants}>
            <Card sx={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <Box sx={{ p: 3, background: 'linear-gradient(135deg, #8B0000, #B22222)', color: 'white' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Детальная таблица метрик
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Все показатели по годам с расшифровкой формул
                </Typography>
              </Box>
              
              <Box sx={{ width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '17px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '20px 8px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e9ecef', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '4%' }}>Год</th>
                      <th style={{ padding: '20px 8px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e9ecef', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '8%' }}>Сотрудн.</th>
                      <th style={{ padding: '20px 8px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e9ecef', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '7%' }}>Компании</th>
                      <th style={{ padding: '20px 8px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e9ecef', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '7%' }}>MRR</th>
                      <th style={{ padding: '20px 8px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e9ecef', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '7%' }}>ARR</th>
                      <th style={{ padding: '20px 8px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e9ecef', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '7%' }}>COGS</th>
                      <th style={{ padding: '20px 8px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e9ecef', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '9%' }}>Gross Profit</th>
                      <th style={{ padding: '20px 8px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e9ecef', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '7%' }}>OPEX</th>
                       <th style={{ padding: '20px 8px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e9ecef', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '7%' }}>EBITDA</th>
                       <th style={{ padding: '20px 8px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e9ecef', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '8%' }}>EBITDA %</th>
                       <th style={{ padding: '20px 8px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e9ecef', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '8%' }}>ARPU/мес</th>
                       <th style={{ padding: '20px 8px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e9ecef', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '10%' }}>
                         <Tooltip title="Среднее количество сотрудников на компанию">
                           <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                             AVG сотр/ком
                             <InfoIcon size={14} />
                           </Box>
                         </Tooltip>
                       </th>
                       <th style={{ padding: '20px 8px', textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e9ecef', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '13%' }}>
                         <Tooltip title="Средний годовой чек на компанию">
                           <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                             ACV ком/год
                             <InfoIcon size={14} />
                           </Box>
                         </Tooltip>
                       </th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((row, idx) => (
                      <motion.tr
                        key={row.year}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        style={{
                          background: row.year === selectedYear ? 'rgba(139,0,0,0.04)' : idx % 2 === 0 ? '#fff' : '#f8f9fa',
                          borderLeft: row.year === selectedYear ? '3px solid #8B0000' : 'none'
                        }}
                      >
                        <td style={{ padding: '18px 8px', fontWeight: row.year === selectedYear ? 700 : 400, borderBottom: '1px solid #e9ecef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                          {row.year}
                        </td>
                        <td style={{ padding: '18px 8px', borderBottom: '1px solid #e9ecef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                          {formatSpaced(row.employees)}
                        </td>
                        <td style={{ padding: '18px 8px', borderBottom: '1px solid #e9ecef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                          {formatSpaced(row.companies)}
                        </td>
                        <td style={{ padding: '18px 8px', textAlign: 'center', borderBottom: '1px solid #e9ecef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formatCurrency(row.mrr)}
                        </td>
                        <td style={{ padding: '18px 8px', textAlign: 'center', borderBottom: '1px solid #e9ecef', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formatCurrency(row.arr)}
                        </td>
                        <td style={{ padding: '18px 8px', textAlign: 'center', borderBottom: '1px solid #e9ecef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formatCurrency(row.cogs)}
                        </td>
                        <td style={{ padding: '18px 8px', textAlign: 'center', borderBottom: '1px solid #e9ecef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formatCurrency(row.grossProfit)}
                        </td>
                        <td style={{ padding: '18px 8px', textAlign: 'center', borderBottom: '1px solid #e9ecef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formatCurrency(row.opex)}
                        </td>
                        <td style={{ padding: '18px 8px', textAlign: 'center', borderBottom: '1px solid #e9ecef', color: row.ebitda > 0 ? '#059669' : '#DC2626', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formatCurrency(row.ebitda)}
                        </td>
                        <td style={{ padding: '18px 8px', textAlign: 'center', borderBottom: '1px solid #e9ecef', color: row.ebitda > 0 ? '#059669' : '#DC2626', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {(row.ebitdaMargin * 100).toFixed(1)}%
                        </td>
                        <td style={{ padding: '18px 8px', textAlign: 'center', borderBottom: '1px solid #e9ecef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.arpu} ₽
                        </td>
                         <td style={{ padding: '18px 8px', textAlign: 'center', borderBottom: '1px solid #e9ecef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                           {row.avgEmployeesPerCompany.toFixed(1)}
                         </td>
                         <td style={{ padding: '18px 8px', textAlign: 'center', borderBottom: '1px solid #e9ecef', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                           {formatCurrency(row.acvPerCompany)}
                         </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </Box>

              {/* Пояснения */}
              <Box sx={{ p: 3, background: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1A1A1A' }}>
                  Пояснения к метрикам
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      <strong>MRR</strong> — Monthly Recurring Revenue (сотрудники × цена по тарифу)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      <strong>ARR</strong> — Annual Recurring Revenue (MRR × 12)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      <strong>COGS</strong> — Cost of Goods Sold (ARR × 20%)
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      <strong>OPEX</strong> — Операционные расходы (% от ARR по годам)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      <strong>EBITDA</strong> — Gross Profit - OPEX
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      <strong>ACV</strong> — Annual Contract Value на компанию
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Card>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Metrics;
