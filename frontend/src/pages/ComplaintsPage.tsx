import React, { useState } from 'react';
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
      showNotification({ title: 'Сәтті', message: 'Шағым қосылды', color: 'green' });
      setCreateOpened(false);
      setCustomerId(null);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Қате', message: err.message, color: 'red' });
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedComplaint || !newStatus) return;
    try {
      await updateStatus.mutateAsync({ id: selectedComplaint.id, status: newStatus });
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Сәтті', message: 'Күй жаңартылды', color: 'green' });
      setStatusOpened(false);
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Қате', message: err.message, color: 'red' });
    }
  };

  if (isLoading) {
    return (
      <Container size="xl">
        <Group justify="space-between" mb="md">
          <Title order={3}>Шағымдарды басқару</Title>
        </Group>
        <TableSkeleton rows={5} cols={7} />
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>Шағымдарды басқару</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpened(true)}>Жаңа шағым</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Клиент</Table.Th>
            <Table.Th>Тақырып</Table.Th>
            <Table.Th>Сипаттама</Table.Th>
            <Table.Th>Күй</Table.Th>
            <Table.Th>Күні</Table.Th>
            <Table.Th>Әрекеттер</Table.Th>
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
                  Өңдеу
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
          {complaints.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={7}><Text c="dimmed" ta="center" py="md">Шағымдар жоқ</Text></Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Modal opened={createOpened} onClose={() => setCreateOpened(false)} title="Жаңа шағым">
        <Select
          label="Клиент"
          placeholder="Клиентті таңдаңыз"
          data={customerData}
          value={customerId !== null ? String(customerId) : null}
          onChange={v => setCustomerId(v ? Number(v) : null)}
          searchable
          required
          mb="sm"
        />
        <TextInput label="Тақырып" placeholder="Шағым тақырыбы" value={title} onChange={e => setTitle(e.currentTarget.value)} required mb="sm" />
        <Textarea label="Сипаттама" placeholder="Шағым сипаттамасы" value={description} onChange={e => setDescription(e.currentTarget.value)} required mb="lg" />
        <Group justify="flex-end">
          <Button onClick={handleCreate} loading={createComplaint.isPending} disabled={!customerId || !title.trim() || !description.trim()}>Қосу</Button>
        </Group>
      </Modal>

      <Modal opened={statusOpened} onClose={() => setStatusOpened(false)} title="Шағым күйін өзгерту">
        <Select label="Күй" data={['Open', 'InProgress', 'Resolved']} value={newStatus} onChange={setNewStatus} mb="lg" />
        <Group justify="flex-end">
          <Button onClick={handleStatusUpdate} loading={updateStatus.isPending} disabled={!newStatus}>Сақтау</Button>
        </Group>
      </Modal>
    </Container>
  );
}
