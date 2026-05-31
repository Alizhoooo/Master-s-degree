import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      showNotification({ title: t('common.success'), message: editingId ? t('customer.successUpdated') : t('customer.successCreated'), color: 'green' });
      setOpened(false);
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('common.error'), message: err.message, color: 'red' });
    }
  };

  if (isLoading) {
    return (
      <Container size="xl">
        <Group justify="space-between" mb="md">
          <Title order={3}>{t('customer.title')}</Title>
        </Group>
        <TableSkeleton rows={5} cols={8} />
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('customer.title')}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>{t('customer.newCustomer')}</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('customer.company')}</Table.Th>
            <Table.Th>{t('customer.contact')}</Table.Th>
            <Table.Th>{t('customer.phone')}</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>{t('customer.tier')}</Table.Th>
            <Table.Th>{t('customer.totalOrders')}</Table.Th>
            <Table.Th>{t('customer.lastOrder')}</Table.Th>
            <Table.Th>{t('common.actions')}</Table.Th>
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
                  {t('common.edit')}
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
          {customers.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={8}><Text c="dimmed" ta="center" py="md">{t('customer.noCustomers')}</Text></Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={() => setOpened(false)} title={editingId ? t('customer.editCustomer') : t('customer.newCustomer')}>
        <TextInput label={t('customer.company')} placeholder={t('customer.companyName')} value={form.company} onChange={e => setForm({ ...form, company: e.currentTarget.value })} required mb="sm" />
        <TextInput label={t('customer.contact')} placeholder={t('customer.contactPerson')} value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.currentTarget.value })} required mb="sm" />
        <TextInput label={t('customer.phone')} placeholder={t('customer.phoneNumber')} value={form.phone} onChange={e => setForm({ ...form, phone: e.currentTarget.value })} mb="sm" />
        <TextInput label="Email" placeholder={t('customer.email')} value={form.email} onChange={e => setForm({ ...form, email: e.currentTarget.value })} mb="sm" />
        <Select label={t('customer.tier')} data={['VIP', 'Regular', 'Problematic']} value={form.tier} onChange={v => setForm({ ...form, tier: v || 'Regular' })} mb="lg" />
        <Group justify="flex-end">
          <Button onClick={handleSubmit} loading={createCustomer.isPending || updateCustomer.isPending} disabled={!form.company.trim() || !form.contactPerson.trim()}>
            {editingId ? t('common.save') : t('common.add')}
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
