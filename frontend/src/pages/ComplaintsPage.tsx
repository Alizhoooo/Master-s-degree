import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Select, TextInput, Textarea, Badge, Title, Group, Loader, Container, Text,
} from '@mantine/core';
import { IconPlus, IconEdit } from '@tabler/icons-react';
import { getComplaints, createComplaint, updateComplaintStatus, getCustomers } from '../api';
import { Complaint, Customer } from '../types';

const statusColor: Record<string, string> = {
  Open: 'red',
  InProgress: 'orange',
  Resolved: 'green',
};

const defaultComplaintForm = { customerId: null as number | null, title: '', description: '' };

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpened, setCreateOpened] = useState(false);
  const [statusOpened, setStatusOpened] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(defaultComplaintForm);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await getComplaints();
      setComplaints(Array.isArray(res) ? res : res.data ?? res.complaints ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const openCreate = async () => {
    setForm(defaultComplaintForm);
    setCreateOpened(true);
    if (customers.length === 0) {
      try {
        const res = await getCustomers();
        setCustomers(Array.isArray(res) ? res : res.data ?? res.customers ?? []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openStatusChange = (c: Complaint) => {
    setSelectedComplaint(c);
    setNewStatus(c.status);
    setStatusOpened(true);
  };

  const handleCreate = async () => {
    if (!form.customerId || !form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    try {
      await createComplaint({ customerId: form.customerId, title: form.title, description: form.description });
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Сәтті', message: 'Шағым қосылды', color: 'green' });
      setCreateOpened(false);
      fetchComplaints();
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Қате', message: err.message, color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedComplaint || !newStatus) return;
    setSubmitting(true);
    try {
      await updateComplaintStatus(selectedComplaint.id, newStatus);
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Сәтті', message: 'Күй жаңартылды', color: 'green' });
      setStatusOpened(false);
      fetchComplaints();
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Қате', message: err.message, color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  const customerData = customers.map(c => ({ value: String(c.id), label: c.company || c.contactPerson }));

  if (loading && complaints.length === 0) {
    return (
      <Container size="xl">
        <Group justify="space-between" mb="md">
          <Title order={3}>Шағымдарды басқару</Title>
        </Group>
        <Group justify="center" py="xl"><Loader /></Group>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>Шағымдарды басқару</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>Жаңа шағым</Button>
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
          {complaints.map(c => (
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
                  onClick={() => openStatusChange(c)}
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
          value={form.customerId !== null ? String(form.customerId) : null}
          onChange={v => setForm({ ...form, customerId: v ? Number(v) : null })}
          searchable
          required
          mb="sm"
        />
        <TextInput
          label="Тақырып"
          placeholder="Шағым тақырыбы"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.currentTarget.value })}
          required
          mb="sm"
        />
        <Textarea
          label="Сипаттама"
          placeholder="Шағым сипаттамасы"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.currentTarget.value })}
          required
          mb="lg"
        />
        <Group justify="flex-end">
          <Button
            onClick={handleCreate}
            loading={submitting}
            disabled={!form.customerId || !form.title.trim() || !form.description.trim()}
          >
            Қосу
          </Button>
        </Group>
      </Modal>

      <Modal opened={statusOpened} onClose={() => setStatusOpened(false)} title="Шағым күйін өзгерту">
        <Select
          label="Күй"
          data={['Open', 'InProgress', 'Resolved']}
          value={newStatus}
          onChange={setNewStatus}
          mb="lg"
        />
        <Group justify="flex-end">
          <Button onClick={handleStatusUpdate} loading={submitting} disabled={!newStatus}>
            Сақтау
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
