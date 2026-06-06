import React, { useState } from 'react';
import { Container, Grid, Card, Text, Group, Title, SimpleGrid, Table, Button, Badge, Stack, Progress, Box } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconShoppingCart, IconCash, IconClock, IconPercentage, IconFilter, IconX, IconBuildingBank, IconWallet, IconUsersGroup, IconPackage, IconBuildingFactory, IconClipboardList, IconBell, IconAlertTriangle, IconArrowUpRight } from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDashboard, useErpSummary } from '../api/hooks';
import { CardSkeleton } from '../components/Skeleton';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import { IconLayoutDashboard } from '@tabler/icons-react';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('kk-KZ', { style: 'currency', currency: 'KZT', minimumFractionDigits: 0 }).format(value);

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#ec4899', '#f43f5e', '#06b6d4'];

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const buildFilters = () => {
    const f: Record<string, string> = {};
    if (dateFrom) f.dateFrom = dateFrom.toISOString();
    if (dateTo) f.dateTo = dateTo.toISOString();
    return Object.keys(f).length > 0 ? f : undefined;
  };

  const { data, isLoading, refetch } = useDashboard(buildFilters());
  const { data: erp } = useErpSummary() as any;

  const clearFilters = () => {
    setDateFrom(null);
    setDateTo(null);
  };

  if (isLoading) {
    return (
      <Container size="xl">
        <PageHeader title={t('dashboard.title')} icon={IconLayoutDashboard} />
        <CardSkeleton count={4} />
      </Container>
    );
  }

  if (!data) return <Container><Text>{t('common.noData')}</Text></Container>;

  return (
    <Container size="xl" px={0}>
      <PageHeader
        title={t('dashboard.title')}
        description="Обзор за сегодня: заказы, финансы, склад, производство"
        icon={IconLayoutDashboard}
        actions={
          <>
            <DatePickerInput placeholder={t('report.dateFrom')} value={dateFrom} onChange={setDateFrom} clearable size="sm" w={150} />
            <DatePickerInput placeholder={t('report.dateTo')} value={dateTo} onChange={setDateTo} clearable size="sm" w={150} />
            <Button size="sm" leftSection={<IconFilter size={14} />} onClick={() => refetch()} variant="light">
              {t('report.applyFilter')}
            </Button>
            {(dateFrom || dateTo) && (
              <Button size="sm" variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={clearFilters}>
                {t('common.clear')}
              </Button>
            )}
          </>
        }
      />

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
        <KpiCard
          label={t('dashboard.todayOrders')}
          value={data.totalOrdersToday}
          icon={IconShoppingCart}
          gradient={['#6366f1', '#8b5cf6']}
          onClick={() => navigate('/orders')}
        />
        <KpiCard
          label={t('dashboard.todayRevenue')}
          value={formatCurrency(data.revenueToday)}
          icon={IconCash}
          gradient={['#10b981', '#14b8a6']}
          onClick={() => navigate('/reports')}
        />
        <KpiCard
          label={t('dashboard.pendingOrders')}
          value={data.pendingOrders}
          icon={IconClock}
          gradient={['#f59e0b', '#f97316']}
          onClick={() => navigate('/orders')}
        />
        <KpiCard
          label={t('dashboard.inventoryAccuracy')}
          value={`${data.inventoryAccuracy}%`}
          icon={IconPercentage}
          gradient={['#06b6d4', '#3b82f6']}
          onClick={() => navigate('/inventory')}
        />
      </SimpleGrid>

      {erp && (
        <Box mb="xl">
          <Group justify="space-between" mb="md" px="xs">
            <Group gap="xs">
              <Title order={4} fw={700} style={{ letterSpacing: '-0.3px' }}>ERP Overview</Title>
              <Badge variant="light" color="indigo" size="sm" radius="sm">ERP</Badge>
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md">
            <KpiCard
              label="Касса (наличные)"
              value={formatCurrency(erp.cash?.totalBalance || 0)}
              icon={IconWallet}
              hint={`${erp.cash?.registersCount || 0} касс`}
              gradient={['#10b981', '#22c55e']}
              onClick={() => navigate('/cash')}
            />
            <KpiCard
              label="Банк (безналичные)"
              value={formatCurrency(erp.bank?.totalBalance || 0)}
              icon={IconBuildingBank}
              hint={`${erp.bank?.accountsCount || 0} счетов`}
              gradient={['#3b82f6', '#6366f1']}
              onClick={() => navigate('/bank')}
            />
            <KpiCard
              label="Зарплата к выплате"
              value={formatCurrency(erp.payroll?.totalDue || 0)}
              icon={IconUsersGroup}
              hint={
                <Group gap={4}>
                  {erp.payroll?.unpaidCount || 0} невыплачено
                  {erp.payroll?.overdueCount > 0 && <Badge color="red" size="xs" radius="sm">{erp.payroll.overdueCount} просрочено</Badge>}
                </Group>
              }
              gradient={['#a855f7', '#ec4899']}
              onClick={() => navigate('/hr')}
            />
            <KpiCard
              label="Складские остатки"
              value={formatCurrency(erp.stock?.totalValue || 0)}
              icon={IconPackage}
              hint={
                <Group gap={4}>
                  {erp.stock?.positionsCount || 0} позиций
                  {erp.stock?.lowStockItems > 0 && <Badge color="orange" size="xs" radius="sm">{erp.stock.lowStockItems} low</Badge>}
                </Group>
              }
              gradient={['#06b6d4', '#0891b2']}
              onClick={() => navigate('/warehouse')}
            />
          </SimpleGrid>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder shadow="sm" p="lg" style={{ cursor: 'pointer' }} onClick={() => navigate('/production')}>
                <Group justify="space-between" mb="md">
                  <Group gap="xs">
                    <Box style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                    }}>
                      <IconBuildingFactory size={18} />
                    </Box>
                    <Text fw={700}>Производство</Text>
                  </Group>
                  <Badge color="orange" variant="light">{erp.production?.activeOrders || 0} активных</Badge>
                </Group>
                <Group gap="xl" mb="md">
                  <Stack gap={0}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Запланировано</Text>
                    <Text fw={700} size="lg">{erp.production?.planned || 0}</Text>
                  </Stack>
                  <Stack gap={0}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>В работе</Text>
                    <Text fw={700} size="lg">{erp.production?.inProgress || 0}</Text>
                  </Stack>
                </Group>
                <Progress.Root size="lg" radius="xl">
                  <Progress.Section
                    value={((erp.production?.inProgress || 0) / Math.max(erp.production?.activeOrders || 1, 1)) * 100}
                    color="orange"
                  />
                </Progress.Root>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder shadow="sm" p="lg">
                <Group justify="space-between" mb="md">
                  <Group gap="xs">
                    <Box style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                    }}>
                      <IconAlertTriangle size={18} />
                    </Box>
                    <Text fw={700}>Уведомления и задачи</Text>
                  </Group>
                </Group>
                <Group grow>
                  <Box
                    p="md"
                    style={{
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.06) 0%, rgba(245, 158, 11, 0.06) 100%)',
                      border: '1px solid rgba(249, 115, 22, 0.15)',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate('/tasks')}
                  >
                    <Group>
                      <IconClipboardList size={24} color="#f97316" />
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Открытых задач</Text>
                        <Text fw={800} size="xl">{erp.alerts?.openTasks || 0}</Text>
                      </Stack>
                    </Group>
                  </Box>
                  <Box
                    p="md"
                    style={{
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(236, 72, 153, 0.06) 100%)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate('/notifications')}
                  >
                    <Group>
                      <IconBell size={24} color="#ef4444" />
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Непрочитанных</Text>
                        <Text fw={800} size="xl">{erp.alerts?.unreadNotifications || 0}</Text>
                      </Stack>
                    </Group>
                  </Box>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Box>
      )}

      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm" p="lg">
            <Group justify="space-between" mb="md">
              <Title order={5} fw={700}>{t('dashboard.dailyOrders')}</Title>
              <IconArrowUpRight size={18} color="#10b981" />
            </Group>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.ordersPerDay || []}>
                <defs>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fill="url(#ordersGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm" p="lg">
            <Title order={5} mb="md" fw={700}>{t('dashboard.orderStatusBreakdown')}</Title>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.orderStatusDistribution || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  label={({ status, count }) => `${status}: ${count}`}
                  labelLine={false}
                >
                  {(data.orderStatusDistribution || []).map((_item: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm" p="lg">
            <Title order={5} mb="md" fw={700}>{t('dashboard.revenueTrend')}</Title>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.revenueTrend || []}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.1)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm" p="lg">
            <Title order={5} mb="md" fw={700}>{t('dashboard.topProducts')}</Title>
            <Table className="sf-table">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('inventory.name')}</Table.Th>
                  <Table.Th>SKU</Table.Th>
                  <Table.Th>{t('dashboard.quantity')}</Table.Th>
                  <Table.Th>{t('dashboard.revenue')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(data.topProducts || []).map((p: any) => (
                  <Table.Tr key={p.sku}>
                    <Table.Td><Text fw={500}>{p.name}</Text></Table.Td>
                    <Table.Td><code style={{ fontSize: 11, color: '#6366f1' }}>{p.sku}</code></Table.Td>
                    <Table.Td>{p.totalQty}</Table.Td>
                    <Table.Td><Text fw={600} c="teal">{formatCurrency(p.revenue)}</Text></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
