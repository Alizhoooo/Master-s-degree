import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table, Button, Modal, Select, TextInput, Textarea, Badge, Title, Group, Container, Text,
} from '@mantine/core';
import { IconPlus, IconEdit } from '@tabler/icons-react';
import { useComplaints, useCustomers, useCreateComplaint, useUpdateComplaintStatus } from '../api/hooks';
import { TableSkeleton } from '../components/Skeleton';

const statusColor: Record<string, string> = {
  Open: 'red',
  InProgress: 'orange',
  Resolved: 'green',
};

export default function ComplaintsPage() {
  const { t } = useTranslation();
  const { data: complaints = [], isLoading } = useComplaints();
  const { data: customers = [] } = useCustomers();
  const createComplaint = useCreateComplaint();
  const updateStatus = useUpdateComplaintStatus();

  const [createOpened, setCreateOpened] = useState(false);
  const [statusOpened, setStatusOpened] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const customerData = customers.map((c: any) => ({ value: String(c.id), label: c.company || c.contactPerson }));

  const handleCreate = async () => {
    if (!customerId || !title.trim() || !description.trim()) return;
    try {
      await createComplaint.mutateAsync({ customerId, title, description });
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.success'), message: t('complaint.successCreated'), color: 'green' });
      setCreateOpened(false);
      setCustomerId(null);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.error'), message: err.message, color: 'red' });
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedComplaint || !newStatus) return;
    try {
      await updateStatus.mutateAsync({ id: selectedComplaint.id, status: newStatus });
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.success'), message: t('complaint.successUpdated'), color: 'green' });
      setStatusOpened(false);
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.error'), message: err.message, color: 'red' });
    }
  };

  if (isLoading) {
    return (
      <Container size="xl">
        <Group justify="space-between" mb="md">
          <Title order={3}>{t('complaint.title')}</Title>
        </Group>
        <TableSkeleton rows={5} cols={7} />
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('complaint.title')}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpened(true)}>{t('complaint.newComplaint')}</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('complaint.id')}</Table.Th>
            <Table.Th>{t('complaint.customer')}</Table.Th>
            <Table.Th>{t('complaint.fieldTitle')}</Table.Th>
            <Table.Th>{t('complaint.description')}</Table.Th>
            <Table.Th>{t('complaint.status')}</Table.Th>
            <Table.Th>{t('complaint.date')}</Table.Th>
            <Table.Th>{t('complaint.actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {complaints.map((c: any) => (
            <Table.Tr key={c.id}>
              <Table.Td>{c.id}</Table.Td>
              <Table.Td>{c.customer?.company || c.customer?.contactPerson || `#${c.customerId}`}</Table.Td>
              <Table.Td>{c.title}</Table.Td>
              <Table.Td>{c.description}</Table.Td>
              <Table.Td>
                <Badge color={statusColor[c.status] || 'gray'}>{c.status}</Badge>
              </Table.Td>
              <Table.Td>{new Date(c.createdAt).toLocaleDateString()}</Table.Td>
              <Table.Td>
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<IconEdit size={14} />}
                  onClick={() => { setSelectedComplaint(c); setNewStatus(c.status); setStatusOpened(true); }}
                >
                  {t('complaint.edit')}
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
          {complaints.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={7}><Text c="dimmed" ta="center" py="md">{t('complaint.noComplaints')}</Text></Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Modal opened={createOpened} onClose={() => setCreateOpened(false)} title={t('complaint.newComplaint')}>
        <Select
          label={t('complaint.customer')}
          placeholder={t('complaint.selectCustomer')}
          data={customerData}
          value={customerId !== null ? String(customerId) : null}
          onChange={v => setCustomerId(v ? Number(v) : null)}
          searchable
          required
          mb="sm"
        />
        <TextInput label={t('complaint.complaintTitle')} placeholder={t('complaint.complaintTitle')} value={title} onChange={e => setTitle(e.currentTarget.value)} required mb="sm" />
        <Textarea label={t('complaint.complaintDesc')} placeholder={t('complaint.complaintDesc')} value={description} onChange={e => setDescription(e.currentTarget.value)} required mb="lg" />
        <Group justify="flex-end">
          <Button onClick={handleCreate} loading={createComplaint.isPending} disabled={!customerId || !title.trim() || !description.trim()}>{t('complaint.add')}</Button>
        </Group>
      </Modal>

      <Modal opened={statusOpened} onClose={() => setStatusOpened(false)} title={t('complaint.changeStatus')}>
        <Select label={t('complaint.status')} data={['Open', 'InProgress', 'Resolved']} value={newStatus} onChange={setNewStatus} mb="lg" />
        <Group justify="flex-end">
          <Button onClick={handleStatusUpdate} loading={updateStatus.isPending} disabled={!newStatus}>{t('complaint.save')}</Button>
        </Group>
      </Modal>
    </Container>
  );
}
