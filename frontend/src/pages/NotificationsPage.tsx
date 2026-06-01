import React, { useState } from 'react';
import { Container, Title, Group, Button, Table, Badge, Text } from '@mantine/core';
import { IconCheck, IconChecks } from '@tabler/icons-react';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState(false);

  const { data: notifications = [] } = useQuery({ queryKey: ['notifications', filter], queryFn: () => listNotifications(filter) });

  const markReadMut = useMutation({ mutationFn: markNotificationRead, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
  const markAllMut = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>Уведомления</Title>
        <Group>
          <Button variant="light" onClick={() => setFilter(!filter)}>{filter ? 'Все' : 'Только непрочитанные'}</Button>
          <Button leftSection={<IconChecks size={14} />} onClick={() => markAllMut.mutate()}>Отметить все как прочитанные</Button>
        </Group>
      </Group>

      <Table striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Тип</Table.Th>
            <Table.Th>Заголовок</Table.Th>
            <Table.Th>Сообщение</Table.Th>
            <Table.Th>Дата</Table.Th>
            <Table.Th>Действия</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(notifications as any[]).map((n: any) => (
            <Table.Tr key={n.id} style={{ background: n.read ? undefined : 'var(--mantine-color-blue-0)' }}>
              <Table.Td>
                <Badge color={n.type === 'error' ? 'red' : n.type === 'warning' ? 'orange' : 'blue'}>
                  {n.type}
                </Badge>
              </Table.Td>
              <Table.Td><strong>{n.title}</strong></Table.Td>
              <Table.Td>{n.message}</Table.Td>
              <Table.Td>{new Date(n.createdAt).toLocaleString()}</Table.Td>
              <Table.Td>
                {!n.read && <Button size="xs" variant="light" leftSection={<IconCheck size={12} />} onClick={() => markReadMut.mutate(n.id)}>Прочитано</Button>}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {(notifications as any[]).length === 0 && (
        <Text c="dimmed" ta="center" py="xl">Нет уведомлений</Text>
      )}
    </Container>
  );
}
