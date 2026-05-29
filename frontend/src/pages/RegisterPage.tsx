import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Anchor, Center, Box, Select } from '@mantine/core';
import { useAuth } from '../store/AuthContext';

export default function RegisterPage() {
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
        title: 'Сәтті тіркелу',
        message: 'Аккаунтыңыз сәтті құрылды. Жүйеге кіріңіз.',
        color: 'green',
      });
      navigate('/login');
    } catch (err: any) {
      const { showNotification } = await import('@mantine/notifications');
      showNotification({
        title: 'Қате',
        message: err.message || 'Тіркелу кезінде қате орын алды',
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
          <Title order={2} c="blue.9">Тіркелу</Title>
        </Center>
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Толық аты-жөні"
            placeholder="Аты-жөніңізді енгізіңіз"
            value={fullName}
            onChange={(e) => setFullName(e.currentTarget.value)}
            required
            mb="sm"
          />
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
            mb="sm"
          />
          <Select
            label="Рөл"
            data={[
              { value: 'Admin', label: 'Админ' },
              { value: 'Manager', label: 'Менеджер' },
              { value: 'Warehouse', label: 'Қоймашы' },
            ]}
            value={role}
            onChange={setRole}
            required
            mb="lg"
          />
          <Button type="submit" fullWidth loading={loading}>
            Тіркелу
          </Button>
        </form>
        <Center mt="md">
          <Text size="sm">
            Аккаунтыңыз бар ма?{' '}
            <Anchor component={Link} to="/login" fw={500}>
              Кіру
            </Anchor>
          </Text>
        </Center>
      </Paper>
    </Box>
  );
}
