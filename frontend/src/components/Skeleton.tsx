import React from 'react';
import { Container, Group, Title, Skeleton as MantineSkeleton, Card, Stack } from '@mantine/core';

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <Stack>
      <MantineSkeleton height={40} radius="md" mb="xs" />
      {Array.from({ length: rows }).map((_, i) => (
        <Group key={i} gap="sm" align="center">
          {Array.from({ length: cols }).map((_, j) => (
            <MantineSkeleton
              key={j}
              height={32}
              radius="sm"
              style={{ flex: j === 0 ? 2 : 1 }}
            />
          ))}
        </Group>
      ))}
    </Stack>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Group grow>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} withBorder shadow="sm" p="md">
          <Group>
            <MantineSkeleton height={36} circle />
            <div style={{ flex: 1 }}>
              <MantineSkeleton height={12} radius="sm" width="60%" mb="xs" />
              <MantineSkeleton height={20} radius="sm" width="40%" />
            </div>
          </Group>
        </Card>
      ))}
    </Group>
  );
}

export function PageSkeleton({ title }: { title?: string }) {
  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        {title ? <Title order={3}>{title}</Title> : <MantineSkeleton height={28} width={200} radius="sm" />}
        <MantineSkeleton height={36} width={120} radius="sm" />
      </Group>
      <CardSkeleton count={4} />
      <div style={{ height: 24 }} />
      <TableSkeleton />
    </Container>
  );
}

export function DetailSkeleton() {
  return (
    <Container size="xl">
      <MantineSkeleton height={28} width={250} radius="sm" mb="lg" />
      <Card withBorder shadow="sm" p="md">
        <Stack>
          {Array.from({ length: 5 }).map((_, i) => (
            <Group key={i} justify="space-between">
              <MantineSkeleton height={16} width={120} radius="sm" />
              <MantineSkeleton height={16} width={200} radius="sm" />
            </Group>
          ))}
        </Stack>
      </Card>
      <div style={{ height: 24 }} />
      <MantineSkeleton height={40} radius="md" mb="xs" />
      <TableSkeleton rows={3} cols={4} />
    </Container>
  );
}
