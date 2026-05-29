import React, { useState, useEffect } from 'react';
import {
  Tabs, Table, Button, Modal, Select, NumberInput, TextInput, Badge,
  Title, Group, Text, Loader, Container, Collapse, Alert, Card,
} from '@mantine/core';
import {
  IconAdjustments, IconAlertTriangle, IconArchive, IconListDetails,
} from '@tabler/icons-react';
import {
  getProducts, getPriority, reserveByPriority, adjustStock, getStockAlerts,
} from '../api';
import { useAuth } from '../store/AuthContext';
import { Product, PriorityItem } from '../types';

export default function InventoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>('products');

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [priorityData, setPriorityData] = useState<PriorityItem[]>([]);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [reserving, setReserving] = useState(false);

  const [adjustOpened, setAdjustOpened] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<number | null>(null);
  const [adjustChange, setAdjustChange] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const [alertsOpened, setAlertsOpened] = useState(false);
  const [stockAlerts, setStockAlerts] = useState<Product[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await getProducts();
      setProducts(Array.isArray(res) ? res : res.data ?? res.products ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchPriority = async () => {
    setPriorityLoading(true);
    try {
      const res = await getPriority();
      setPriorityData(Array.isArray(res) ? res : res.data ?? res.priority ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setPriorityLoading(false);
    }
  };

  const fetchAlerts = async () => {
    setAlertsLoading(true);
    try {
      const res = await getStockAlerts();
      setStockAlerts(Array.isArray(res) ? res : res.data ?? res.alerts ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setAlertsLoading(false);
    }
  };

  const handleReserveByPriority = async () => {
    setReserving(true);
    try {
      await reserveByPriority();
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Сәтті', message: 'Резервтеу орындалды', color: 'green' });
      fetchPriority();
      fetchProducts();
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Қате', message: err.message, color: 'red' });
    } finally {
      setReserving(false);
    }
  };

  const handleAdjust = async () => {
    if (!adjustProduct || adjustChange === '' || !adjustReason.trim()) return;
    setAdjustSubmitting(true);
    try {
      await adjustStock(adjustProduct, user!.id, Number(adjustChange), adjustReason);
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Сәтті', message: 'Қор түзетілді', color: 'green' });
      setAdjustOpened(false);
      setAdjustProduct(null);
      setAdjustChange('');
      setAdjustReason('');
      fetchProducts();
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Қате', message: err.message, color: 'red' });
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const toggleAlerts = () => {
    const next = !alertsOpened;
    setAlertsOpened(next);
    if (next && stockAlerts.length === 0) {
      fetchAlerts();
    }
  };

  const productSelectData = products.map(p => ({
    value: String(p.id),
    label: `${p.name} (${p.sku}) — қолда: ${p.quantityOnHand}`,
  }));

  const rowBg = (p: Product): string | undefined => {
    const avail = (p.available ?? p.quantityOnHand - p.quantityReserved);
    if (avail < 1) return 'var(--mantine-color-red-1)';
    if (avail < 5) return 'var(--mantine-color-orange-1)';
    if (avail > p.reorderPoint) return 'var(--mantine-color-green-1)';
    return undefined;
  };

  const renderProducts = () => {
    if (productsLoading) {
      return <Group justify="center" py="xl"><Loader /></Group>;
    }

    return (
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
          {products.map(p => {
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
    );
  };

  const renderPriority = () => {
    if (priorityLoading) {
      return <Group justify="center" py="xl"><Loader /></Group>;
    }

    return (
      <>
        <Group mb="md">
          <Button
            leftSection={<IconListDetails size={16} />}
            onClick={handleReserveByPriority}
            loading={reserving}
          >
            Приоритет бойынша резервтеу
          </Button>
          {priorityData.length === 0 && (
            <Button variant="light" onClick={fetchPriority}>
              Деректерді жүктеу
            </Button>
          )}
        </Group>

        {priorityData.map(item => (
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
                {item.items.map((sub, i) => (
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
        ))}

        {priorityData.length === 0 && !priorityLoading && (
          <Alert color="blue">Приоритет деректері жоқ. Деректерді жүктеу үшін батырманы басыңыз.</Alert>
        )}
      </>
    );
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
              {stockAlerts.map(p => {
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
          {renderProducts()}
        </Tabs.Panel>

        <Tabs.Panel value="priority">
          {renderPriority()}
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
            loading={adjustSubmitting}
            disabled={!adjustProduct || adjustChange === '' || !adjustReason.trim()}
          >
            Сақтау
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
