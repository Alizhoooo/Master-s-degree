import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Anchor, Center, Box } from '@mantine/core';
import { useAuth } from '../store/AuthContext';

export default function LoginPage() {
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
        title: 'Қате',
        message: err.message || 'Кіру кезінде қате орын алды',
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
          <Title order={2} c="blue.9">SupplyFlow жүйесіне кіру</Title>
        </Center>
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Электронды пошта"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
            mb="sm"
          />
          <PasswordInput
            label="Құпия сөз"
            placeholder="Құпия сөзіңізді енгізіңіз"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
            mb="lg"
          />
          <Button type="submit" fullWidth loading={loading}>
            Кіру
          </Button>
        </form>
        <Center mt="md">
          <Text size="sm">
            Аккаунтыңыз жоқ па?{' '}
            <Anchor component={Link} to="/register" fw={500}>
              Тіркелу
            </Anchor>
          </Text>
        </Center>
      </Paper>
    </Box>
  );
}
