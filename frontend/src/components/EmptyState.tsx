import React from 'react';
import { Box, Stack, Text, Title } from '@mantine/core';
import { Icon } from '@tabler/icons-react';

interface EmptyStateProps {
  icon?: React.ComponentType<any>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: IconCmp, title, description, action }: EmptyStateProps) {
  return (
    <Box className="sf-empty sf-fade-in">
      <Stack align="center" gap="md">
        {IconCmp && (
          <Box
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconCmp size={28} stroke={1.5} color="#6366f1" />
          </Box>
        )}
        <Stack align="center" gap={4}>
          <Title order={4}>{title}</Title>
          {description && <Text c="dimmed" size="sm" maw={360} ta="center">{description}</Text>}
        </Stack>
        {action}
      </Stack>
    </Box>
  );
}
