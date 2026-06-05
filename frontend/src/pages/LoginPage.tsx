import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Anchor, Center, Box, Group, Stack, Divider, ThemeIcon } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/AuthContext';
import Logo from '../components/Logo';
import { IconMail, IconLock, IconArrowRight, IconSparkles } from '@tabler/icons-react';
import LanguageToggle from '../components/LanguageToggle';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({
        title: t('common.error'),
        message: err.message || t('auth.loginError'),
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      className="sf-mesh-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gradient blobs */}
      <Box style={{
        position: 'absolute', top: '-10%', right: '-10%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <Box style={{
        position: 'absolute', bottom: '-15%', left: '-10%', width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <Box style={{ position: 'absolute', top: 20, right: 20 }}>
        <Group gap="xs">
          <LanguageToggle />
          <ThemeToggle />
        </Group>
      </Box>

      <Paper
        shadow="xl"
        p={32}
        radius="xl"
        style={{
          width: 460,
          maxWidth: '100%',
          background: 'var(--mantine-color-body)',
          border: '1px solid var(--mantine-color-default-border)',
          position: 'relative',
          zIndex: 1,
        }}
        className="sf-fade-in"
      >
        <Stack gap="lg">
          <Center>
            <Logo size={48} />
          </Center>

          <Box ta="center">
            <Title order={3} fw={800} style={{ letterSpacing: '-0.3px' }}>{t('auth.title')}</Title>
            <Text size="sm" c="dimmed" mt={4}>Войдите в систему, чтобы продолжить</Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label={t('auth.email')}
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
                size="md"
                leftSection={<IconMail size={16} stroke={2} />}
              />
              <PasswordInput
                label={t('auth.password')}
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
                size="md"
                leftSection={<IconLock size={16} stroke={2} />}
              />
              <Group justify="space-between">
                <Anchor size="xs" c="dimmed" component="span" style={{ cursor: 'pointer' }}>
                  Забыли пароль?
                </Anchor>
              </Group>
              <Button
                type="submit"
                fullWidth
                size="md"
                loading={loading}
                rightSection={<IconArrowRight size={16} />}
                className="gradient-button"
              >
                {t('auth.login')}
              </Button>
            </Stack>
          </form>

          <Divider label="или" labelPosition="center" />

          <Group justify="center" gap={6}>
            <Text size="sm" c="dimmed">{t('auth.noAccount')}</Text>
            <Anchor component={Link} to="/register" fw={600} c="indigo">
              {t('auth.register')}
            </Anchor>
          </Group>
        </Stack>
      </Paper>

      <Box style={{ position: 'absolute', bottom: 24, left: 0, right: 0, textAlign: 'center' }}>
        <Group justify="center" gap={6}>
          <ThemeIcon size="xs" variant="transparent" color="indigo">
            <IconSparkles size={12} />
          </ThemeIcon>
          <Text size="xs" c="dimmed">SupplyFlow BPM · 1C-style ERP platform</Text>
        </Group>
      </Box>
    </Box>
  );
}
