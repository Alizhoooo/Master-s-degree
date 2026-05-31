import { Group, Text, Badge, Box } from '@mantine/core';
import { IconCircle, IconCircleCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const statusColor: Record<string, string> = {
  Pending: 'yellow', Confirmed: 'blue', Reserved: 'cyan', Paid: 'violet',
  Picked: 'orange', Shipped: 'indigo', Delivered: 'green', Cancelled: 'red',
};

interface TimelineEvent {
  id: number;
  fromStatus: string | null;
  toStatus: string | null;
  user: { id: number; fullName: string } | null;
  createdAt: string;
}

export default function OrderTimeline({ events }: { events: TimelineEvent[] }) {
  const { t } = useTranslation();

  if (events.length === 0) {
    return (
      <Text c="dimmed" size="sm" ta="center" py="md">
        {t('order.noTimeline')}
      </Text>
    );
  }

  return (
    <Box>
      {events.map((event, i) => {
        const isLast = i === events.length - 1;
        return (
          <Group key={event.id} gap="xs" wrap="nowrap" align="flex-start" mb="md">
            <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
              {isLast ? <IconCircleCheck size={20} color="var(--mantine-color-green-6)" /> : <IconCircle size={16} color="var(--mantine-color-gray-4)" />}
              {!isLast && <Box style={{ width: 2, height: 32, background: 'var(--mantine-color-gray-3)', marginTop: 4 }} />}
            </Box>
            <Box>
              <Group gap="xs" mb={2}>
                {event.fromStatus && (
                  <Badge size="sm" color={statusColor[event.fromStatus] || 'gray'} variant="light">
                    {event.fromStatus}
                  </Badge>
                )}
                {event.toStatus && (
                  <>
                    <Text size="xs" c="dimmed">→</Text>
                    <Badge size="sm" color={statusColor[event.toStatus] || 'gray'}>
                      {event.toStatus}
                    </Badge>
                  </>
                )}
              </Group>
              <Text size="xs" c="dimmed">
                {event.user?.fullName || 'System'} &middot; {new Date(event.createdAt).toLocaleString()}
              </Text>
            </Box>
          </Group>
        );
      })}
    </Box>
  );
}
