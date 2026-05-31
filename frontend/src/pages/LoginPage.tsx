import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Anchor, Center, Box } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/AuthContext';

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
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a3d91 0%, #1a237e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper withBorder shadow="xl" p="xl" radius="lg" style={{ width: 420, background: '#fff' }}>
        <Center mb="md">
          <Title order={2} c="blue.9">{t('auth.title')}</Title>
        </Center>
        <form onSubmit={handleSubmit}>
          <TextInput
            label={t('auth.email')}
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
            mb="sm"
          />
          <PasswordInput
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
            mb="lg"
          />
          <Button type="submit" fullWidth loading={loading}>
            {t('auth.login')}
          </Button>
        </form>
        <Center mt="md">
          <Text size="sm">
            {t('auth.noAccount')}{' '}
            <Anchor component={Link} to="/register" fw={500}>
              {t('auth.register')}
            </Anchor>
          </Text>
        </Center>
      </Paper>
    </Box>
  );
}
