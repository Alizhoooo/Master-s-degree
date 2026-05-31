import { useEffect, useState } from 'react';
import { Text, Tooltip } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';

export default function AlmatyTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const almaty = time.toLocaleString('kk-KZ', {
    timeZone: 'Asia/Almaty',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const date = time.toLocaleString('kk-KZ', {
    timeZone: 'Asia/Almaty',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Tooltip label={date}>
      <Text size="sm" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
        <IconClock size={14} />
        {almaty}
      </Text>
    </Tooltip>
  );
}
