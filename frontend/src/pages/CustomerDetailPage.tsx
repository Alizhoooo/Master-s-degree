import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Title, Badge, Button, Card, Tabs, Table, Textarea, TextInput, Group, Text, Loader, Container, Alert,
} from '@mantine/core';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import { getCustomer, addContactLog, createComplaint } from '../api';
import { Customer } from '../types';

const tierColor: Record<string, string> = {
  VIP: 'yellow',
  Regular: 'blue',
  Problematic: 'red',
};

const complaintStatusColor: Record<string, string> = {
  Open: 'red',
  InProgress: 'orange',
  Resolved: 'green',
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const [contactNote, setContactNote] = useState('');

  const [compTitle, setCompTitle] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const res = await getCustomer(Number(id));
      setCustomer(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCustomer();
  }, [id]);

  const handleAddContactLog = async () => {
    if (!contactNote.trim() || !customer) return;
    setSubmittingContact(true);
    try {
      await addContactLog(customer.id, contactNote);
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Сәтті', message: 'Жазба қосылды', color: 'green' });
      setContactNote('');
      fetchCustomer();
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Қате', message: err.message, color: 'red' });
    } finally {
      setSubmittingContact(false);
    }
  };

  const handleAddComplaint = async () => {
    if (!compTitle.trim() || !compDesc.trim() || !customer) return;
    setSubmittingComplaint(true);
    try {
      await createComplaint({ customerId: customer.id, title: compTitle, description: compDesc });
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Сәтті', message: 'Шағым қосылды', color: 'green' });
      setCompTitle('');
      setCompDesc('');
      fetchCustomer();
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Қате', message: err.message, color: 'red' });
    } finally {
      setSubmittingComplaint(false);
    }
  };

  if (loading) {
    return (
      <Container size="xl">
        <Group justify="center" py="xl"><Loader /></Group>
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container size="xl">
        <Alert color="red">Клиент табылмады</Alert>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Group mb="md">
        <Button component={Link} to="/customers" variant="subtle" leftSection={<IconArrowLeft size={16} />}>
          Артқа
        </Button>
      </Group>

      <Group mb="lg">
        <Title order={3}>{customer.company}</Title>
        <Badge size="lg" color={tierColor[customer.tier] || 'gray'}>{customer.tier}</Badge>
      </Group>

      <Card withBorder shadow="sm" p="md" mb="md">
        <Title order={5} mb="sm">Клиент ақпараты</Title>
        <Group>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">Байланыс тұлға</Text>
            <Text fw={500}>{customer.contactPerson}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">Телефон</Text>
            <Text fw={500}>{customer.phone}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">Email</Text>
            <Text fw={500}>{customer.email}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">Тапсырыстар саны</Text>
            <Text fw={500}>{customer.totalOrders}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">Соңғы тапсырыс</Text>
            <Text fw={500}>{customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : '-'}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">Құрылған уақыт</Text>
            <Text fw={500}>{new Date(customer.createdAt).toLocaleString()}</Text>
          </div>
        </Group>
      </Card>

      <Tabs defaultValue="orders">
        <Tabs.List>
          <Tabs.Tab value="orders">Тапсырыс тарихы</Tabs.Tab>
          <Tabs.Tab value="contactLog">Байланыс журналы</Tabs.Tab>
          <Tabs.Tab value="complaints">Шағымдар</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="orders" pt="md">
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Күй</Table.Th>
                <Table.Th>Сома</Table.Th>
                <Table.Th>Күні</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {customer.orders?.map(o => (
                <Table.Tr key={o.id}>
                  <Table.Td>{o.id}</Table.Td>
                  <Table.Td>
                    <Badge color={o.status === 'Delivered' ? 'green' : o.status === 'Cancelled' ? 'red' : 'blue'}>
                      {o.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{o.totalAmount?.toLocaleString()} ₸</Table.Td>
                  <Table.Td>{new Date(o.createdAt).toLocaleDateString()}</Table.Td>
                </Table.Tr>
              ))}
              {(!customer.orders || customer.orders.length === 0) && (
                <Table.Tr>
                  <Table.Td colSpan={4}><Text c="dimmed" ta="center" py="md">Тапсырыстар жоқ</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="contactLog" pt="md">
          {customer.contactLogs?.map(log => (
            <Card key={log.id} withBorder shadow="sm" p="sm" mb="sm">
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">{new Date(log.createdAt).toLocaleString()}</Text>
              </Group>
              <Text size="sm">{log.note}</Text>
            </Card>
          ))}
          {(!customer.contactLogs || customer.contactLogs.length === 0) && (
            <Text c="dimmed" ta="center" py="md">Байланыс жазбалары жоқ</Text>
          )}

          <Textarea
            label="Жаңа жазба"
            placeholder="Жазба мәтіні"
            value={contactNote}
            onChange={e => setContactNote(e.currentTarget.value)}
            minRows={3}
            mb="sm"
            mt="md"
          />
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleAddContactLog}
            loading={submittingContact}
            disabled={!contactNote.trim()}
          >
            Қосу
          </Button>
        </Tabs.Panel>

        <Tabs.Panel value="complaints" pt="md">
          {customer.complaints?.map(c => (
            <Card key={c.id} withBorder shadow="sm" p="sm" mb="sm">
              <Group justify="space-between" mb={4}>
                <Text fw={500}>{c.title}</Text>
                <Badge color={complaintStatusColor[c.status] || 'gray'}>{c.status}</Badge>
              </Group>
              <Text size="sm" mb={4}>{c.description}</Text>
              <Text size="xs" c="dimmed">{new Date(c.createdAt).toLocaleString()}</Text>
            </Card>
          ))}
          {(!customer.complaints || customer.complaints.length === 0) && (
            <Text c="dimmed" ta="center" py="md">Шағымдар жоқ</Text>
          )}

          <TextInput
            label="Жаңа шағым"
            placeholder="Тақырыбы"
            value={compTitle}
            onChange={e => setCompTitle(e.currentTarget.value)}
            mb="sm"
            mt="md"
          />
          <Textarea
            placeholder="Сипаттамасы"
            value={compDesc}
            onChange={e => setCompDesc(e.currentTarget.value)}
            minRows={3}
            mb="sm"
          />
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleAddComplaint}
            loading={submittingComplaint}
            disabled={!compTitle.trim() || !compDesc.trim()}
          >
            Шағым қосу
          </Button>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
