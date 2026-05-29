import React, { useState, useEffect } from 'react';
import {
  Container, Title, Group, Button, Table, Select, Badge, Collapse, Loader, Text,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconFilter, IconDownload, IconX } from '@tabler/icons-react';
import { getReports, exportCsv, getCustomers } from '../api';
import { Order, Customer } from '../types';

const statusColor: Record<string, string> = {
  Pending: 'yellow', Confirmed: 'blue', Reserved: 'cyan', Paid: 'violet',
  Picked: 'orange', Shipped: 'indigo', Delivered: 'green', Cancelled: 'red',
};

const statusOptions = [
  { value: '', label: 'Барлығы' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Reserved', label: 'Reserved' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Picked', label: 'Picked' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [status, setStatus] = useState<string>('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const buildFilters = () => {
    const f: Record<string, string> = {};
    if (dateFrom) f.dateFrom = dateFrom.toISOString();
    if (dateTo) f.dateTo = dateTo.toISOString();
    if (status) f.status = status;
    if (customerId) f.customerId = customerId;
    return f;
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const filters = buildFilters();
      const res = await getReports(filters);
      setOrders(Array.isArray(res) ? res : res.data ?? res.orders ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    getCustomers()
      .then(c => setCustomers(Array.isArray(c) ? c : c.data ?? c.customers ?? []))
      .catch(console.error);
  }, []);

  const handleExportCsv = async () => {
    try {
      const filters = buildFilters();
      const csv = await exportCsv(filters);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Қате', message: err.message, color: 'red' });
    }
  };

  const clearFilters = () => {
    setDateFrom(null);
    setDateTo(null);
    setStatus('');
    setCustomerId(null);
  };

  const customerData = customers.map(c => ({
    value: String(c.id),
    label: c.company || c.contactPerson,
  }));

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>Есептер</Title>
        <Group>
          <Button
            variant="light"
            leftSection={<IconFilter size={16} />}
            onClick={() => setFiltersOpen(o => !o)}
          >
            Сүзгілер
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={handleExportCsv}
          >
            CSV экспорт
          </Button>
        </Group>
      </Group>

      <Collapse in={filtersOpen}>
        <Group mb="md" gap="sm" wrap="wrap">
          <DatePickerInput
            label="Басталу күні"
            placeholder="Басталу күні"
            value={dateFrom}
            onChange={setDateFrom}
            clearable
          />
          <DatePickerInput
            label="Аяқталу күні"
            placeholder="Аяқталу күні"
            value={dateTo}
            onChange={setDateTo}
            clearable
          />
          <Select
            label="Күй"
            placeholder="Күй"
            data={statusOptions}
            value={status}
            onChange={v => setStatus(v ?? '')}
            clearable
          />
          <Select
            label="Клиент"
            placeholder="Клиент"
            data={customerData}
            value={customerId}
            onChange={setCustomerId}
            searchable
            clearable
          />
          <Button onClick={fetchReports} mt="xl">Сүзгілеу</Button>
          <Button variant="light" color="gray" mt="xl" onClick={clearFilters}>
            Тазалау
          </Button>
        </Group>
      </Collapse>

      {loading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Клиент</Table.Th>
              <Table.Th>Күй</Table.Th>
              <Table.Th>Сома</Table.Th>
              <Table.Th>Мекен-жай</Table.Th>
              <Table.Th>Күні</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {orders.map(order => (
              <Table.Tr key={order.id}>
                <Table.Td>{order.id}</Table.Td>
                <Table.Td>
                  {order.customer?.company || order.customer?.contactPerson || `#${order.customerId}`}
                </Table.Td>
                <Table.Td>
                  <Badge color={statusColor[order.status] || 'gray'}>{order.status}</Badge>
                </Table.Td>
                <Table.Td>{order.totalAmount?.toLocaleString()} ₸</Table.Td>
                <Table.Td>{order.deliveryAddress}</Table.Td>
                <Table.Td>{new Date(order.createdAt).toLocaleDateString()}</Table.Td>
              </Table.Tr>
            ))}
            {orders.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed" ta="center" py="md">Есептер жоқ</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      )}
    </Container>
  );
}
