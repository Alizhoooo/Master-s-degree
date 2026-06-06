import React from 'react';
import { Group, Text, Box } from '@mantine/core';

interface LogoProps {
  size?: number;
  showText?: boolean;
  variant?: 'gradient' | 'solid' | 'mono';
}

export default function Logo({ size = 32, showText = true, variant = 'gradient' }: LogoProps) {
  const bg = variant === 'gradient'
    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
    : variant === 'solid' ? '#4f46e5' : '#1e293b';

  return (
    <Group gap={10} wrap="nowrap" style={{ minWidth: 0 }}>
      <Box
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px -2px rgba(99, 102, 241, 0.4)',
          flexShrink: 0,
        }}
      >
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
          <path d="M3 12L12 3l9 9-9 9-9-9z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" fill="white" />
        </svg>
      </Box>
      {showText && (
        <Box style={{ minWidth: 0 }}>
          <Text
            size="md"
            fw={800}
            lh={1.1}
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.3px',
            }}
          >
            SupplyFlow
          </Text>
          <Text size="xs" c="dimmed" fw={500} style={{ letterSpacing: '0.5px', lineHeight: 1 }}>
            BPM • ERP
          </Text>
        </Box>
      )}
    </Group>
  );
}
