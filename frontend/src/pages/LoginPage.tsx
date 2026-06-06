import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextInput, PasswordInput, PinInput, Button, Paper, Title, Text, Anchor, Center, Box, Group, Stack, Divider, ThemeIcon } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/AuthContext';
import Logo from '../components/Logo';
import { IconMail, IconLock, IconArrowRight, IconSparkles, IconShieldLock } from '@tabler/icons-react';
import LanguageToggle from '../components/LanguageToggle';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpUserId, setTotpUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, verifyTotpLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(email, password);
      if (result.requiresTotp && result.userId) {
        setTotpUserId(result.userId);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const handleTotpSubmit = async (code: string) => {
    if (code.length !== 6 || !totpUserId) return;
    setLoading(true);
    setError('');
    try {
      await verifyTotpLogin(totpUserId, code);
      navigate('/');
    } catch (err: any) {
      setError(err.message || t('auth.invalidTotp'));
      setTotpCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      }}
    >
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
        p={32}
        radius="xl"
        style={{
          width: 460,
          maxWidth: '100%',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Stack gap="lg">
          <Center>
            <Logo size={48} />
          </Center>

          <Box ta="center">
            <Title order={3} fw={800} c="white" style={{ letterSpacing: '-0.3px' }}>
              {totpUserId ? t('auth.totpTitle') : t('auth.title')}
            </Title>
            <Text size="sm" c="gray.4" mt={4}>
              {totpUserId ? t('auth.totpSubtitle') : 'SupplyFlow ERP'}
            </Text>
          </Box>

          {totpUserId ? (
            <Stack align="center" gap="md">
              <IconShieldLock size={48} color="#818cf8" />
              <PinInput
                length={6}
                value={totpCode}
                onChange={(val) => {
                  setTotpCode(val);
                  if (val.length === 6) handleTotpSubmit(val);
                }}
                type="number"
                size="lg"
                styles={{ input: { background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' } }}
              />
              {error && <Text c="red" size="sm">{error}</Text>}
              <Button
                fullWidth
                loading={loading}
                onClick={() => handleTotpSubmit(totpCode)}
                className="gradient-button"
              >
                {t('auth.verify')}
              </Button>
            </Stack>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label={<span style={{ color: '#c7d2fe' }}>{t('auth.email')}</span>}
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  required
                  size="md"
                  leftSection={<IconMail size={16} stroke={2} />}
                  styles={{ input: { background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' } }}
                />
                <PasswordInput
                  label={<span style={{ color: '#c7d2fe' }}>{t('auth.password')}</span>}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  required
                  size="md"
                  leftSection={<IconLock size={16} stroke={2} />}
                  styles={{ input: { background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' } }}
                />
                <Group justify="space-between">
                  <Anchor
                    size="xs"
                    c="indigo.3"
                    component={Link}
                    to="/forgot-password"
                    style={{ cursor: 'pointer' }}
                  >
                    {t('auth.forgotPassword')}
                  </Anchor>
                </Group>
                {error && <Text c="red" size="sm">{error}</Text>}
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
          )}

          {!totpUserId && (
            <>
              <Divider label={t('auth.or')} labelPosition="center" color="gray.6" />
              <Group justify="center" gap={6}>
                <Text size="sm" c="gray.4">{t('auth.noAccount')}</Text>
                <Anchor component={Link} to="/register" fw={600} c="indigo.3">
                  {t('auth.register')}
                </Anchor>
              </Group>
            </>
          )}
        </Stack>
      </Paper>

      <Box style={{ position: 'absolute', bottom: 24, left: 0, right: 0, textAlign: 'center' }}>
        <Group justify="center" gap={6}>
          <ThemeIcon size="xs" variant="transparent" color="indigo">
            <IconSparkles size={12} />
          </ThemeIcon>
          <Text size="xs" c="dimmed">SupplyFlow BPM · ERP</Text>
        </Group>
      </Box>
    </Box>
  );
}
