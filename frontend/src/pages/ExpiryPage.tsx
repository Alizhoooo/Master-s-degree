import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container, Title, Group, Button, Table, Modal, Stack, Badge, Text, Card, SimpleGrid, Tabs, Progress, Alert, ActionIcon, ScrollArea,
} from '@mantine/core';
import { IconScan, IconAlertTriangle, IconClock, IconCheck, IconCalendar } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scanExpiry, getExpiryAlerts, getExpiringSoon, getExpired, resolveExpiryAlert } from '../api/nomenclature';
import { TableSkeleton } from '../components/Skeleton';
import { notifications } from '../components/Notifications';

function severityColor(sev: string) {
  if (sev === 'Expired') return 'red';
  if (sev === 'Critical') return 'red';
  if (sev === 'Warning') return 'yellow';
  return 'blue';
}

export default function ExpiryPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState('alerts');

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({ queryKey: ['expiry-alerts'], queryFn: () => getExpiryAlerts() });
  const { data: expiring = [], isLoading: expiringLoading } = useQuery({ queryKey: ['expiring-soon'], queryFn: getExpiringSoon, enabled: tab === 'expiring' });
  const { data: expired = [], isLoading: expiredLoading } = useQuery({ queryKey: ['expired'], queryFn: getExpired, enabled: tab === 'expired' });

  const scanMut = useMutation({
    mutationFn: scanExpiry,
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['expiry-alerts'] });
      qc.invalidateQueries({ queryKey: ['expiring-soon'] });
      qc.invalidateQueries({ queryKey: ['expired'] });
      notifications.show({ title: t('common.success'), message: `${t('expiry.successScanned')}: scanned=${res?.scanned ?? 0}, created=${res?.created ?? 0}`, color: 'green' });
    },
  });

  const resolveMut = useMutation({
    mutationFn: resolveExpiryAlert,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expiry-alerts'] });
      notifications.show({ title: t('common.success'), message: t('expiry.successResolved'), color: 'green' });
    },
  });

  const alertsList = Array.isArray(alerts) ? alerts : [];
  const expiringList = Array.isArray(expiring) ? expiring : [];
  const expiredList = Array.isArray(expired) ? expired : [];
  const openAlerts = alertsList.filter((a: any) => !a.resolvedAt);
  const critical = openAlerts.filter((a: any) => a.severity === 'Critical' || a.severity === 'Expired').length;
  const warning = openAlerts.filter((a: any) => a.severity === 'Warning').length;

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('expiry.title')}</Title>
        <Button leftSection={<IconScan size={14} />} onClick={() => scanMut.mutate()} loading={scanMut.isPending}>
          {t('expiry.scan')}
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="md">
        <Card withBorder>
          <Group><IconAlertTriangle size={28} color="red" /><div><Text size="xs" c="dimmed">{t('expiry.severityCritical')}</Text><Text size="xl" fw={700}>{critical}</Text></div></Group>
          <Progress value={openAlerts.length ? (critical / openAlerts.length) * 100 : 0} color="red" size="sm" mt="xs" />
        </Card>
        <Card withBorder>
          <Group><IconClock size={28} color="orange" /><div><Text size="xs" c="dimmed">{t('expiry.severityWarning')}</Text><Text size="xl" fw={700}>{warning}</Text></div></Group>
          <Progress value={openAlerts.length ? (warning / openAlerts.length) * 100 : 0} color="yellow" size="sm" mt="xs" />
        </Card>
        <Card withBorder>
          <Group><IconCalendar size={28} color="blue" /><div><Text size="xs" c="dimmed">{t('common.total')} alerts</Text><Text size="xl" fw={700}>{openAlerts.length}</Text></div></Group>
          <Text size="xs" c="dimmed" mt="xs">{alertsList.length - openAlerts.length} resolved</Text>
        </Card>
      </SimpleGrid>

      {critical > 0 && (
        <Alert color="red" icon={<IconAlertTriangle size={16} />} mb="md" title={t('expiry.severityCritical')}>
          {critical} batches need immediate attention
        </Alert>
      )}

      <Tabs value={tab} onChange={(v: any) => setTab(v || 'alerts')}>
        <Tabs.List>
          <Tabs.Tab value="alerts" leftSection={<IconAlertTriangle size={14} />}>{t('expiry.alerts')} ({openAlerts.length})</Tabs.Tab>
          <Tabs.Tab value="expiring" leftSection={<IconClock size={14} />}>{t('expiry.expiringSoon')} ({expiringList.length})</Tabs.Tab>
          <Tabs.Tab value="expired" leftSection={<IconCalendar size={14} />}>{t('expiry.expired')} ({expiredList.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="alerts" pt="md">
          {alertsLoading ? <TableSkeleton rows={5} cols={5} /> : (
            <ScrollArea>
              <Table striped withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('expiry.severity')}</Table.Th>
                    <Table.Th>{t('receipt.itemFields.batch')}</Table.Th>
                    <Table.Th>{t('receipt.itemFields.product')}</Table.Th>
                    <Table.Th>{t('expiry.daysLeft')}</Table.Th>
                    <Table.Th>{t('common.date')}</Table.Th>
                    <Table.Th>{t('common.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {openAlerts.map((a: any) => (
                    <Table.Tr key={a.id}>
                      <Table.Td><Badge color={severityColor(a.severity)} variant="filled">{t(`enum.expiry.${a.severity}`)}</Badge></Table.Td>
                      <Table.Td><code>{a.batch?.batchNo || a.batchNo || `#${a.batchId}`}</code></Table.Td>
                      <Table.Td>{a.batch?.product?.name || a.productName || '-'}</Table.Td>
                      <Table.Td>
                        {a.daysLeft !== undefined ? (
                          <Badge color={a.daysLeft < 0 ? 'red' : a.daysLeft <= 7 ? 'red' : 'yellow'}>
                            {a.daysLeft < 0 ? t('common.expired') : `${a.daysLeft}d`}
                          </Badge>
                        ) : '-'}
                      </Table.Td>
                      <Table.Td>{new Date(a.createdAt).toLocaleDateString()}</Table.Td>
                      <Table.Td>
                        <ActionIcon color="green" variant="light" onClick={() => resolveMut.mutate(a.id)} loading={resolveMut.isPending}>
                          <IconCheck size={14} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {openAlerts.length === 0 && <Table.Tr><Table.Td colSpan={6}><Text ta="center" c="dimmed">{t('expiry.noAlerts')}</Text></Table.Td></Table.Tr>}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="expiring" pt="md">
          {expiringLoading ? <TableSkeleton rows={5} cols={4} /> : (
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('receipt.itemFields.batch')}</Table.Th>
                  <Table.Th>{t('receipt.itemFields.product')}</Table.Th>
                  <Table.Th>{t('common.qty')}</Table.Th>
                  <Table.Th>{t('expiry.daysLeft')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {expiringList.map((b: any) => {
                  const days = b.daysLeft ?? Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / 86400000);
                  return (
                    <Table.Tr key={b.id}>
                      <Table.Td><code>{b.batchNo}</code></Table.Td>
                      <Table.Td>{b.product?.name || '-'}</Table.Td>
                      <Table.Td>{b.remainingQty ?? b.quantity}</Table.Td>
                      <Table.Td><Badge color={days <= 7 ? 'red' : 'yellow'}>{days}d</Badge></Table.Td>
                    </Table.Tr>
                  );
                })}
                {expiringList.length === 0 && <Table.Tr><Table.Td colSpan={4}><Text ta="center" c="dimmed">{t('expiry.noExpiring')}</Text></Table.Td></Table.Tr>}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="expired" pt="md">
          {expiredLoading ? <TableSkeleton rows={5} cols={4} /> : (
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('receipt.itemFields.batch')}</Table.Th>
                  <Table.Th>{t('receipt.itemFields.product')}</Table.Th>
                  <Table.Th>{t('common.qty')}</Table.Th>
                  <Table.Th>{t('nomenclature.expiryDate')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {expiredList.map((b: any) => (
                  <Table.Tr key={b.id}>
                    <Table.Td><code>{b.batchNo}</code></Table.Td>
                    <Table.Td>{b.product?.name || '-'}</Table.Td>
                    <Table.Td>{b.remainingQty ?? b.quantity}</Table.Td>
                    <Table.Td><Badge color="red">{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '-'}</Badge></Table.Td>
                  </Table.Tr>
                ))}
                {expiredList.length === 0 && <Table.Tr><Table.Td colSpan={4}><Text ta="center" c="dimmed">{t('expiry.noExpiring')}</Text></Table.Td></Table.Tr>}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
