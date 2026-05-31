import React, { useState } from 'react';
import { Container, Grid, Card, Text, Group, Title, SimpleGrid, Table, Button } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconShoppingCart, IconCash, IconClock, IconPercentage, IconFilter, IconX } from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../api/hooks';
import { CardSkeleton } from '../components/Skeleton';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('kk-KZ', { style: 'currency', currency: 'KZT', minimumFractionDigits: 0 }).format(value);

const COLORS = ['#1a237e', '#42a5f5', '#66bb6a', '#ffa726', '#ef5350', '#ab47bc', '#26c6da'];

export default function DashboardPage() {
  const { t } = useTranslation();
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const buildFilters = () => {
    const f: Record<string, string> = {};
    if (dateFrom) f.dateFrom = dateFrom.toISOString();
    if (dateTo) f.dateTo = dateTo.toISOString();
    return Object.keys(f).length > 0 ? f : undefined;
  };

  const { data, isLoading, refetch } = useDashboard(buildFilters());

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
                  {data.orderStatusDistribution.map((_item: any, index: number) => (
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
                {data.topProducts.map((p: any) => (
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
