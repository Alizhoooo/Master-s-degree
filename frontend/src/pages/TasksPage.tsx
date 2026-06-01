import React, { useState } from 'react';
import { Container, Title, Group, Tabs, Button, Table, Modal, TextInput, Select, Textarea, Stack, Badge } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconCheck, IconPlayerPlay, IconX } from '@tabler/icons-react';
import { listTasks, listMyTasks, createTask, startTask, completeTask, cancelTask, getUsers } from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function TasksPage() {
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
        <Title order={3}>Задачи</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateModal(true)}>Новая задача</Button>
      </Group>

      <Tabs value={tab} onChange={(v: any) => setTab(v || 'mine')}>
        <Tabs.List>
          <Tabs.Tab value="mine">Мои</Tabs.Tab>
          <Tabs.Tab value="all">Все</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value={tab} pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Название</Table.Th>
                <Table.Th>Исполнитель</Table.Th>
                <Table.Th>Приоритет</Table.Th>
                <Table.Th>Срок</Table.Th>
                <Table.Th>Статус</Table.Th>
                <Table.Th>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(tasks as any[]).map((t: any) => (
                <Table.Tr key={t.id}>
                  <Table.Td><strong>{t.title}</strong></Table.Td>
                  <Table.Td>{t.assignedTo?.fullName}</Table.Td>
                  <Table.Td><Badge color={t.priority === 'High' ? 'red' : t.priority === 'Low' ? 'gray' : 'yellow'}>{t.priority}</Badge></Table.Td>
                  <Table.Td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</Table.Td>
                  <Table.Td><Badge color={t.status === 'Completed' ? 'green' : t.status === 'InProgress' ? 'blue' : t.status === 'Cancelled' ? 'red' : 'gray'}>{t.status}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {t.status === 'New' && <Button size="xs" variant="light" leftSection={<IconPlayerPlay size={12} />} onClick={() => startMut.mutate(t.id)}>Старт</Button>}
                      {t.status !== 'Completed' && t.status !== 'Cancelled' && (
                        <>
                          <Button size="xs" color="green" leftSection={<IconCheck size={12} />} onClick={() => completeMut.mutate(t.id)}>Готово</Button>
                          <Button size="xs" color="red" variant="light" leftSection={<IconX size={12} />} onClick={() => cancelMut.mutate(t.id)}>Отмена</Button>
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

      <Modal opened={createModal} onClose={() => setCreateModal(false)} title="Новая задача" size="md">
        <Stack>
          <TextInput label="Название" value={taskData.title} onChange={e => setTaskData({ ...taskData, title: e.currentTarget.value })} required />
          <Textarea label="Описание" value={taskData.description} onChange={e => setTaskData({ ...taskData, description: e.currentTarget.value })} />
          <Select label="Исполнитель" data={userOptions} value={taskData.assignedToId ? String(taskData.assignedToId) : null} onChange={(v: string | null) => setTaskData({ ...taskData, assignedToId: v ? +v : 0 })} required searchable />
          <Select label="Приоритет" data={['Low', 'Normal', 'High']} value={taskData.priority} onChange={(v: string | null) => setTaskData({ ...taskData, priority: v || 'Normal' })} />
          <DatePickerInput label="Срок" value={taskData.dueDate} onChange={(d: any) => setTaskData({ ...taskData, dueDate: d })} clearable />
          <Button onClick={() => createMut.mutate()} loading={createMut.isPending} disabled={!taskData.title || !taskData.assignedToId}>Создать</Button>
        </Stack>
      </Modal>
    </Container>
  );
}
