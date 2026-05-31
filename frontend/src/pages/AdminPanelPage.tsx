import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container, Title, Group, Button, Table, Modal, TextInput, PasswordInput,
  Select, NumberInput, Badge, Text, Tabs,
} from '@mantine/core';
import { IconPlus, IconUser } from '@tabler/icons-react';
import { useUsers, useSystemLogs, useCreateUser, useUpdateUserRole, useSetConfig, useConfig } from '../api/hooks';
import { TableSkeleton } from '../components/Skeleton';

const roleOptions = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Warehouse', label: 'Warehouse' },
];

export default function AdminPanelPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string | null>('users');
  const { data: users = [], isLoading: loadingUsers, error: usersErr } = useUsers();
  const { data: logs = [], isLoading: loadingLogs } = useSystemLogs();
  const { data: betaConfig, isLoading: configLoading } = useConfig('beta');
  const { data: companyConfig } = useConfig('company_name');

  const createUser = useCreateUser();
  const updateRole = useUpdateUserRole();
  const setConfigMutation = useSetConfig();

  const betaValue = betaConfig?.value ? parseFloat(String(betaConfig.value)) : 0.05;
  const companyName = companyConfig?.value ? String(companyConfig.value) : '';

  const [addModal, setAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<string | null>('Manager');

  const [roleEditModal, setRoleEditModal] = useState<{ user: any; role: string } | null>(null);
  const [betaEdit, setBetaEdit] = useState<number>(betaValue);

  const error = usersErr ? (usersErr as any).message || t('common.error') : null;

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword || !newFullName || !newRole) return;
    try {
      await createUser.mutateAsync({ email: newEmail, password: newPassword, fullName: newFullName, role: newRole });
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.success'), message: t('admin.successCreated'), color: 'green' });
      setAddModal(false);
      setNewEmail(''); setNewPassword(''); setNewFullName(''); setNewRole('Manager');
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.error'), message: err.message, color: 'red' });
    }
  };

  const handleRoleEdit = async () => {
    if (!roleEditModal) return;
    try {
      await updateRole.mutateAsync({ id: roleEditModal.user.id, role: roleEditModal.role });
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.success'), message: t('admin.successRole'), color: 'green' });
      setRoleEditModal(null);
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.error'), message: err.message, color: 'red' });
    }
  };

  const handleSaveBeta = async () => {
    try {
      await setConfigMutation.mutateAsync({ key: 'beta', value: String(betaEdit) });
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.success'), message: t('admin.successConfig'), color: 'green' });
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({ title: t('notification.error'), message: err.message, color: 'red' });
    }
  };

  return (
    <Container size="xl">
      <Title order={3} mb="md">{t('admin.title')}</Title>

      {error && (
        <Text c="red" mb="md" p="xs" style={{ background: '#fff0f0', borderRadius: 4 }}>
          {t('common.error')}: {error}
        </Text>
      )}

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="users" leftSection={<IconUser size={14} />}>{t('admin.users')}</Tabs.Tab>
          <Tabs.Tab value="config">{t('admin.config')}</Tabs.Tab>
          <Tabs.Tab value="logs">{t('admin.logs')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="users">
          <Group justify="flex-end" mb="md">
            <Button leftSection={<IconPlus size={16} />} onClick={() => setAddModal(true)}>{t('admin.addUser')}</Button>
          </Group>

          {loadingUsers ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('admin.id')}</Table.Th>
                  <Table.Th>{t('admin.email')}</Table.Th>
                  <Table.Th>{t('admin.fullName')}</Table.Th>
                  <Table.Th>{t('admin.role')}</Table.Th>
                  <Table.Th>{t('admin.createdDate')}</Table.Th>
                  <Table.Th>{t('admin.actions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((u: any) => (
                  <Table.Tr key={u.id}>
                    <Table.Td>{u.id}</Table.Td>
                    <Table.Td>{u.email}</Table.Td>
                    <Table.Td>{u.fullName}</Table.Td>
                    <Table.Td><Badge>{u.role}</Badge></Table.Td>
                    <Table.Td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</Table.Td>
                    <Table.Td>
                      <Button variant="light" size="xs" onClick={() => setRoleEditModal({ user: u, role: u.role })}>
                        {t('admin.changeRole')}
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {users.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6}><Text c="dimmed" ta="center" py="md">{t('admin.noUsers')}</Text></Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="config">
          {configLoading ? (
            <TableSkeleton rows={2} cols={2} />
          ) : (
            <Group mb="md" align="flex-end">
              <NumberInput
                label={t('admin.betaLabel')}
                placeholder={t('admin.betaLabel')}
                value={betaEdit}
                onChange={v => setBetaEdit(Number(v) || 0)}
                decimalScale={4}
                step={0.01}
                style={{ width: 200 }}
              />
              <Button onClick={handleSaveBeta} loading={setConfigMutation.isPending}>{t('admin.save')}</Button>
              <Text size="sm" c="dimmed" ml="md">{t('admin.companyName')}: {companyName}</Text>
            </Group>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="logs">
          {loadingLogs ? (
            <TableSkeleton rows={5} cols={4} />
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('admin.time')}</Table.Th>
                  <Table.Th>{t('admin.user')}</Table.Th>
                  <Table.Th>{t('admin.action')}</Table.Th>
                  <Table.Th>{t('admin.details')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {logs.map((log: any) => (
                  <Table.Tr key={log.id}>
                    <Table.Td>{new Date(log.createdAt).toLocaleString()}</Table.Td>
                    <Table.Td>{log.user?.fullName || log.user?.email || `#${log.userId}`}</Table.Td>
                    <Table.Td>{log.action}</Table.Td>
                    <Table.Td>{log.details}</Table.Td>
                  </Table.Tr>
                ))}
                {logs.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4}><Text c="dimmed" ta="center" py="md">{t('admin.noLogs')}</Text></Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>
      </Tabs>

      <Modal opened={addModal} onClose={() => setAddModal(false)} title={t('admin.addUser')}>
        <TextInput label={t('admin.email')} placeholder={t('admin.email')} value={newEmail} onChange={e => setNewEmail(e.currentTarget.value)} required mb="sm" />
        <PasswordInput label={t('admin.password')} placeholder={t('admin.password')} value={newPassword} onChange={e => setNewPassword(e.currentTarget.value)} required mb="sm" />
        <TextInput label={t('admin.fullName')} placeholder={t('admin.fullName')} value={newFullName} onChange={e => setNewFullName(e.currentTarget.value)} required mb="sm" />
        <Select label={t('admin.role')} data={roleOptions} value={newRole} onChange={setNewRole} mb="lg" />
        <Group justify="flex-end">
          <Button onClick={handleCreateUser} loading={createUser.isPending}>{t('admin.add')}</Button>
        </Group>
      </Modal>

      <Modal opened={!!roleEditModal} onClose={() => setRoleEditModal(null)} title={t('admin.changeRole')}>
        {roleEditModal && (
          <>
            <Text mb="sm">{t('admin.user')}: {roleEditModal.user.fullName} ({roleEditModal.user.email})</Text>
            <Select label={t('admin.newRole')} data={roleOptions} value={roleEditModal.role} onChange={v => setRoleEditModal({ ...roleEditModal, role: v ?? 'Manager' })} mb="lg" />
            <Group justify="flex-end">
              <Button onClick={handleRoleEdit} loading={updateRole.isPending}>{t('admin.save')}</Button>
            </Group>
          </>
        )}
      </Modal>
    </Container>
  );
}
