import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container, Title, Group, Button, Table, Card, Text, Badge, Tabs,
} from '@mantine/core';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { IconRefresh, IconAlertTriangle } from '@tabler/icons-react';
import { useForecast, useAnomalies } from '../api/hooks';
import { TableSkeleton } from '../components/Skeleton';

export default function AiPredictionsPage() {
  const { t } = useTranslation();
  const { data: forecast = [], isLoading: loadingForecast, refetch: refetchForecast } = useForecast();
  const { data: anomalies = [], isLoading: loadingAnomalies, refetch: refetchAnomalies } = useAnomalies();
  const [activeTab, setActiveTab] = useState<string | null>('forecast');

  const chartData = forecast.map((f: any) => ({
    name: f.productName,
    currentStock: f.currentStock,
    predictedDemand: f.predictedDemand,
  }));

  const anomalyColor = (reason: string) => {
    if (reason.toLowerCase().includes('amount') || reason.toLowerCase().includes('сома')) return 'red';
    return 'orange';
  };

  return (
    <Container size="xl">
      <Title order={3} mb="md">{t('ai.title')}</Title>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="forecast">{t('ai.forecast')}</Tabs.Tab>
          <Tabs.Tab value="anomalies" leftSection={<IconAlertTriangle size={14} />}>
            {t('ai.anomalies')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="forecast">
          <Group justify="flex-end" mb="md">
            <Button leftSection={<IconRefresh size={16} />} onClick={() => refetchForecast()} loading={loadingForecast}>
              {t('ai.refreshForecast')}
            </Button>
          </Group>

          {loadingForecast ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (
            <>
              <Card withBorder shadow="sm" p="md" mb="lg">
                <Title order={5} mb="md">{t('ai.forecastChart')}</Title>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="currentStock" fill="#228be6" radius={[4, 4, 0, 0]} name={t('ai.currentStock')} />
                    <Bar dataKey="predictedDemand" fill="#fa5252" radius={[4, 4, 0, 0]} name={t('ai.predictedDemand')} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('inventory.name')}</Table.Th>
                    <Table.Th>{t('inventory.sku')}</Table.Th>
                    <Table.Th>{t('ai.currentStock')}</Table.Th>
                    <Table.Th>{t('ai.avgSales')}</Table.Th>
                    <Table.Th>{t('ai.predicted')}</Table.Th>
                    <Table.Th>{t('ai.reorder')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {forecast.map((f: any) => (
                    <Table.Tr key={f.productId}>
                      <Table.Td>{f.productName}</Table.Td>
                      <Table.Td>{f.sku}</Table.Td>
                      <Table.Td>{f.currentStock}</Table.Td>
                      <Table.Td>{f.avgMonthlySales}</Table.Td>
                      <Table.Td>{f.predictedDemand}</Table.Td>
                      <Table.Td>
                        <Badge color={f.recommendedReorderQuantity > 0 ? 'blue' : 'gray'}>
                          {f.recommendedReorderQuantity}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {forecast.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Text c="dimmed" ta="center" py="md">{t('ai.noForecasts')}</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="anomalies">
          {loadingAnomalies ? (
            <TableSkeleton rows={3} cols={3} />
          ) : anomalies.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">{t('ai.noAnomalies')}</Text>
          ) : (
            anomalies.map((a: any) => (
              <Card key={a.orderId} withBorder shadow="sm" p="md" mb="sm">
                <Group justify="space-between" mb="xs">
                  <Group>
                    <Badge size="lg" color={anomalyColor(a.reason)} leftSection={<IconAlertTriangle size={12} />}>
                      #{a.orderId}
                    </Badge>
                    <Text fw={500}>{a.customerName}</Text>
                  </Group>
                  <Text fw={700}>{a.amount.toLocaleString()} ₸</Text>
                </Group>
                <Text size="sm" c="dimmed">{a.reason}</Text>
                <Text size="xs" c="gray" mt="xs">{new Date(a.createdAt).toLocaleString()}</Text>
              </Card>
            ))
          )}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
