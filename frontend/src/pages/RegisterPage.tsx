import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Anchor, Center, Box, Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/AuthContext';

export default function RegisterPage() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string | null>('Manager');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    try {
      await register(email, password, fullName, role);
      const { showNotification } = await import('@mantine/notifications');
      showNotification({
        title: t('auth.registerSuccess'),
        message: t('auth.registerSuccessMsg'),
        color: 'green',
      });
      navigate('/login');
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({
        title: t('common.error'),
        message: err.message || t('auth.registerError'),
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
          <Title order={2} c="blue.9">{t('auth.registerTitle')}</Title>
        </Center>
        <form onSubmit={handleSubmit}>
          <TextInput
            label={t('auth.fullNameLabel')}
            placeholder={t('auth.fullNamePlaceholder')}
            value={fullName}
            onChange={(e) => setFullName(e.currentTarget.value)}
            required
            mb="sm"
          />
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
            mb="sm"
          />
          <Select
            label={t('auth.role')}
            data={[
              { value: 'Admin', label: t('auth.admin') },
              { value: 'Manager', label: t('auth.manager') },
              { value: 'Warehouse', label: t('auth.warehouse') },
            ]}
            value={role}
            onChange={setRole}
            required
            mb="lg"
          />
          <Button type="submit" fullWidth loading={loading}>
            {t('auth.register')}
          </Button>
        </form>
        <Center mt="md">
          <Text size="sm">
            {t('auth.hasAccount')}{' '}
            <Anchor component={Link} to="/login" fw={500}>
              {t('auth.login')}
            </Anchor>
          </Text>
        </Center>
      </Paper>
    </Box>
  );
}
