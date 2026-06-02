import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Title, Group, Tabs, Button, Table, Modal, TextInput, Select, Textarea, Stack, Badge } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconCheck, IconPlayerPlay, IconX } from '@tabler/icons-react';
import { listTasks, listMyTasks, createTask, startTask, completeTask, cancelTask, getUsers } from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statusLabel, enumLabel } from '../i18n/enumLabel';

export default function TasksPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState('mine');
  const [createModal, setCreateModal] = useState(false);
  const [taskData, setTaskData] = useState({ title: '', description: '', assignedToId: 0, priority: 'Normal', dueDate: null as Date | null });

  const { data: myTasks = [] } = useQuery({ queryKey: ['myTasks'], queryFn: listMyTasks });
  const { data: allTasks = [] } = useQuery({ queryKey: ['allTasks'], queryFn: () => listTasks(), enabled: tab === 'all' });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: getUsers });

  const createMut = useMutation({ mutationFn: () => createTask({ ...taskData, dueDate: taskData.dueDate?.toISOString() }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['allTasks'] }); qc.invalidateQueries({ queryKey: ['myTasks'] }); setCreateModal(false); } });
  const startMut = useMutation({ mutationFn: startTask, onSuccess: () => qc.invalidateQueries({ queryKey: ['allTasks'] }) });
  const completeMut = useMutation({ mutationFn: completeTask, onSuccess: () => qc.invalidateQueries({ queryKey: ['allTasks'] }) });
  const cancelMut = useMutation({ mutationFn: cancelTask, onSuccess: () => qc.invalidateQueries({ queryKey: ['allTasks'] }) });

  const userOptions = (users as any[]).map((u: any) => ({ value: String(u.id), label: u.fullName }));

  const tasks = tab === 'mine' ? myTasks : allTasks;

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('nav.tasks')}</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateModal(true)}>{t('common.add')}</Button>
      </Group>

      <Tabs value={tab} onChange={(v: any) => setTab(v || 'mine')}>
        <Tabs.List>
          <Tabs.Tab value="mine">{t('common.all')}</Tabs.Tab>
          <Tabs.Tab value="all">{t('nav.tasks')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value={tab} pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('common.name')}</Table.Th>
                <Table.Th>{t('common.customer')}</Table.Th>
                <Table.Th>{t('admin.role')}</Table.Th>
                <Table.Th>{t('common.date')}</Table.Th>
                <Table.Th>{t('common.status')}</Table.Th>
                <Table.Th>{t('common.actions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(tasks as any[]).map((t: any) => (
                <Table.Tr key={t.id}>
                  <Table.Td><strong>{t.title}</strong></Table.Td>
                  <Table.Td>{t.assignedTo?.fullName}</Table.Td>
                  <Table.Td><Badge color={t.priority === 'High' ? 'red' : t.priority === 'Low' ? 'gray' : 'yellow'}>{enumLabel(t.priority, 'priority')}</Badge></Table.Td>
                  <Table.Td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</Table.Td>
                  <Table.Td><Badge color={t.status === 'Completed' ? 'green' : t.status === 'InProgress' ? 'blue' : t.status === 'Cancelled' ? 'red' : 'gray'}>{statusLabel(t.status)}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {t.status === 'New' && <Button size="xs" variant="light" leftSection={<IconPlayerPlay size={12} />} onClick={() => startMut.mutate(t.id)}>{t('common.add')}</Button>}
                      {t.status !== 'Completed' && t.status !== 'Cancelled' && (
                        <>
                          <Button size="xs" color="green" leftSection={<IconCheck size={12} />} onClick={() => completeMut.mutate(t.id)}>✓</Button>
                          <Button size="xs" color="red" variant="light" leftSection={<IconX size={12} />} onClick={() => cancelMut.mutate(t.id)}>✕</Button>
                        </>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={createModal} onClose={() => setCreateModal(false)} title={t('common.add')} size="md">
        <Stack>
          <TextInput label={t('common.name')} value={taskData.title} onChange={e => setTaskData({ ...taskData, title: e.currentTarget.value })} required />
          <Textarea label={t('complaint.description')} value={taskData.description} onChange={e => setTaskData({ ...taskData, description: e.currentTarget.value })} />
          <Select label={t('admin.user')} data={userOptions} value={taskData.assignedToId ? String(taskData.assignedToId) : null} onChange={(v: string | null) => setTaskData({ ...taskData, assignedToId: v ? +v : 0 })} required searchable />
          <Select
            label={t('admin.role')}
            data={[
              { value: 'Low', label: enumLabel('Low', 'priority') },
              { value: 'Normal', label: enumLabel('Medium', 'priority') },
              { value: 'High', label: enumLabel('High', 'priority') },
              { value: 'Urgent', label: enumLabel('Urgent', 'priority') },
            ]}
            value={taskData.priority}
            onChange={(v: string | null) => setTaskData({ ...taskData, priority: v || 'Normal' })}
          />
          <DatePickerInput label={t('common.date')} value={taskData.dueDate} onChange={(d: any) => setTaskData({ ...taskData, dueDate: d })} clearable />
          <Button onClick={() => createMut.mutate()} loading={createMut.isPending} disabled={!taskData.title || !taskData.assignedToId}>{t('common.save')}</Button>
        </Stack>
      </Modal>
    </Container>
  );
}
