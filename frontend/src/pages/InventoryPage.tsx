import React, { useState } from 'react';
import {
  Tabs, Table, Button, Modal, Select, NumberInput, TextInput, Badge,
  Title, Group, Text, Loader, Container, Collapse, Alert, Card,
} from '@mantine/core';
import {
  IconAdjustments, IconAlertTriangle, IconArchive, IconListDetails,
} from '@tabler/icons-react';
import { useProducts, usePriority, useStockAlerts, useReserveByPriority, useAdjustStock } from '../api/hooks';
import { useAuth } from '../store/AuthContext';
import { TableSkeleton } from '../components/Skeleton';

export default function InventoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>('products');

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: priorityData = [], isLoading: priorityLoading, refetch: refetchPriority } = usePriority();
  const { data: stockAlerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useStockAlerts();
  const reserveMutation = useReserveByPriority();
  const adjustMutation = useAdjustStock();

  const [adjustOpened, setAdjustOpened] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<number | null>(null);
  const [adjustChange, setAdjustChange] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState('');
  const [alertsOpened, setAlertsOpened] = useState(false);

  const handleAdjust = async () => {
    if (!adjustProduct || adjustChange === '' || !adjustReason.trim() || !user) return;
    try {
      await adjustMutation.mutateAsync({
        productId: adjustProduct,
        userId: user.id,
        change: Number(adjustChange),
        reason: adjustReason,
      });
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Сәтті', message: 'Қор түзетілді', color: 'green' });
      setAdjustOpened(false);
      setAdjustProduct(null);
      setAdjustChange('');
      setAdjustReason('');
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Қате', message: err.message, color: 'red' });
    }
  };

  const toggleAlerts = () => {
    const next = !alertsOpened;
    setAlertsOpened(next);
    if (next && stockAlerts.length === 0) {
      refetchAlerts();
    }
  };

  const productSelectData = products.map((p: any) => ({
    value: String(p.id),
    label: `${p.name} (${p.sku}) — қолда: ${p.quantityOnHand}`,
  }));

  const rowBg = (p: any): string | undefined => {
    const avail = p.available ?? p.quantityOnHand - p.quantityReserved;
    if (avail < 1) return 'var(--mantine-color-red-1)';
    if (avail < 5) return 'var(--mantine-color-orange-1)';
    if (avail > p.reorderPoint) return 'var(--mantine-color-green-1)';
    return undefined;
  };

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>Қойма</Title>
        <Group>
          {user?.role === 'Admin' && (
            <Button
              variant="light"
              leftSection={<IconAdjustments size={16} />}
              onClick={() => setAdjustOpened(true)}
            >
              Қорды түзету
            </Button>
          )}
          <Button
            variant="light"
            color="cyan"
            leftSection={<IconListDetails size={16} />}
            onClick={() => setActiveTab('priority')}
          >
            Резервтеу приоритеті
          </Button>
          <Button
            variant="light"
            color={alertsOpened ? 'red' : 'gray'}
            leftSection={<IconAlertTriangle size={16} />}
            onClick={toggleAlerts}
          >
            Қор ескертулері
          </Button>
        </Group>
      </Group>

      <Collapse in={alertsOpened} mb="md">
        <Card withBorder shadow="sm" p="md">
          <Title order={5} mb="sm">Қор ескертулері</Title>
          {alertsLoading ? (
            <Loader size="sm" />
          ) : stockAlerts.length === 0 ? (
            <Text c="dimmed">Ескертулер жоқ</Text>
          ) : (
            <Group>
              {stockAlerts.map((p: any) => {
                const avail = p.available ?? p.quantityOnHand - p.quantityReserved;
                return (
                  <Badge
                    key={p.id}
                    color={avail < 1 ? 'red' : 'orange'}
                    variant="filled"
                    size="lg"
                  >
                    {p.name} — {avail} дана
                  </Badge>
                );
              })}
            </Group>
          )}
        </Card>
      </Collapse>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="products" leftSection={<IconArchive size={16} />}>
            Өнімдер
          </Tabs.Tab>
          <Tabs.Tab value="priority" leftSection={<IconListDetails size={16} />}>
            Резервтеу приоритеті
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="products">
          {productsLoading ? (
            <TableSkeleton rows={5} cols={8} />
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>SKU</Table.Th>
                  <Table.Th>Атауы</Table.Th>
                  <Table.Th>Санаты</Table.Th>
                  <Table.Th>Бағасы</Table.Th>
                  <Table.Th>Қолдағы</Table.Th>
                  <Table.Th>Резервтелген</Table.Th>
                  <Table.Th>Қолжетімді</Table.Th>
                  <Table.Th>Тапсырыс нүктесі</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {products.map((p: any) => {
                  const avail = p.available ?? p.quantityOnHand - p.quantityReserved;
                  return (
                    <Table.Tr key={p.id} style={{ background: rowBg(p) }}>
                      <Table.Td>{p.sku}</Table.Td>
                      <Table.Td>{p.name}</Table.Td>
                      <Table.Td>{p.category}</Table.Td>
                      <Table.Td>{p.unitPrice?.toLocaleString()} ₸</Table.Td>
                      <Table.Td>{p.quantityOnHand}</Table.Td>
                      <Table.Td>{p.quantityReserved}</Table.Td>
                      <Table.Td>
                        <Badge color={avail < 1 ? 'red' : avail < 5 ? 'orange' : 'green'} size="sm">
                          {avail}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{p.reorderPoint}</Table.Td>
                    </Table.Tr>
                  );
                })}
                {products.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={8}><Text c="dimmed" ta="center" py="md">Өнімдер жоқ</Text></Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="priority">
          <Group mb="md">
            <Button
              leftSection={<IconListDetails size={16} />}
              onClick={() => reserveMutation.mutate()}
              loading={reserveMutation.isPending}
            >
              Приоритет бойынша резервтеу
            </Button>
            {priorityData.length === 0 && (
              <Button variant="light" onClick={() => refetchPriority()}>
                Деректерді жүктеу
              </Button>
            )}
          </Group>

          {priorityLoading ? (
            <Loader />
          ) : priorityData.length > 0 ? (
            priorityData.map((item: any) => (
              <Card key={item.orderId} withBorder shadow="sm" p="md" mb="md">
                <Group justify="space-between" mb="xs">
                  <Group>
                    <Text fw={700}>Тапсырыс #{item.orderId}</Text>
                    <Badge size="lg" color="blue" variant="filled" style={{ fontSize: '1.2rem', padding: '0.2rem 0.8rem' }}>
                      α = {item.alpha.toFixed(4)}
                    </Badge>
                  </Group>
                  <Badge
                    color={item.hoursUntilDeadline < 24 ? 'red' : item.hoursUntilDeadline < 72 ? 'orange' : 'green'}
                  >
                    {item.hoursUntilDeadline.toFixed(1)} сағ
                  </Badge>
                </Group>

                <Group mb="sm">
                  <div style={{ flex: 1 }}>
                    <Text size="sm" c="dimmed">Клиент</Text>
                    <Text>{item.customerName}</Text>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" c="dimmed">Тиер</Text>
                    <Text>{item.deadline ? new Date(item.deadline).toLocaleDateString() : '-'}</Text>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" c="dimmed">Маржа</Text>
                    <Text>{item.margin?.toLocaleString()} ₸</Text>
                  </div>
                </Group>

                <Table striped withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Өнім</Table.Th>
                      <Table.Th>SKU</Table.Th>
                      <Table.Th>Сұралған</Table.Th>
                      <Table.Th>Қолжетімді</Table.Th>
                      <Table.Th>Мүмкін бе?</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {item.items.map((sub: any, i: number) => (
                      <Table.Tr key={i}>
                        <Table.Td>{sub.productName}</Table.Td>
                        <Table.Td>{sub.sku}</Table.Td>
                        <Table.Td>{sub.requested}</Table.Td>
                        <Table.Td>{sub.available}</Table.Td>
                        <Table.Td>
                          <Text c={sub.canFulfill ? 'green' : 'red'} fw={700}>
                            {sub.canFulfill ? '✓' : '✗'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            ))
          ) : (
            <Alert color="blue">Приоритет деректері жоқ. Деректерді жүктеу үшін батырманы басыңыз.</Alert>
          )}
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={adjustOpened}
        onClose={() => { setAdjustOpened(false); setAdjustProduct(null); setAdjustChange(''); setAdjustReason(''); }}
        title="Қорды түзету"
      >
        <Select
          label="Өнім"
          placeholder="Өнімді таңдаңыз"
          data={productSelectData}
          value={adjustProduct !== null ? String(adjustProduct) : null}
          onChange={v => setAdjustProduct(v ? Number(v) : null)}
          searchable
          required
          mb="sm"
        />
        <NumberInput
          label="Өзгеріс мөлшері (+/-)"
          placeholder="Мысалы: 10 немесе -5"
          value={adjustChange}
          onChange={v => setAdjustChange(v === '' ? '' : Number(v))}
          required
          mb="sm"
        />
        <TextInput
          label="Себебі"
          placeholder="Түзету себебін енгізіңіз"
          value={adjustReason}
          onChange={e => setAdjustReason(e.currentTarget.value)}
          required
          mb="lg"
        />
        <Group justify="flex-end">
          <Button
            onClick={handleAdjust}
            loading={adjustMutation.isPending}
            disabled={!adjustProduct || adjustChange === '' || !adjustReason.trim()}
          >
            Сақтау
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
