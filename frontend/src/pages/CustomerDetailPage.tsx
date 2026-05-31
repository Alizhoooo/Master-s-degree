import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import {
  Title, Badge, Button, Card, Tabs, Table, Textarea, TextInput, Group, Text, Container, Alert,
} from '@mantine/core';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import { useCustomer, useAddContactLog, useCreateComplaint } from '../api/hooks';
import { DetailSkeleton } from '../components/Skeleton';

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
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading } = useCustomer(Number(id));
  const contactLogMutation = useAddContactLog();
  const complaintMutation = useCreateComplaint();

  const [contactNote, setContactNote] = useState('');
  const [compTitle, setCompTitle] = useState('');
  const [compDesc, setCompDesc] = useState('');

  const handleAddContactLog = async () => {
    if (!contactNote.trim() || !customer) return;
    try {
      await contactLogMutation.mutateAsync({ customerId: customer.id, note: contactNote });
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.success'), message: t('customer.successCreated'), color: 'green' });
      setContactNote('');
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.error'), message: err.message, color: 'red' });
    }
  };

  const handleAddComplaint = async () => {
    if (!compTitle.trim() || !compDesc.trim() || !customer) return;
    try {
      await complaintMutation.mutateAsync({ customerId: customer.id, title: compTitle, description: compDesc });
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.success'), message: t('customer.successCreated'), color: 'green' });
      setCompTitle('');
      setCompDesc('');
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.error'), message: err.message, color: 'red' });
    }
  };

  if (isLoading) return <DetailSkeleton />;

  if (!customer) {
    return (
      <Container size="xl">
        <Alert color="red">{t('customer.notFound')}</Alert>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Group mb="md">
        <Button component={Link} to="/customers" variant="subtle" leftSection={<IconArrowLeft size={16} />}>
          {t('common.back')}
        </Button>
      </Group>

      <Group mb="lg">
        <Title order={3}>{customer.company}</Title>
        <Badge size="lg" color={tierColor[customer.tier] || 'gray'}>{customer.tier}</Badge>
      </Group>

      <Card withBorder shadow="sm" p="md" mb="md">
        <Title order={5} mb="sm">{t('customer.info')}</Title>
        <Group>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">{t('customer.contactPerson')}</Text>
            <Text fw={500}>{customer.contactPerson}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">{t('customer.phone')}</Text>
            <Text fw={500}>{customer.phone}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">{t('customer.email')}</Text>
            <Text fw={500}>{customer.email}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">{t('customer.orderHistory')}</Text>
            <Text fw={500}>{customer.totalOrders}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">{t('customer.info')}</Text>
            <Text fw={500}>{customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : '-'}</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">{t('customer.createdDate')}</Text>
            <Text fw={500}>{new Date(customer.createdAt).toLocaleString()}</Text>
          </div>
        </Group>
      </Card>

      <Tabs defaultValue="orders">
        <Tabs.List>
          <Tabs.Tab value="orders">{t('customer.orderHistory')}</Tabs.Tab>
          <Tabs.Tab value="contactLog">{t('customer.contactLog')}</Tabs.Tab>
          <Tabs.Tab value="complaints">{t('customer.complaints')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="orders" pt="md">
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>{t('order.status')}</Table.Th>
                <Table.Th>{t('order.amount')}</Table.Th>
                <Table.Th>{t('order.date')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {customer.orders?.map((o: any) => (
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
                  <Table.Td colSpan={4}><Text c="dimmed" ta="center" py="md">{t('customer.noOrders')}</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="contactLog" pt="md">
          {customer.contactLogs?.map((log: any) => (
            <Card key={log.id} withBorder shadow="sm" p="sm" mb="sm">
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">{new Date(log.createdAt).toLocaleString()}</Text>
              </Group>
              <Text size="sm">{log.note}</Text>
            </Card>
          ))}
          {(!customer.contactLogs || customer.contactLogs.length === 0) && (
            <Text c="dimmed" ta="center" py="md">{t('customer.noContactLogs')}</Text>
          )}

          <Textarea
            label={t('customer.newContactLog')}
            placeholder={t('customer.contactLogPlaceholder')}
            value={contactNote}
            onChange={e => setContactNote(e.currentTarget.value)}
            minRows={3}
            mb="sm"
            mt="md"
          />
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleAddContactLog}
            loading={contactLogMutation.isPending}
            disabled={!contactNote.trim()}
          >
            {t('common.add')}
          </Button>
        </Tabs.Panel>

        <Tabs.Panel value="complaints" pt="md">
          {customer.complaints?.map((c: any) => (
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
            <Text c="dimmed" ta="center" py="md">{t('customer.noComplaints')}</Text>
          )}

          <TextInput
            label={t('customer.newComplaint')}
            placeholder={t('customer.complaintTitle')}
            value={compTitle}
            onChange={e => setCompTitle(e.currentTarget.value)}
            mb="sm"
            mt="md"
          />
          <Textarea
            placeholder={t('customer.complaintDesc')}
            value={compDesc}
            onChange={e => setCompDesc(e.currentTarget.value)}
            minRows={3}
            mb="sm"
          />
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleAddComplaint}
            loading={complaintMutation.isPending}
            disabled={!compTitle.trim() || !compDesc.trim()}
          >
            {t('customer.addComplaint')}
          </Button>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
