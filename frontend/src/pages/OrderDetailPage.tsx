import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Title, Badge, Button, Card, Table, Group, Text, Loader, Container, Alert, Modal,
} from '@mantine/core';
import { IconArrowLeft, IconPackage } from '@tabler/icons-react';
import { getOrder, updateOrderStatus, cancelOrder, getPickList } from '../api';
import { useAuth } from '../store/AuthContext';
import { Order } from '../types';

const STATUS_ORDER = ['Pending', 'Confirmed', 'Reserved', 'Paid', 'Picked', 'Shipped', 'Delivered'];

const statusColor: Record<string, string> = {
  Pending: 'yellow',
  Confirmed: 'blue',
  Reserved: 'cyan',
  Paid: 'violet',
  Picked: 'orange',
  Shipped: 'indigo',
  Delivered: 'green',
  Cancelled: 'red',
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
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [pickModalOpened, setPickModalOpened] = useState(false);
  const [pickList, setPickList] = useState<any[]>([]);
  const [pickLoading, setPickLoading] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await getOrder(Number(id));
      setOrder(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      if (newStatus === 'Cancelled') {
        await cancelOrder(order.id);
      } else {
        await updateOrderStatus(order.id, newStatus);
      }
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Сәтті', message: 'Күй жаңартылды', color: 'green' });
      fetchOrder();
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Қате', message: err.message, color: 'red' });
    } finally {
      setUpdating(false);
    }
  };

  const openPickModal = async () => {
    setPickModalOpened(true);
    if (pickList.length === 0) {
      setPickLoading(true);
      try {
        const res = await getPickList(Number(id));
        setPickList(Array.isArray(res) ? res : res.items ?? res.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setPickLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <Container size="xl">
        <Group justify="center" py="xl"><Loader /></Group>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container size="xl">
        <Alert color="red">Тапсырыс табылмады</Alert>
      </Container>
    );
  }

  const totalAmount = order.totalAmount ?? order.items?.reduce((s, i) => s + (i.unitPrice * i.quantity), 0) ?? 0;
  const totalCost = order.costAmount ?? 0;
  const currentStatusIdx = STATUS_ORDER.indexOf(order.status);
  const availableNext = TRANSITIONS[order.status] ?? [];

  return (
    <Container size="xl">
      <Group mb="md">
        <Button component={Link} to="/orders" variant="subtle" leftSection={<IconArrowLeft size={16} />}>
          Артқа
        </Button>
      </Group>

      <Group justify="space-between" mb="lg">
        <Group>
          <Title order={3}>Тапсырыс #{order.id}</Title>
          <Badge size="lg" color={statusColor[order.status] || 'gray'}>{order.status}</Badge>
        </Group>
        <Group>
          {user?.role === 'Warehouse' && (
            <Button
              variant="light"
              color="cyan"
              leftSection={<IconPackage size={16} />}
              onClick={openPickModal}
            >
              Пик-парақ
            </Button>
          )}
          {user?.role !== 'Warehouse' && (
            <Button
              variant="light"
              color="cyan"
              leftSection={<IconPackage size={16} />}
              onClick={openPickModal}
            >
              Пик-парақ
            </Button>
          )}
        </Group>
      </Group>

      <Card withBorder shadow="sm" p="md" mb="md">
        <Title order={5} mb="sm">Тапсырыс ақпараты</Title>
        <Group>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">Клиент</Text>
            <Text fw={500}>{order.customer?.company || order.customer?.contactPerson || `#${order.customerId}`}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">Жеткізу мекенжайы</Text>
            <Text fw={500}>{order.deliveryAddress}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">Мерзім</Text>
            <Text fw={500}>{order.deadline ? new Date(order.deadline).toLocaleDateString() : '-'}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">Құрылған уақыт</Text>
            <Text fw={500}>{new Date(order.createdAt).toLocaleString()}</Text>
          </div>
        </Group>
      </Card>

      <Card withBorder shadow="sm" p="md" mb="md">
        <Title order={5} mb="sm">Тауарлар</Title>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Өнім</Table.Th>
              <Table.Th>SKU</Table.Th>
              <Table.Th>Саны</Table.Th>
              <Table.Th>Бағасы</Table.Th>
              <Table.Th>Сома</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {order.items?.map(item => (
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
                <Table.Td colSpan={5}><Text c="dimmed" ta="center">Тауарлар жоқ</Text></Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <Group justify="flex-end" mt="sm">
          <Text size="sm" c="dimmed">Жалпы сома: </Text>
          <Text fw={700}>{totalAmount.toLocaleString()} ₸</Text>
          <Text size="sm" c="dimmed" ml="lg">Өзіндік құн: </Text>
          <Text fw={700}>{totalCost.toLocaleString()} ₸</Text>
        </Group>
      </Card>

      {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
        <Card withBorder shadow="sm" p="md" mb="md">
          <Title order={5} mb="sm">Күйді өзгерту</Title>
          <Group>
            {availableNext.map(nextStatus => (
              <Button
                key={nextStatus}
                color={nextStatus === 'Cancelled' ? 'red' : statusColor[nextStatus] || 'blue'}
                onClick={() => handleStatusUpdate(nextStatus)}
                loading={updating}
              >
                {nextStatus === 'Cancelled' ? 'Бас тарту' : nextStatus}
              </Button>
            ))}
          </Group>
        </Card>
      )}

      <Modal
        opened={pickModalOpened}
        onClose={() => setPickModalOpened(false)}
        title="Пик-парақ"
        size="lg"
      >
        {pickLoading ? (
          <Group justify="center" py="md"><Loader /></Group>
        ) : pickList.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">Пик-парақ деректері жоқ</Text>
        ) : (
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Өнім</Table.Th>
                <Table.Th>SKU</Table.Th>
                <Table.Th>Саны</Table.Th>
                <Table.Th>Орналасуы</Table.Th>
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
