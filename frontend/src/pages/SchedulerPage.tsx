import React, { useState } from 'react';
import { Container, Title, Group, Button, Table, Modal, TextInput, Select, Stack, Badge, Code, Text } from '@mantine/core';
import { IconPlus, IconPlayerPlay, IconSeeding } from '@tabler/icons-react';
import { listScheduledJobs, createScheduledJob, runJobNow, seedDefaultJobs } from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export default function SchedulerPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [jobData, setJobData] = useState({ name: '', cron: '0 9 * * *', handler: 'checkInventory' });

  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: listScheduledJobs });
  const createMut = useMutation({ mutationFn: () => createScheduledJob(jobData), onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); setCreateModal(false); } });
  const runMut = useMutation({ mutationFn: runJobNow, onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }) });
  const seedMut = useMutation({ mutationFn: seedDefaultJobs, onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }) });

  const handlers = [
    { value: 'checkInventory', label: t('scheduler.handlers.checkInventory') },
    { value: 'checkOverdueTasks', label: t('scheduler.handlers.checkOverdueTasks') },
    { value: 'closeMonth', label: t('scheduler.handlers.closeMonth') },
  ];

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('scheduler.title')}</Title>
        <Group>
          <Button leftSection={<IconSeeding size={14} />} variant="light" onClick={() => seedMut.mutate()}>{t('scheduler.seedJobs')}</Button>
          <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateModal(true)}>{t('scheduler.newJob')}</Button>
        </Group>
      </Group>

      <Text c="dimmed" size="sm" mb="md">{t('scheduler.cronHelp', { cron: '0 9 * * *' })}</Text>

      <Table striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('scheduler.fields.name')}</Table.Th>
            <Table.Th>{t('scheduler.fields.cron')}</Table.Th>
            <Table.Th>{t('scheduler.fields.handler')}</Table.Th>
            <Table.Th>{t('scheduler.fields.enabled')}</Table.Th>
            <Table.Th>{t('scheduler.fields.lastRun')}</Table.Th>
            <Table.Th>{t('scheduler.fields.status')}</Table.Th>
            <Table.Th>{t('scheduler.fields.actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(jobs as any[]).map((j: any) => (
            <Table.Tr key={j.id}>
              <Table.Td><strong>{j.name}</strong></Table.Td>
              <Table.Td><Code>{j.cron}</Code></Table.Td>
              <Table.Td>{t(`scheduler.handlers.${j.handler}`, j.handler) as string}</Table.Td>
              <Table.Td><Badge color={j.enabled ? 'green' : 'gray'}>{j.enabled ? t('common.yes') : t('common.no')}</Badge></Table.Td>
              <Table.Td>{j.lastRunAt ? new Date(j.lastRunAt).toLocaleString() : '-'}</Table.Td>
              <Table.Td><Badge color={j.lastStatus === 'Success' ? 'green' : j.lastStatus === 'Failed' ? 'red' : 'gray'}>{j.lastStatus || '-'}</Badge></Table.Td>
              <Table.Td>
                <Button size="xs" variant="light" leftSection={<IconPlayerPlay size={12} />} onClick={() => runMut.mutate(j.id)}>{t('scheduler.runNow')}</Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={createModal} onClose={() => setCreateModal(false)} title={t('scheduler.newJob')}>
        <Stack>
          <TextInput label={t('scheduler.fields.name')} value={jobData.name} onChange={e => setJobData({ ...jobData, name: e.currentTarget.value })} required />
          <TextInput label={t('scheduler.fields.cronExpression')} value={jobData.cron} onChange={e => setJobData({ ...jobData, cron: e.currentTarget.value })} required />
          <Select label={t('scheduler.fields.handler')} data={handlers} value={jobData.handler} onChange={(v: string | null) => setJobData({ ...jobData, handler: v || 'checkInventory' })} />
          <Button onClick={() => createMut.mutate()} loading={createMut.isPending} disabled={!jobData.name}>{t('common.create')}</Button>
        </Stack>
      </Modal>
    </Container>
  );
}
