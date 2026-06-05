import { useState } from 'react';
import { Modal, Tabs, Stack, PasswordInput, Button, Text, TextInput, PinInput, Group, Image, Alert, Table, ActionIcon, Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconLock, IconShieldLock, IconDeviceMobile, IconCheck, IconX, IconTrash } from '@tabler/icons-react';
import { useAuth } from '../store/AuthContext';
import { changePassword, setupTotp, verifyTotpSetup, disableTotp, listSessions, revokeSession } from '../api';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export default function SettingsModal({ opened, onClose }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>('password');

  return (
    <Modal opened={opened} onClose={onClose} title={t('auth.changePassword')} size="lg" centered>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="password" leftSection={<IconLock size={14} />}>{t('auth.changePassword')}</Tabs.Tab>
          <Tabs.Tab value="2fa" leftSection={<IconShieldLock size={14} />}>2FA</Tabs.Tab>
          <Tabs.Tab value="sessions" leftSection={<IconDeviceMobile size={14} />}>{t('auth.sessions')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="password" pt="md">
          <PasswordChangeForm />
        </Tabs.Panel>

        <Tabs.Panel value="2fa" pt="md">
          <TwoFactorForm />
        </Tabs.Panel>

        <Tabs.Panel value="sessions" pt="md">
          <SessionsList />
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}

function PasswordChangeForm() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirm) { setMsg({ type: 'error', text: t('auth.passwordsDoNotMatch') }); return; }
    setLoading(true);
    try {
      await changePassword(current, newPwd);
      setMsg({ type: 'success', text: t('auth.passwordChanged') });
      setCurrent(''); setNewPwd(''); setConfirm('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <PasswordInput label={t('auth.currentPassword')} value={current} onChange={(e) => setCurrent(e.target.value)} required />
        <PasswordInput label={t('auth.newPassword')} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={8} />
        <PasswordInput label={t('auth.confirmPassword')} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        {msg.text && <Alert color={msg.type === 'success' ? 'green' : 'red'}>{msg.text}</Alert>}
        <Button type="submit" loading={loading} className="gradient-button">{t('auth.changePassword')}</Button>
      </Stack>
    </form>
  );
}

function TwoFactorForm() {
  const { t } = useTranslation();
  const [step, setStep] = useState<'idle' | 'qr' | 'verify' | 'done'>('idle');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [disablePassword, setDisablePassword] = useState('');

  const handleSetup = async () => {
    setLoading(true);
    try {
      const data = await setupTotp();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('qr');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      await verifyTotpSetup(token);
      setStep('done');
      setMsg({ type: 'success', text: t('auth.totpEnabled') });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await disableTotp(disablePassword);
      setStep('idle');
      setMsg({ type: 'success', text: t('auth.totpDisabled') });
      setDisablePassword('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'qr') {
    return (
      <Stack align="center">
        <Text size="sm">{t('auth.scanQR')}</Text>
        {qrCode && <Image src={qrCode} w={200} h={200} radius="md" />}
        <Text size="xs" c="dimmed">Secret: {secret}</Text>
        <TextInput
          label={t('auth.enterCode')}
          value={token}
          onChange={(e) => setToken(e.currentTarget.value)}
          maxLength={6}
          w={200}
        />
        <Button onClick={handleVerify} loading={loading} className="gradient-button">{t('auth.verify')}</Button>
      </Stack>
    );
  }

  return (
    <Stack>
      {msg.text && <Alert color={msg.type === 'success' ? 'green' : 'red'}>{msg.text}</Alert>}
      <Button onClick={handleSetup} loading={loading} variant="light" leftSection={<IconShieldLock size={14} />}>
        {t('auth.setupTotp')}
      </Button>
      <Text size="xs" c="dimmed" mt="md">{t('auth.confirmPasswordToDisable')}</Text>
      <PasswordInput
        value={disablePassword}
        onChange={(e) => setDisablePassword(e.currentTarget.value)}
        placeholder={t('auth.password')}
      />
      <Button onClick={handleDisable} loading={loading} color="red" variant="outline" leftSection={<IconX size={14} />}>
        {t('auth.disableTotp')}
      </Button>
    </Stack>
  );
}

function SessionsList() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setSessions(await listSessions() || []); } catch { /* ignore */ }
    setLoading(false);
  };

  useState(() => { load(); });

  const handleRevoke = async (id: number) => {
    await revokeSession(id);
    load();
  };

  if (loading) return <Text size="sm">{t('common.loading')}</Text>;

  if (!sessions.length) return <Text size="sm" c="dimmed">{t('auth.noSessions')}</Text>;

  return (
    <Table className="sf-table">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t('common.date')}</Table.Th>
          <Table.Th>User Agent</Table.Th>
          <Table.Th>IP</Table.Th>
          <Table.Th></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {sessions.map((s: any) => (
          <Table.Tr key={s.id}>
            <Table.Td>{new Date(s.createdAt).toLocaleString()}</Table.Td>
            <Table.Td><Text size="xs" lineClamp={1}>{s.userAgent || '-'}</Text></Table.Td>
            <Table.Td>{s.ipAddress || '-'}</Table.Td>
            <Table.Td>
              <ActionIcon color="red" size="sm" onClick={() => handleRevoke(s.id)}>
                <IconTrash size={14} />
              </ActionIcon>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
