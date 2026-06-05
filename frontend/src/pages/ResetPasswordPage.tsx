import { useState } from 'react';
import { Container, Paper, Title, PasswordInput, Button, Text, Alert, Stack } from '@mantine/core';
import { IconLock, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '../api';
import Logo from '../components/Logo';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || t('auth.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Container size={420} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Alert icon={<IconAlertCircle size={18} />} title={t('common.error')} color="red">
          {t('auth.invalidResetLink')}
        </Alert>
      </Container>
    );
  }

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
      <Container size={420}>
        <Paper p="xl" radius="lg" style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <Stack align="center" mb="lg">
            <Logo size={48} />
            <Title order={2} c="white">{t('auth.resetPassword')}</Title>
          </Stack>
          {success ? (
            <Stack align="center">
              <Alert icon={<IconCheck size={18} />} color="green" variant="filled" radius="md">
                <Text c="white" size="sm">{t('auth.passwordResetSuccess')}</Text>
              </Alert>
              <Button onClick={() => navigate('/login')} className="gradient-button" fullWidth>
                {t('auth.backToLogin')}
              </Button>
            </Stack>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack>
                <PasswordInput
                  label={t('auth.newPassword')}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  required
                  minLength={8}
                  leftSection={<IconLock size={16} />}
                  styles={{ input: { background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }, label: { color: '#c7d2fe' } }}
                />
                <PasswordInput
                  label={t('auth.confirmPassword')}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                  required
                  leftSection={<IconLock size={16} />}
                  styles={{ input: { background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }, label: { color: '#c7d2fe' } }}
                />
                {error && <Text c="red" size="sm">{error}</Text>}
                <Button type="submit" loading={loading} fullWidth className="gradient-button">
                  {t('auth.resetPassword')}
                </Button>
              </Stack>
            </form>
          )}
        </Paper>
      </Container>
    </div>
  );
}
