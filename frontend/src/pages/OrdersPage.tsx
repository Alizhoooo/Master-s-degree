import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Table, Button, Modal, Select, NumberInput, TextInput, Textarea, Badge,
  Group, Title, Loader, Pagination, Container, Text,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconEye, IconX } from '@tabler/icons-react';
import { useOrders, useCustomers, useProducts, useCreateOrder, useCancelOrder } from '../api/hooks';
import { TableSkeleton } from '../components/Skeleton';

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

export default function OrdersPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState(false);
  const limit = 20;

  const { data: ordersRes, isLoading } = useOrders({ page: String(page), limit: String(limit) });
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const createOrder = useCreateOrder();
  const cancelOrder = useCancelOrder();

  const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data ?? ordersRes?.orders ?? []);
  const total = ordersRes?.total ?? orders.length;

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [productRows, setProductRows] = useState<{ productId: number | null; quantity: number }[]>([
    { productId: null, quantity: 1 },
  ]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setCustomerId(null);
    setProductRows([{ productId: null, quantity: 1 }]);
    setDeliveryAddress('');
    setDeadline(null);
    setNotes('');
  };

  const addProductRow = () => {
    setProductRows([...productRows, { productId: null, quantity: 1 }]);
  };

  const updateProductRow = (index: number, field: 'productId' | 'quantity', value: number | null) => {
    const rows = [...productRows];
    rows[index] = { ...rows[index], [field]: value ?? 1 };
    setProductRows(rows);
  };

  const removeProductRow = (index: number) => {
    setProductRows(productRows.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async () => {
    if (!customerId || productRows.length === 0 || productRows.some(r => !r.productId) || !deliveryAddress.trim()) return;
    try {
      await createOrder.mutateAsync({
        customerId,
        items: productRows.map(r => ({ productId: r.productId, quantity: r.quantity })),
        deliveryAddress,
        deadline: deadline ? deadline.toISOString() : undefined,
        notes: notes || undefined,
      });
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.success'), message: t('order.successCreated'), color: 'green' });
      setOpened(false);
      resetForm();
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('common.error'), message: err.message, color: 'red' });
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelOrder.mutateAsync(id);
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.success'), message: t('order.successCancelled'), color: 'green' });
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('common.error'), message: err.message, color: 'red' });
    }
  };

  const canCancel = (status: string) => status !== 'Cancelled' && status !== 'Delivered';

  const customerData = customers.map((c: any) => ({ value: String(c.id), label: c.company || c.contactPerson }));
  const productData = products.map((p: any) => ({ value: String(p.id), label: `${p.name} (${p.sku})` }));

  if (isLoading) {
    return (
      <Container size="xl">
        <Group justify="space-between" mb="md">
          <Title order={3}>{t('order.title')}</Title>
        </Group>
        <TableSkeleton rows={5} cols={7} />
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('order.title')}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setOpened(true)}>
          {t('order.create')}
        </Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('order.id')}</Table.Th>
            <Table.Th>{t('order.customer')}</Table.Th>
            <Table.Th>{t('order.products')}</Table.Th>
            <Table.Th>{t('order.amount')}</Table.Th>
            <Table.Th>{t('common.status')}</Table.Th>
            <Table.Th>{t('order.deadline')}</Table.Th>
            <Table.Th>{t('common.actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {orders.map((order: any) => (
            <Table.Tr key={order.id}>
              <Table.Td>{order.id}</Table.Td>
              <Table.Td>{order.customer?.company || order.customer?.contactPerson || `#${order.customerId}`}</Table.Td>
              <Table.Td>
                {order.items?.slice(0, 3).map((i: any) => i.product?.name || `#${i.productId}`).join(', ')}
                {(order.items?.length ?? 0) > 3 ? '...' : ''}
              </Table.Td>
              <Table.Td>{order.totalAmount?.toLocaleString()} ₸</Table.Td>
              <Table.Td>
                <Badge color={statusColor[order.status] || 'gray'}>{order.status}</Badge>
              </Table.Td>
              <Table.Td>{order.deadline ? new Date(order.deadline).toLocaleDateString() : '-'}</Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Button
                    component={Link}
                    to={`/orders/${order.id}`}
                    variant="light"
                    size="xs"
                    leftSection={<IconEye size={14} />}
                  >
                    {t('order.view')}
                  </Button>
                  {canCancel(order.status) && (
                    <Button
                      variant="light"
                      color="red"
                      size="xs"
                      leftSection={<IconX size={14} />}
                      onClick={() => handleCancel(order.id)}
                      loading={cancelOrder.isPending && cancelOrder.variables === order.id}
                    >
                      {t('order.cancel')}
                    </Button>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
          {orders.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={7}>
                <Text c="dimmed" ta="center" py="md">{t('order.noOrders')}</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      {total > limit && (
        <Group justify="center" mt="md">
          <Pagination total={Math.ceil(total / limit)} value={page} onChange={setPage} />
        </Group>
      )}

      <Modal
        opened={opened}
        onClose={() => { setOpened(false); resetForm(); }}
        title={t('order.create')}
        size="lg"
      >
        <Select
          label={t('order.customer')}
          placeholder={t('order.selectCustomer')}
          data={customerData}
          value={customerId !== null ? String(customerId) : null}
          onChange={v => setCustomerId(v ? Number(v) : null)}
          searchable
          required
          mb="sm"
        />

        {productRows.map((row, i) => (
          <Group key={i} align="flex-end" mb="xs">
            <Select
              label={i === 0 ? t('inventory.name') : undefined}
              placeholder={t('order.selectProduct')}
              data={productData}
              value={row.productId !== null ? String(row.productId) : null}
              onChange={v => updateProductRow(i, 'productId', v ? Number(v) : null)}
              searchable
              required
              style={{ flex: 1 }}
            />
            <NumberInput
              label={i === 0 ? t('dashboard.quantity') : undefined}
              placeholder={t('dashboard.quantity')}
              value={row.quantity}
              onChange={v => updateProductRow(i, 'quantity', Number(v) || 1)}
              min={1}
              style={{ width: 100 }}
              required
            />
            {productRows.length > 1 && (
              <Button variant="light" color="red" size="sm" onClick={() => removeProductRow(i)}>
                <IconX size={14} />
              </Button>
            )}
          </Group>
        ))}

        <Button variant="subtle" leftSection={<IconPlus size={14} />} onClick={addProductRow} mb="sm" size="sm">
          {t('order.addProduct')}
        </Button>

        <TextInput
          label={t('order.deliveryAddress')}
          placeholder={t('order.enterAddress')}
          value={deliveryAddress}
          onChange={e => setDeliveryAddress(e.currentTarget.value)}
          required
          mb="sm"
        />

        <DatePickerInput
          label={t('order.deadline')}
          placeholder={t('order.selectDeadline')}
          value={deadline}
          onChange={setDeadline}
          mb="sm"
          clearable
        />

        <Textarea
          label={t('order.notes')}
          placeholder={t('order.optionalInfo')}
          value={notes}
          onChange={e => setNotes(e.currentTarget.value)}
          mb="lg"
        />

        <Group justify="flex-end">
          <Button
            onClick={handleCreateOrder}
            loading={createOrder.isPending}
            disabled={!customerId || productRows.some(r => !r.productId) || !deliveryAddress.trim()}
          >
            {t('order.createOrder')}
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
