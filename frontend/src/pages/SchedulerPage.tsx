import React, { useState } from 'react';
import { Container, Title, Group, Button, Table, Modal, TextInput, Select, Stack, Badge, Code, Text } from '@mantine/core';
import { IconPlus, IconPlayerPlay, IconSeeding } from '@tabler/icons-react';
import { listScheduledJobs, createScheduledJob, runJobNow, seedDefaultJobs } from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const handlers = [
  { value: 'checkInventory', label: 'Проверка остатков' },
  { value: 'checkOverdueTasks', label: 'Просроченные задачи' },
  { value: 'closeMonth', label: 'Закрытие месяца' },
];

export default function SchedulerPage() {
  const qc = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [jobData, setJobData] = useState({ name: '', cron: '0 9 * * *', handler: 'checkInventory' });

  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: listScheduledJobs });
  const createMut = useMutation({ mutationFn: () => createScheduledJob(jobData), onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); setCreateModal(false); } });
  const runMut = useMutation({ mutationFn: runJobNow, onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }) });
  const seedMut = useMutation({ mutationFn: seedDefaultJobs, onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }) });

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>Регламентные задания</Title>
        <Group>
          <Button leftSection={<IconSeeding size={14} />} variant="light" onClick={() => seedMut.mutate()}>Загрузить стандартные</Button>
          <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateModal(true)}>Новое задание</Button>
        </Group>
      </Group>

      <Text c="dimmed" size="sm" mb="md">Формат cron: <Code>минуты часы день_месяца месяц день_недели</Code>. Пример: <Code>0 9 * * *</Code> — каждый день в 9:00</Text>

      <Table striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Название</Table.Th>
            <Table.Th>Cron</Table.Th>
            <Table.Th>Обработчик</Table.Th>
            <Table.Th>Включён</Table.Th>
            <Table.Th>Последний запуск</Table.Th>
            <Table.Th>Статус</Table.Th>
            <Table.Th>Действия</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(jobs as any[]).map((j: any) => (
            <Table.Tr key={j.id}>
              <Table.Td><strong>{j.name}</strong></Table.Td>
              <Table.Td><Code>{j.cron}</Code></Table.Td>
              <Table.Td>{j.handler}</Table.Td>
              <Table.Td><Badge color={j.enabled ? 'green' : 'gray'}>{j.enabled ? 'Да' : 'Нет'}</Badge></Table.Td>
              <Table.Td>{j.lastRunAt ? new Date(j.lastRunAt).toLocaleString() : '-'}</Table.Td>
              <Table.Td><Badge color={j.lastStatus === 'Success' ? 'green' : j.lastStatus === 'Failed' ? 'red' : 'gray'}>{j.lastStatus || '-'}</Badge></Table.Td>
              <Table.Td>
                <Button size="xs" variant="light" leftSection={<IconPlayerPlay size={12} />} onClick={() => runMut.mutate(j.id)}>Запустить</Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={createModal} onClose={() => setCreateModal(false)} title="Новое задание">
        <Stack>
          <TextInput label="Название" value={jobData.name} onChange={e => setJobData({ ...jobData, name: e.currentTarget.value })} required />
          <TextInput label="Cron выражение" value={jobData.cron} onChange={e => setJobData({ ...jobData, cron: e.currentTarget.value })} required />
          <Select label="Обработчик" data={handlers} value={jobData.handler} onChange={(v: string | null) => setJobData({ ...jobData, handler: v || 'checkInventory' })} />
          <Button onClick={() => createMut.mutate()} loading={createMut.isPending} disabled={!jobData.name}>Создать</Button>
        </Stack>
      </Modal>
    </Container>
  );
}
