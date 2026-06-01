import React, { useState } from 'react';
import { Container, Grid, Card, Text, Group, Title, SimpleGrid, Table, Button, Badge, Stack, Progress } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconShoppingCart, IconCash, IconClock, IconPercentage, IconFilter, IconX, IconBuildingBank, IconWallet, IconUsersGroup, IconPackage, IconBuildingFactory, IconClipboardList, IconBell, IconAlertTriangle } from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDashboard, useErpSummary } from '../api/hooks';
import { CardSkeleton } from '../components/Skeleton';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('kk-KZ', { style: 'currency', currency: 'KZT', minimumFractionDigits: 0 }).format(value);

const COLORS = ['#1a237e', '#42a5f5', '#66bb6a', '#ffa726', '#ef5350', '#ab47bc', '#26c6da'];

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
        <Title order={3} mb="lg">{t('dashboard.title')}</Title>
        <CardSkeleton count={4} />
      </Container>
    );
  }

  if (!data) return <Container><Text>{t('common.noData')}</Text></Container>;

  const statCards = [
    {
      label: t('dashboard.todayOrders'),
      value: data.totalOrdersToday,
      icon: IconShoppingCart,
      color: 'blue',
    },
    {
      label: t('dashboard.todayRevenue'),
      value: formatCurrency(data.revenueToday),
      icon: IconCash,
      color: 'green',
    },
    {
      label: t('dashboard.pendingOrders'),
      value: data.pendingOrders,
      icon: IconClock,
      color: 'orange',
    },
    {
      label: t('dashboard.inventoryAccuracy'),
      value: `${data.inventoryAccuracy}%`,
      icon: IconPercentage,
      color: 'teal',
    },
  ];

  return (
    <Container size="xl">
      <Group justify="space-between" mb="lg">
        <Title order={3}>{t('dashboard.title')}</Title>
        <Group gap="xs">
          <DatePickerInput placeholder={t('report.dateFrom')} value={dateFrom} onChange={setDateFrom} clearable size="xs" />
          <DatePickerInput placeholder={t('report.dateTo')} value={dateTo} onChange={setDateTo} clearable size="xs" />
          <Button size="xs" leftSection={<IconFilter size={14} />} onClick={() => refetch()}>{t('report.applyFilter')}</Button>
          {(dateFrom || dateTo) && (
            <Button size="xs" variant="light" color="gray" leftSection={<IconX size={14} />} onClick={clearFilters}>
              {t('common.clear')}
            </Button>
          )}
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} withBorder shadow="sm" p="md">
              <Group>
                <Icon size={36} color={`var(--mantine-color-${card.color}-6)`} />
                <div>
                  <Text size="xs" c="dimmed">{card.label}</Text>
                  <Text fw={700} size="xl">{card.value}</Text>
                </div>
              </Group>
            </Card>
          );
        })}
      </SimpleGrid>

      {erp && (
        <Card withBorder shadow="sm" p="md" mb="xl">
          <Title order={4} mb="md">📊 1C-style ERP Overview</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md">
            <Card withBorder p="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/cash')}>
              <Group>
                <IconWallet size={32} color="var(--mantine-color-green-6)" />
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">Касса (наличные)</Text>
                  <Text fw={700} size="lg">{formatCurrency(erp.cash.totalBalance)}</Text>
                  <Text size="xs" c="dimmed">{erp.cash.registersCount} касс</Text>
                </Stack>
              </Group>
            </Card>
            <Card withBorder p="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/bank')}>
              <Group>
                <IconBuildingBank size={32} color="var(--mantine-color-blue-6)" />
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">Банк (безналичные)</Text>
                  <Text fw={700} size="lg">{formatCurrency(erp.bank.totalBalance)}</Text>
                  <Text size="xs" c="dimmed">{erp.bank.accountsCount} счетов</Text>
                </Stack>
              </Group>
            </Card>
            <Card withBorder p="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/hr')}>
              <Group>
                <IconUsersGroup size={32} color="var(--mantine-color-violet-6)" />
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">Зарплата к выплате</Text>
                  <Text fw={700} size="lg">{formatCurrency(erp.payroll.totalDue)}</Text>
                  <Text size="xs" c="dimmed">
                    {erp.payroll.unpaidCount} невыплачено
                    {erp.payroll.overdueCount > 0 && <Badge color="red" size="xs" ml="xs">{erp.payroll.overdueCount} просрочено</Badge>}
                  </Text>
                </Stack>
              </Group>
            </Card>
            <Card withBorder p="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/warehouse')}>
              <Group>
                <IconPackage size={32} color="var(--mantine-color-teal-6)" />
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">Складские остатки</Text>
                  <Text fw={700} size="lg">{formatCurrency(erp.stock.totalValue)}</Text>
                  <Text size="xs" c="dimmed">
                    {erp.stock.positionsCount} позиций
                    {erp.stock.lowStockItems > 0 && <Badge color="orange" size="xs" ml="xs">{erp.stock.lowStockItems} {'< 10'}</Badge>}
                  </Text>
                </Stack>
              </Group>
            </Card>
          </SimpleGrid>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder p="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/production')}>
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <IconBuildingFactory size={20} color="var(--mantine-color-orange-6)" />
                    <Text fw={600}>Производство</Text>
                  </Group>
                  <Badge color="orange">{erp.production.activeOrders} активных</Badge>
                </Group>
                <Group gap="xl">
                  <Stack gap={0}>
                    <Text size="xs" c="dimmed">Запланировано</Text>
                    <Text fw={600}>{erp.production.planned}</Text>
                  </Stack>
                  <Stack gap={0}>
                    <Text size="xs" c="dimmed">В работе</Text>
                    <Text fw={600}>{erp.production.inProgress}</Text>
                  </Stack>
                </Group>
                <Progress.Root size="lg" mt="xs">
                  <Progress.Section value={(erp.production.inProgress / Math.max(erp.production.activeOrders, 1)) * 100} color="orange" />
                </Progress.Root>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder p="sm">
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <IconAlertTriangle size={20} color="var(--mantine-color-red-6)" />
                    <Text fw={600}>Уведомления и задачи</Text>
                  </Group>
                </Group>
                <Group gap="xl">
                  <Card withBorder p="xs" style={{ cursor: 'pointer', flex: 1 }} onClick={() => navigate('/tasks')}>
                    <Group gap="xs">
                      <IconClipboardList size={20} color="var(--mantine-color-orange-6)" />
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed">Открытых задач</Text>
                        <Text fw={700} size="lg">{erp.alerts.openTasks}</Text>
                      </Stack>
                    </Group>
                  </Card>
                  <Card withBorder p="xs" style={{ cursor: 'pointer', flex: 1 }} onClick={() => navigate('/notifications')}>
                    <Group gap="xs">
                      <IconBell size={20} color="var(--mantine-color-red-6)" />
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed">Непрочитанных</Text>
                        <Text fw={700} size="lg">{erp.alerts.unreadNotifications}</Text>
                      </Stack>
                    </Group>
                  </Card>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Card>
      )}

      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm" p="md">
            <Title order={5} mb="md">{t('dashboard.dailyOrders')}</Title>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.ordersPerDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1a237e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm" p="md">
            <Title order={5} mb="md">{t('dashboard.orderStatusBreakdown')}</Title>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.orderStatusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {(data.orderStatusDistribution ?? []).map((_item: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm" p="md">
            <Title order={5} mb="md">{t('dashboard.revenueTrend')}</Title>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#1a237e" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm" p="md">
            <Title order={5} mb="md">{t('dashboard.topProducts')}</Title>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('inventory.name')}</Table.Th>
                  <Table.Th>SKU</Table.Th>
                  <Table.Th>{t('dashboard.quantity')}</Table.Th>
                  <Table.Th>{t('dashboard.revenue')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(data.topProducts ?? []).map((p: any) => (
                  <Table.Tr key={p.sku}>
                    <Table.Td>{p.name}</Table.Td>
                    <Table.Td>{p.sku}</Table.Td>
                    <Table.Td>{p.totalQty}</Table.Td>
                    <Table.Td>{formatCurrency(p.revenue)}</Table.Td>
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
