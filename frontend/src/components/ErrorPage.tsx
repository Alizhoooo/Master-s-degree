import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Text, Button, Stack, Box, Group } from '@mantine/core';
import { IconHome, IconArrowLeft, IconAlertTriangle } from '@tabler/icons-react';
import Logo from './Logo';

export default function ErrorPage() {
  const navigate = useNavigate();
  const code = 404;
  const title = 'Страница не найдена';
  const description = 'Запрашиваемая страница не существует или была перемещена.';

  return (
    <Box className="sf-mesh-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Container size="sm" py="xl">
        <Stack align="center" gap="lg" className="sf-fade-in">
          <Logo size={48} />
          <Box ta="center">
            <Text
              fw={800}
              style={{
                fontSize: 120,
                lineHeight: 1,
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-4px',
              }}
            >
              {code}
            </Text>
            <Group justify="center" mt="xs" gap={6}>
              <IconAlertTriangle size={18} color="#f59e0b" />
              <Text size="sm" c="dimmed" fw={500}>Page Not Found</Text>
            </Group>
          </Box>
          <Stack align="center" gap={6}>
            <Title order={2} ta="center">{title}</Title>
            <Text c="dimmed" ta="center" maw={420}>{description}</Text>
          </Stack>
          <Group>
            <Button leftSection={<IconHome size={16} />} onClick={() => navigate('/')} className="gradient-button" size="md">
              На главную
            </Button>
            <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate(-1)} size="md">
              Назад
            </Button>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}
