import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Modal, TextInput, Select, Badge, Title, Group, Container, Text,
} from '@mantine/core';
import { IconPlus, IconEdit } from '@tabler/icons-react';
import { useCustomers, useCreateCustomer, useUpdateCustomer } from '../api/hooks';
import { TableSkeleton } from '../components/Skeleton';

const tierColor: Record<string, string> = {
  VIP: 'yellow',
  Regular: 'blue',
  Problematic: 'red',
};

const defaultForm = { company: '', contactPerson: '', phone: '', email: '', tier: 'Regular' };

export default function CustomersPage() {
  const navigate = useNavigate();
  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const [opened, setOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setOpened(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({ company: c.company, contactPerson: c.contactPerson, phone: c.phone, email: c.email, tier: c.tier });
    setOpened(true);
  };

  const handleSubmit = async () => {
    if (!form.company.trim() || !form.contactPerson.trim()) return;
    try {
      if (editingId) {
        await updateCustomer.mutateAsync({ id: editingId, data: form });
      } else {
        await createCustomer.mutateAsync(form);
      }
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Сәтті', message: editingId ? 'Клиент жаңартылды' : 'Клиент қосылды', color: 'green' });
      setOpened(false);
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Қате', message: err.message, color: 'red' });
    }
  };

  if (isLoading) {
    return (
      <Container size="xl">
        <Group justify="space-between" mb="md">
          <Title order={3}>Клиенттер</Title>
        </Group>
        <TableSkeleton rows={5} cols={8} />
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>Клиенттер</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>Жаңа клиент</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Компания</Table.Th>
            <Table.Th>Байланыс тұлға</Table.Th>
            <Table.Th>Телефон</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Тиер</Table.Th>
            <Table.Th>Тапсырыстар саны</Table.Th>
            <Table.Th>Соңғы тапсырыс</Table.Th>
            <Table.Th>Әрекеттер</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {customers.map((c: any) => (
            <Table.Tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/customers/${c.id}`)}>
              <Table.Td>{c.company}</Table.Td>
              <Table.Td>{c.contactPerson}</Table.Td>
              <Table.Td>{c.phone}</Table.Td>
              <Table.Td>{c.email}</Table.Td>
              <Table.Td><Badge color={tierColor[c.tier] || 'gray'}>{c.tier}</Badge></Table.Td>
              <Table.Td>{c.totalOrders}</Table.Td>
              <Table.Td>{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : '-'}</Table.Td>
              <Table.Td>
                <Button variant="light" size="xs" leftSection={<IconEdit size={14} />} onClick={e => { e.stopPropagation(); openEdit(c); }}>
                  Өңдеу
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
          {customers.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={8}><Text c="dimmed" ta="center" py="md">Клиенттер жоқ</Text></Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={() => setOpened(false)} title={editingId ? 'Клиентті өңдеу' : 'Жаңа клиент'}>
        <TextInput label="Компания" placeholder="Компания атауы" value={form.company} onChange={e => setForm({ ...form, company: e.currentTarget.value })} required mb="sm" />
        <TextInput label="Байланыс тұлға" placeholder="Байланыс тұлға" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.currentTarget.value })} required mb="sm" />
        <TextInput label="Телефон" placeholder="Телефон нөмірі" value={form.phone} onChange={e => setForm({ ...form, phone: e.currentTarget.value })} mb="sm" />
        <TextInput label="Email" placeholder="Электронды пошта" value={form.email} onChange={e => setForm({ ...form, email: e.currentTarget.value })} mb="sm" />
        <Select label="Тиер" data={['VIP', 'Regular', 'Problematic']} value={form.tier} onChange={v => setForm({ ...form, tier: v || 'Regular' })} mb="lg" />
        <Group justify="flex-end">
          <Button onClick={handleSubmit} loading={createCustomer.isPending || updateCustomer.isPending} disabled={!form.company.trim() || !form.contactPerson.trim()}>
            {editingId ? 'Сақтау' : 'Қосу'}
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
