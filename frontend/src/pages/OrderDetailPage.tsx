import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Title, Badge, Button, Card, Table, Group, Text, Container, Alert, Modal,
} from '@mantine/core';
import { IconArrowLeft, IconPackage } from '@tabler/icons-react';
import { useOrder, useUpdateOrderStatus, useCancelOrder, usePickList } from '../api/hooks';
import { useAuth } from '../store/AuthContext';
import { DetailSkeleton } from '../components/Skeleton';

const STATUS_ORDER = ['Pending', 'Confirmed', 'Reserved', 'Paid', 'Picked', 'Shipped', 'Delivered'];

const statusColor: Record<string, string> = {
  Pending: 'yellow', Confirmed: 'blue', Reserved: 'cyan', Paid: 'violet',
  Picked: 'orange', Shipped: 'indigo', Delivered: 'green', Cancelled: 'red',
};

const TRANSITIONS: Record<string, string[]> = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Reserved', 'Cancelled'],
  Reserved: ['Paid', 'Cancelled'],
  Paid: ['Picked', 'Cancelled'],
  Picked: ['Shipped'],
  Shipped: ['Delivered'],
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: order, isLoading } = useOrder(Number(id));
  const updateStatus = useUpdateOrderStatus();
  const cancel = useCancelOrder();
  const { data: pickList = [], isLoading: pickLoading } = usePickList(Number(id));

  const [pickModalOpened, setPickModalOpened] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    try {
      if (newStatus === 'Cancelled') {
        await cancel.mutateAsync(order.id);
      } else {
        await updateStatus.mutateAsync({ id: order.id, status: newStatus });
      }
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.success'), message: t('order.successUpdated'), color: 'green' });
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.error'), message: err.message, color: 'red' });
    }
  };

  if (isLoading) return <DetailSkeleton />;

  if (!order) {
    return (
      <Container size="xl">
        <Alert color="red">{t('order.notFound')}</Alert>
      </Container>
    );
  }

  const totalAmount = order.totalAmount ?? order.items?.reduce((s: number, i: any) => s + i.unitPrice * i.quantity, 0) ?? 0;
  const totalCost = order.costAmount ?? 0;
  const availableNext = TRANSITIONS[order.status] ?? [];

  return (
    <Container size="xl">
      <Group mb="md">
        <Button component={Link} to="/orders" variant="subtle" leftSection={<IconArrowLeft size={16} />}>
          {t('common.back')}
        </Button>
      </Group>

      <Group justify="space-between" mb="lg">
        <Group>
          <Title order={3}>{t('order.detail')} #{order.id}</Title>
          <Badge size="lg" color={statusColor[order.status] || 'gray'}>{order.status}</Badge>
        </Group>
        <Group>
          <Button variant="light" color="cyan" leftSection={<IconPackage size={16} />} onClick={() => setPickModalOpened(true)}>
            {t('order.pickList')}
          </Button>
        </Group>
      </Group>

      <Card withBorder shadow="sm" p="md" mb="md">
        <Title order={5} mb="sm">{t('order.orderInfo')}</Title>
        <Group>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">{t('order.customer')}</Text>
            <Text fw={500}>{order.customer?.company || order.customer?.contactPerson || `#${order.customerId}`}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">{t('order.deliveryAddress')}</Text>
            <Text fw={500}>{order.deliveryAddress}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">{t('order.deadline')}</Text>
            <Text fw={500}>{order.deadline ? new Date(order.deadline).toLocaleDateString() : '-'}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">{t('order.createdDate')}</Text>
            <Text fw={500}>{new Date(order.createdAt).toLocaleString()}</Text>
          </div>
        </Group>
      </Card>

      <Card withBorder shadow="sm" p="md" mb="md">
        <Title order={5} mb="sm">{t('order.items')}</Title>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('order.name')}</Table.Th>
              <Table.Th>{t('order.sku')}</Table.Th>
              <Table.Th>{t('order.quantity')}</Table.Th>
              <Table.Th>{t('order.price')}</Table.Th>
              <Table.Th>{t('order.amount')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {order.items?.map((item: any) => (
              <Table.Tr key={item.id}>
                <Table.Td>{item.product?.name || `#${item.productId}`}</Table.Td>
                <Table.Td>{item.product?.sku || '-'}</Table.Td>
                <Table.Td>{item.quantity}</Table.Td>
                <Table.Td>{item.unitPrice?.toLocaleString()} ₸</Table.Td>
                <Table.Td>{(item.unitPrice * item.quantity).toLocaleString()} ₸</Table.Td>
              </Table.Tr>
            ))}
            {(!order.items || order.items.length === 0) && (
              <Table.Tr>
                <Table.Td colSpan={5}><Text c="dimmed" ta="center">{t('order.noItems')}</Text></Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
        <Group justify="flex-end" mt="sm">
          <Text size="sm" c="dimmed">{t('order.totalAmount')}: </Text>
          <Text fw={700}>{totalAmount.toLocaleString()} ₸</Text>
          <Text size="sm" c="dimmed" ml="lg">{t('order.costAmount')}: </Text>
          <Text fw={700}>{totalCost.toLocaleString()} ₸</Text>
        </Group>
      </Card>

      {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
        <Card withBorder shadow="sm" p="md" mb="md">
          <Title order={5} mb="sm">{t('order.changeStatus')}</Title>
          <Group>
            {availableNext.map((nextStatus: string) => (
              <Button
                key={nextStatus}
                color={nextStatus === 'Cancelled' ? 'red' : statusColor[nextStatus] || 'blue'}
                onClick={() => handleStatusUpdate(nextStatus)}
                loading={updateStatus.isPending || cancel.isPending}
              >
                {nextStatus === 'Cancelled' ? t('order.cancel') : nextStatus}
              </Button>
            ))}
          </Group>
        </Card>
      )}

      <Modal opened={pickModalOpened} onClose={() => setPickModalOpened(false)} title={t('order.pickList')} size="lg">
        {pickLoading ? (
          <Text ta="center" py="md">{t('common.loading')}...</Text>
        ) : pickList.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">{t('order.pickListEmpty')}</Text>
        ) : (
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('inventory.name')}</Table.Th>
                <Table.Th>{t('inventory.sku')}</Table.Th>
                <Table.Th>{t('dashboard.quantity')}</Table.Th>
                <Table.Th>{t('order.location')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pickList.map((item: any, i: number) => (
                <Table.Tr key={i}>
                  <Table.Td>{item.productName || item.product?.name || `#${item.productId}`}</Table.Td>
                  <Table.Td>{item.sku || item.product?.sku || '-'}</Table.Td>
                  <Table.Td>{item.quantity ?? item.requiredQuantity ?? '-'}</Table.Td>
                  <Table.Td>{item.location || item.shelf || '-'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Modal>
    </Container>
  );
}
