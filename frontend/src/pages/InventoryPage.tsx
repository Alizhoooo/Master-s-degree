import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tabs, Table, Button, Modal, Select, NumberInput, TextInput, Badge,
  Title, Group, Text, Loader, Container, Collapse, Alert, Card,
} from '@mantine/core';
import {
  IconAdjustments, IconAlertTriangle, IconArchive, IconListDetails, IconWifi,
} from '@tabler/icons-react';
import { useProducts, usePriority, useStockAlerts, useReserveByPriority, useAdjustStock } from '../api/hooks';
import { useAuth } from '../store/AuthContext';
import { TableSkeleton } from '../components/Skeleton';
import { useInventorySocket } from '../hooks/useSocket';

export default function InventoryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>('products');
  const socketRef = useInventorySocket();

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
      showNotification({ title: t('notification.success'), message: t('inventory.successAdjusted'), color: 'green' });
      setAdjustOpened(false);
      setAdjustProduct(null);
      setAdjustChange('');
      setAdjustReason('');
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.error'), message: err.message, color: 'red' });
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
    label: `${p.name} (${p.sku}) — ${t('inventory.stock')}: ${p.quantityOnHand}`,
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
        <Group>
          <Title order={3}>{t('inventory.title')}</Title>
          <Badge
            size="sm"
            variant="dot"
            color={socketRef.current?.connected ? 'green' : 'red'}
            leftSection={<IconWifi size={10} />}
          >
            {socketRef.current?.connected ? t('inventory.realtime') : t('inventory.offline')}
          </Badge>
        </Group>
        <Group>
          {user?.role === 'Admin' && (
            <Button
              variant="light"
              leftSection={<IconAdjustments size={16} />}
              onClick={() => setAdjustOpened(true)}
            >
              {t('inventory.adjustStock')}
            </Button>
          )}
          <Button
            variant="light"
            color="cyan"
            leftSection={<IconListDetails size={16} />}
            onClick={() => setActiveTab('priority')}
          >
            {t('inventory.reservePriority')}
          </Button>
          <Button
            variant="light"
            color={alertsOpened ? 'red' : 'gray'}
            leftSection={<IconAlertTriangle size={16} />}
            onClick={toggleAlerts}
          >
            {t('inventory.alerts')}
          </Button>
        </Group>
      </Group>

      <Collapse in={alertsOpened} mb="md">
        <Card withBorder shadow="sm" p="md">
          <Title order={5} mb="sm">{t('inventory.alerts')}</Title>
          {alertsLoading ? (
            <Loader size="sm" />
          ) : stockAlerts.length === 0 ? (
            <Text c="dimmed">{t('inventory.noAlerts')}</Text>
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
                    {p.name} — {avail}
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
            {t('inventory.products')}
          </Tabs.Tab>
          <Tabs.Tab value="priority" leftSection={<IconListDetails size={16} />}>
            {t('inventory.reservePriority')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="products">
          {productsLoading ? (
            <TableSkeleton rows={5} cols={8} />
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('inventory.sku')}</Table.Th>
                  <Table.Th>{t('inventory.name')}</Table.Th>
                  <Table.Th>{t('inventory.category')}</Table.Th>
                  <Table.Th>{t('inventory.price')}</Table.Th>
                  <Table.Th>{t('inventory.stock')}</Table.Th>
                  <Table.Th>{t('inventory.reserved')}</Table.Th>
                  <Table.Th>{t('inventory.available')}</Table.Th>
                  <Table.Th>{t('inventory.orderNum')}</Table.Th>
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
                    <Table.Td colSpan={8}><Text c="dimmed" ta="center" py="md">{t('inventory.noProducts')}</Text></Table.Td>
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
              {t('inventory.reserveByPriority')}
            </Button>
            {priorityData.length === 0 && (
              <Button variant="light" onClick={() => refetchPriority()}>
                {t('inventory.loadData')}
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
                    <Text fw={700}>{t('inventory.orderNum')} #{item.orderId}</Text>
                    <Badge size="lg" color="blue" variant="filled" style={{ fontSize: '1.2rem', padding: '0.2rem 0.8rem' }}>
                      α = {item.alpha.toFixed(4)}
                    </Badge>
                  </Group>
                  <Badge
                    color={item.hoursUntilDeadline < 24 ? 'red' : item.hoursUntilDeadline < 72 ? 'orange' : 'green'}
                  >
                    {item.hoursUntilDeadline.toFixed(1)} {t('inventory.hours')}
                  </Badge>
                </Group>

                <Group mb="sm">
                  <div style={{ flex: 1 }}>
                    <Text size="sm" c="dimmed">{t('inventory.customer')}</Text>
                    <Text>{item.customerName}</Text>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" c="dimmed">{t('inventory.available')}</Text>
                    <Text>{item.deadline ? new Date(item.deadline).toLocaleDateString() : '-'}</Text>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" c="dimmed">{t('inventory.margin')}</Text>
                    <Text>{item.margin?.toLocaleString()} ₸</Text>
                  </div>
                </Group>

                <Table striped withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('inventory.products')}</Table.Th>
                      <Table.Th>{t('inventory.sku')}</Table.Th>
                      <Table.Th>{t('inventory.requested')}</Table.Th>
                      <Table.Th>{t('inventory.available')}</Table.Th>
                      <Table.Th>{t('inventory.possible')}</Table.Th>
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
            <Alert color="blue">{t('inventory.noPriorityData')} {t('inventory.loadPriorityData')}</Alert>
          )}
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={adjustOpened}
        onClose={() => { setAdjustOpened(false); setAdjustProduct(null); setAdjustChange(''); setAdjustReason(''); }}
        title={t('inventory.adjustStock')}
      >
        <Select
          label={t('inventory.selectProduct')}
          placeholder={t('inventory.selectProduct')}
          data={productSelectData}
          value={adjustProduct !== null ? String(adjustProduct) : null}
          onChange={v => setAdjustProduct(v ? Number(v) : null)}
          searchable
          required
          mb="sm"
        />
        <NumberInput
          label={t('inventory.changeAmount')}
          placeholder={t('inventory.exampleChange')}
          value={adjustChange}
          onChange={v => setAdjustChange(v === '' ? '' : Number(v))}
          required
          mb="sm"
        />
        <TextInput
          label={t('inventory.reason')}
          placeholder={t('inventory.enterReason')}
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
            {t('common.save')}
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
