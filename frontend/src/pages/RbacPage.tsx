import React, { useState } from 'react';
import { Container, Title, Group, Tabs, Button, Table, Modal, TextInput, MultiSelect, Stack, Badge } from '@mantine/core';
import { IconPlus, IconShield } from '@tabler/icons-react';
import { listRoles, createRole, listPermissions, assignRole, getUsers, getUserRoles } from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export default function RbacPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState('roles');
  const [createModal, setCreateModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [roleData, setRoleData] = useState({ name: '', description: '', permissions: [] as string[] });
  const [assignData, setAssignData] = useState({ userId: 0, roleId: 0 });

  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: listRoles });
  const { data: permissions = [] } = useQuery({ queryKey: ['permissions'], queryFn: listPermissions });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: getUsers });

  const createMut = useMutation({ mutationFn: () => createRole(roleData), onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); setCreateModal(false); } });
  const assignMut = useMutation({ mutationFn: () => assignRole(assignData.userId, assignData.roleId), onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setAssignModal(false); } });

  const permOptions = (permissions as any[]).map((p: any) => ({ value: p.key, label: p.key }));
  const userOptions = (users as any[]).map((u: any) => ({ value: String(u.id), label: u.fullName }));
  const roleOptions = (roles as any[]).map((r: any) => ({ value: String(r.id), label: r.name }));

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('rbac.title')}</Title>
        <Group>
          <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateModal(true)}>{t('rbac.newRole')}</Button>
          <Button leftSection={<IconShield size={14} />} variant="light" onClick={() => setAssignModal(true)}>{t('rbac.assignRole')}</Button>
        </Group>
      </Group>

      <Tabs value={tab} onChange={(v: any) => setTab(v || 'roles')}>
        <Tabs.List>
          <Tabs.Tab value="roles">{t('rbac.roles')}</Tabs.Tab>
          <Tabs.Tab value="users">{t('rbac.users')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="roles" pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('rbac.fields.name')}</Table.Th>
                <Table.Th>{t('rbac.fields.description')}</Table.Th>
                <Table.Th>{t('rbac.system')}</Table.Th>
                <Table.Th>{t('rbac.permissionsCount')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(roles as any[]).map((r: any) => (
                <Table.Tr key={r.id}>
                  <Table.Td><strong>{r.name}</strong></Table.Td>
                  <Table.Td>{r.description || '-'}</Table.Td>
                  <Table.Td>{r.isSystem ? <Badge color="blue">{t('rbac.system')}</Badge> : '-'}</Table.Td>
                  <Table.Td>{r.permissions?.length || 0}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="users" pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('rbac.fields.email')}</Table.Th>
                <Table.Th>{t('rbac.fields.fullName')}</Table.Th>
                <Table.Th>{t('rbac.builtInRole')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(users as any[]).map((u: any) => (
                <Table.Tr key={u.id}>
                  <Table.Td>{u.email}</Table.Td>
                  <Table.Td><strong>{u.fullName}</strong></Table.Td>
                  <Table.Td><Badge>{u.role}</Badge></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={createModal} onClose={() => setCreateModal(false)} title={t('rbac.newRole')} size="lg">
        <Stack>
          <TextInput label={t('rbac.fields.name')} value={roleData.name} onChange={e => setRoleData({ ...roleData, name: e.currentTarget.value })} required />
          <TextInput label={t('rbac.fields.description')} value={roleData.description} onChange={e => setRoleData({ ...roleData, description: e.currentTarget.value })} />
          <MultiSelect
            label={t('rbac.fields.permissions')}
            data={permOptions}
            value={roleData.permissions}
            onChange={(v: string[]) => setRoleData({ ...roleData, permissions: v })}
            searchable
            clearable
          />
          <Button onClick={() => createMut.mutate()} loading={createMut.isPending} disabled={!roleData.name}>{t('rbac.create')}</Button>
        </Stack>
      </Modal>

      <Modal opened={assignModal} onClose={() => setAssignModal(false)} title={t('rbac.assignRole')}>
        <Stack>
          <Group grow>
            <MultiSelect
              label={t('rbac.fields.user')}
              data={userOptions}
              value={assignData.userId ? [String(assignData.userId)] : []}
              onChange={(v: string[]) => setAssignData({ ...assignData, userId: v[0] ? +v[0] : 0 })}
              maxValues={1}
              searchable
            />
            <MultiSelect
              label={t('rbac.fields.role')}
              data={roleOptions}
              value={assignData.roleId ? [String(assignData.roleId)] : []}
              onChange={(v: string[]) => setAssignData({ ...assignData, roleId: v[0] ? +v[0] : 0 })}
              maxValues={1}
            />
          </Group>
          <Button onClick={() => assignMut.mutate()} loading={assignMut.isPending} disabled={!assignData.userId || !assignData.roleId}>{t('rbac.assign')}</Button>
        </Stack>
      </Modal>
    </Container>
  );
}
