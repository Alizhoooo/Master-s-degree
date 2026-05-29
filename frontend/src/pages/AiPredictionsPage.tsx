import React, { useState, useEffect } from 'react';
import {
  Container, Title, Group, Button, Table, Card, Text, Badge, Tabs, Loader,
} from '@mantine/core';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { IconRefresh, IconAlertTriangle } from '@tabler/icons-react';
import { getForecast, getAnomalies } from '../api';
import { AiForecast, AnomalyAlert } from '../types';

export default function AiPredictionsPage() {
  const [forecast, setForecast] = useState<AiForecast[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [loadingAnomalies, setLoadingAnomalies] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('forecast');

  const fetchForecast = async () => {
    setLoadingForecast(true);
    try {
      const res = await getForecast();
      setForecast(Array.isArray(res) ? res : res.data ?? res.forecast ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingForecast(false);
    }
  };

  const fetchAnomalies = async () => {
    setLoadingAnomalies(true);
    try {
      const res = await getAnomalies();
      setAnomalies(Array.isArray(res) ? res : res.data ?? res.anomalies ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnomalies(false);
    }
  };

  useEffect(() => {
    fetchForecast();
    fetchAnomalies();
  }, []);

  const chartData = forecast.map(f => ({
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
      <Title order={3} mb="md">ЖИ болжамдар</Title>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="forecast">Сұраныс болжамы</Tabs.Tab>
          <Tabs.Tab value="anomalies" leftSection={<IconAlertTriangle size={14} />}>
            Аномалиялар
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="forecast">
          <Group justify="flex-end" mb="md">
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={fetchForecast}
              loading={loadingForecast}
            >
              Болжамды жаңарту
            </Button>
          </Group>

          {loadingForecast ? (
            <Group justify="center" py="xl"><Loader /></Group>
          ) : (
            <>
              <Card withBorder shadow="sm" p="md" mb="lg">
                <Title order={5} mb="md">Сұраныс болжамы және ағымдағы қор</Title>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="currentStock" fill="#228be6" radius={[4, 4, 0, 0]} name="Ағымдағы қор" />
                    <Bar dataKey="predictedDemand" fill="#fa5252" radius={[4, 4, 0, 0]} name="Болжамды сұраныс" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Өнім</Table.Th>
                    <Table.Th>SKU</Table.Th>
                    <Table.Th>Ағымдағы қор</Table.Th>
                    <Table.Th>Орташа айлық сатылым</Table.Th>
                    <Table.Th>Болжамды сұраныс</Table.Th>
                    <Table.Th>Ұсынылатын тапсырыс</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {forecast.map(f => (
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
                        <Text c="dimmed" ta="center" py="md">Болжамдар жоқ</Text>
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
            <Group justify="center" py="xl"><Loader /></Group>
          ) : (
            <>
              {anomalies.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">Аномалиялар жоқ</Text>
              ) : (
                anomalies.map(a => (
                  <Card key={a.orderId} withBorder shadow="sm" p="md" mb="sm">
                    <Group justify="space-between" mb="xs">
                      <Group>
                        <Badge
                          size="lg"
                          color={anomalyColor(a.reason)}
                          leftSection={<IconAlertTriangle size={12} />}
                        >
                          #{a.orderId}
                        </Badge>
                        <Text fw={500}>{a.customerName}</Text>
                      </Group>
                      <Text fw={700}>{a.amount.toLocaleString()} ₸</Text>
                    </Group>
                    <Text size="sm" c="dimmed">{a.reason}</Text>
                    <Text size="xs" c="gray" mt="xs">
                      {new Date(a.createdAt).toLocaleString()}
                    </Text>
                  </Card>
                ))
              )}
            </>
          )}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
