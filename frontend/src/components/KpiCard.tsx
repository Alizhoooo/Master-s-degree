import React from 'react';
import { Group, Text, Box, Stack } from '@mantine/core';
import { Icon } from '@tabler/icons-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: React.ReactNode;
  icon?: React.ComponentType<any>;
  trend?: { value: number; positive?: boolean };
  gradient?: [string, string];
  onClick?: () => void;
}

export default function KpiCard({ label, value, hint, icon: IconCmp, trend, gradient = ['#6366f1', '#8b5cf6'], onClick }: KpiCardProps) {
  return (
    <Box
      className="kpi-card sf-fade-in"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Group justify="space-between" align="flex-start" mb="sm">
        <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: 0.5 }}>
          {label}
        </Text>
        {IconCmp && (
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: `0 4px 10px -2px ${gradient[0]}55`,
            }}
          >
            <IconCmp size={18} stroke={2} />
          </Box>
        )}
      </Group>
      <Stack gap={4}>
        <Text size="xl" fw={800} style={{ letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          {value}
        </Text>
        <Group gap={6}>
          {trend && (
            <Text size="xs" c={trend.positive ? 'teal' : 'red'} fw={600}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </Text>
          )}
          {hint && <Text size="xs" c="dimmed">{hint}</Text>}
        </Group>
      </Stack>
    </Box>
  );
}
