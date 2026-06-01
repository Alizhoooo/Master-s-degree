import React, { useState, useEffect } from 'react';
import { Modal, TextInput, Stack, UnstyledButton, Group, Text, Badge, Divider, ScrollArea, Box, Kbd } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { globalSearch } from '../api';
import { useQuery } from '@tanstack/react-query';

const typeLabels: Record<string, string> = {
  order: 'Тапсырыс',
  customer: 'Клиент',
  product: 'Товар',
  document: 'Документ',
  employee: 'Сотрудник',
  contract: 'Договор',
};

const typeColors: Record<string, string> = {
  order: 'blue',
  customer: 'green',
  product: 'orange',
  document: 'violet',
  employee: 'cyan',
  contract: 'yellow',
};

export default function GlobalSearchModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!opened) {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [opened]);

  const { data: results } = useQuery({
    queryKey: ['globalSearch', debouncedQuery],
    queryFn: () => globalSearch(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const handleSelect = (link: string) => {
    onClose();
    navigate(link);
  };

  const grouped = (results?.results || []).reduce((acc: Record<string, any[]>, r: any) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Modal opened={opened} onClose={onClose} size="lg" withCloseButton={false} padding={0} yOffset="20vh">
      <TextInput
        size="lg"
        placeholder="Глобальный поиск... (Ctrl+K)"
        value={query}
        onChange={e => setQuery(e.currentTarget.value)}
        leftSection={<IconSearch size={20} />}
        autoFocus
        styles={{ input: { border: 'none', fontSize: 18 } }}
      />
      <Divider />
      <ScrollArea h={400}>
        <Box p="md">
          {debouncedQuery.length < 2 && (
            <Text c="dimmed" ta="center" py="xl">Введите минимум 2 символа для поиска</Text>
          )}
          {debouncedQuery.length >= 2 && (results?.results || []).length === 0 && (
            <Text c="dimmed" ta="center" py="xl">Ничего не найдено</Text>
          )}
          {Object.entries(grouped).map(([type, items]: [string, any]) => (
            <Box key={type} mb="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">
                {typeLabels[type] || type} ({items.length})
              </Text>
              <Stack gap="xs">
                {items.map((r: any) => (
                  <UnstyledButton key={`${type}-${r.id}`} onClick={() => handleSelect(r.link)} p="xs" style={{ borderRadius: 4 }}>
                    <Group>
                      <Badge color={typeColors[type] || 'gray'} variant="light">{typeLabels[type] || type}</Badge>
                      <Box>
                        <Text size="sm" fw={500}>{r.title}</Text>
                        <Text size="xs" c="dimmed">{r.subtitle}</Text>
                      </Box>
                    </Group>
                  </UnstyledButton>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>
      </ScrollArea>
      <Divider />
      <Group justify="space-between" p="xs">
        <Text size="xs" c="dimmed">Найдено: {results?.counts ? Object.values(results.counts).reduce((a: number, b: any) => a + b, 0) : 0}</Text>
        <Group gap="xs">
          <Kbd>Enter</Kbd>
          <Text size="xs" c="dimmed">открыть</Text>
          <Kbd>Esc</Kbd>
          <Text size="xs" c="dimmed">закрыть</Text>
        </Group>
      </Group>
    </Modal>
  );
}
