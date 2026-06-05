import { useState } from 'react';
import { Container, Paper, Title, TextInput, Button, Text, Anchor, Stack, Alert } from '@mantine/core';
import { IconMail, IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '../api';
import Logo from '../components/Logo';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%', width: '500px', height: '500px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%', width: '400px', height: '400px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)',
      }} />
      <Container size={420}>
        <Paper p="xl" radius="lg" style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <Stack align="center" mb="lg">
            <Logo size={48} />
            <Title order={2} c="white">{t('auth.forgotPassword')}</Title>
          </Stack>
          {submitted ? (
            <Alert icon={<IconCheck size={18} />} color="green" variant="filled" radius="md">
              <Text c="white" size="sm">{t('auth.resetEmailSent')}</Text>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack>
                <TextInput
                  label={t('common.email')}
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  required
                  type="email"
                  leftSection={<IconMail size={16} />}
                  styles={{ input: { background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }, label: { color: '#c7d2fe' } }}
                />
                {error && <Text c="red" size="sm">{error}</Text>}
                <Button type="submit" loading={loading} fullWidth className="gradient-button">
                  {t('auth.sendResetLink')}
                </Button>
                <Anchor c="indigo.3" size="sm" onClick={() => navigate('/login')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                  <IconArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {t('auth.backToLogin')}
                </Anchor>
              </Stack>
            </form>
          )}
        </Paper>
      </Container>
    </div>
  );
}
