import React from 'react';
import { Group, Title, Text, Box, Badge } from '@mantine/core';
import { Icon } from '@tabler/icons-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<any>;
  badge?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, icon: IconCmp, badge, actions }: PageHeaderProps) {
  return (
    <Box className="sf-page-header sf-fade-in">
      <Group justify="space-between" wrap="nowrap" align="flex-start" gap="md">
        <Group gap="md" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
          {IconCmp && (
            <Box
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0,
                boxShadow: '0 4px 12px -2px rgba(99, 102, 241, 0.4)',
              }}
            >
              <IconCmp size={22} stroke={2} />
            </Box>
          )}
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Group gap={8} align="center">
              <Title order={2} style={{ letterSpacing: '-0.3px' }}>{title}</Title>
              {badge && <Badge variant="light" color="indigo" radius="sm">{badge}</Badge>}
            </Group>
            {description && (
              <Text c="dimmed" size="sm" mt={2} style={{ maxWidth: 600 }}>{description}</Text>
            )}
          </Box>
        </Group>
        {actions && <Group gap="xs" style={{ flexShrink: 0 }}>{actions}</Group>}
      </Group>
    </Box>
  );
}
