import React, { useState, useEffect } from 'react';
import {
  Container, Title, Group, Button, Table, Modal, TextInput, PasswordInput,
  Select, NumberInput, Badge, Loader, Text, Tabs,
} from '@mantine/core';
import { IconPlus, IconUser } from '@tabler/icons-react';
import { getUsers, createUser, updateUserRole, getConfig, setConfig, getSystemLogs } from '../api';
import { User } from '../types';

const roleOptions = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Viewer', label: 'Viewer' },
];

interface SystemLog {
  id: number;
  userId: number;
  user?: User;
  action: string;
  details: string;
  createdAt: string;
}

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<string | null>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [betaValue, setBetaValue] = useState<number>(0);
  const [companyName, setCompanyName] = useState('');
  const [configLoading, setConfigLoading] = useState(true);

  const [addModal, setAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<string | null>('Viewer');
  const [submitting, setSubmitting] = useState(false);

  const [roleEditModal, setRoleEditModal] = useState<{ user: User; role: string } | null>(null);
  const [roleEditSubmitting, setRoleEditSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await getUsers();
      setUsers(Array.isArray(res) ? res : res.data ?? res.users ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchConfig = async () => {
    setConfigLoading(true);
    try {
      const beta = await getConfig('beta');
      setBetaValue(Number(beta.value ?? beta) || 0);
      const company = await getConfig('companyName');
      setCompanyName(company.value ?? company ?? '');
    } catch (err) {
      console.error(err);
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await getSystemLogs();
      setLogs(Array.isArray(res) ? res : res.data ?? res.logs ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchConfig();
    fetchLogs();
  }, []);

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword || !newFullName || !newRole) return;
    setSubmitting(true);
    try {
      await createUser({ email: newEmail, password: newPassword, fullName: newFullName, role: newRole });
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Сәтті', message: 'Пайдаланушы қосылды', color: 'green' });
      setAddModal(false);
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setNewRole('Viewer');
      fetchUsers();
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Қате', message: err.message, color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleEdit = async () => {
    if (!roleEditModal) return;
    setRoleEditSubmitting(true);
    try {
      await updateUserRole(roleEditModal.user.id, roleEditModal.role);
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Сәтті', message: 'Рөл жаңартылды', color: 'green' });
      setRoleEditModal(null);
      fetchUsers();
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Қате', message: err.message, color: 'red' });
    } finally {
      setRoleEditSubmitting(false);
    }
  };

  const handleSaveBeta = async () => {
    try {
      await setConfig('beta', String(betaValue));
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Сәтті', message: 'Конфигурация сақталды', color: 'green' });
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: 'Қате', message: err.message, color: 'red' });
    }
  };

  return (
    <Container size="xl">
      <Title order={3} mb="md">Әкімші панелі</Title>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="users" leftSection={<IconUser size={14} />}>Пайдаланушылар</Tabs.Tab>
          <Tabs.Tab value="config">Жүйе конфигурациясы</Tabs.Tab>
          <Tabs.Tab value="logs">Жүйе журналы</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="users">
          <Group justify="flex-end" mb="md">
            <Button leftSection={<IconPlus size={16} />} onClick={() => setAddModal(true)}>
              Пайдаланушы қосу
            </Button>
          </Group>

          {loadingUsers ? (
            <Group justify="center" py="xl"><Loader /></Group>
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Аты-жөні</Table.Th>
                  <Table.Th>Рөлі</Table.Th>
                  <Table.Th>Құрылған күні</Table.Th>
                  <Table.Th>Әрекеттер</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map(u => (
                  <Table.Tr key={u.id}>
                    <Table.Td>{u.id}</Table.Td>
                    <Table.Td>{u.email}</Table.Td>
                    <Table.Td>{u.fullName}</Table.Td>
                    <Table.Td><Badge>{u.role}</Badge></Table.Td>
                    <Table.Td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</Table.Td>
                    <Table.Td>
                      <Button
                        variant="light"
                        size="xs"
                        onClick={() => setRoleEditModal({ user: u, role: u.role })}
                      >
                        Рөлді өзгерту
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {users.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text c="dimmed" ta="center" py="md">Пайдаланушылар жоқ</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="config">
          {configLoading ? (
            <Group justify="center" py="xl"><Loader /></Group>
          ) : (
            <>
              <Group mb="md" align="flex-end">
                <NumberInput
                  label="Beta мәні"
                  placeholder="Beta"
                  value={betaValue}
                  onChange={v => setBetaValue(Number(v) || 0)}
                  decimalScale={4}
                  step={0.01}
                  style={{ width: 200 }}
                />
                <Button onClick={handleSaveBeta}>Сақтау</Button>
              </Group>
              <Text size="sm" c="dimmed">Компания атауы: {companyName}</Text>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="logs">
          {loadingLogs ? (
            <Group justify="center" py="xl"><Loader /></Group>
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Уақыты</Table.Th>
                  <Table.Th>Пайдаланушы</Table.Th>
                  <Table.Th>Әрекет</Table.Th>
                  <Table.Th>Мәлімет</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {logs.map(log => (
                  <Table.Tr key={log.id}>
                    <Table.Td>{new Date(log.createdAt).toLocaleString()}</Table.Td>
                    <Table.Td>{log.user?.fullName || log.user?.email || `#${log.userId}`}</Table.Td>
                    <Table.Td>{log.action}</Table.Td>
                    <Table.Td>{log.details}</Table.Td>
                  </Table.Tr>
                ))}
                {logs.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text c="dimmed" ta="center" py="md">Журнал жазбалары жоқ</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={addModal}
        onClose={() => setAddModal(false)}
        title="Пайдаланушы қосу"
      >
        <TextInput
          label="Email"
          placeholder="Email"
          value={newEmail}
          onChange={e => setNewEmail(e.currentTarget.value)}
          required
          mb="sm"
        />
        <PasswordInput
          label="Құпия сөз"
          placeholder="Құпия сөз"
          value={newPassword}
          onChange={e => setNewPassword(e.currentTarget.value)}
          required
          mb="sm"
        />
        <TextInput
          label="Аты-жөні"
          placeholder="Аты-жөні"
          value={newFullName}
          onChange={e => setNewFullName(e.currentTarget.value)}
          required
          mb="sm"
        />
        <Select
          label="Рөлі"
          data={roleOptions}
          value={newRole}
          onChange={setNewRole}
          mb="lg"
        />
        <Group justify="flex-end">
          <Button onClick={handleCreateUser} loading={submitting}>Қосу</Button>
        </Group>
      </Modal>

      <Modal
        opened={!!roleEditModal}
        onClose={() => setRoleEditModal(null)}
        title="Рөлді өзгерту"
      >
        {roleEditModal && (
          <>
            <Text mb="sm">
              Пайдаланушы: {roleEditModal.user.fullName} ({roleEditModal.user.email})
            </Text>
            <Select
              label="Жаңа рөл"
              data={roleOptions}
              value={roleEditModal.role}
              onChange={v => setRoleEditModal({ ...roleEditModal, role: v ?? 'Viewer' })}
              mb="lg"
            />
            <Group justify="flex-end">
              <Button onClick={handleRoleEdit} loading={roleEditSubmitting}>Сақтау</Button>
            </Group>
          </>
        )}
      </Modal>
    </Container>
  );
}
