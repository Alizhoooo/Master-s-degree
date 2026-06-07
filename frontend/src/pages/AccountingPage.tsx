import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container, Title, Group, Tabs, Button, Table, Modal, TextInput, Select, Textarea, Badge, NumberInput, Stack, Text,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconBook, IconReceipt, IconChartBar, IconSeeding } from '@tabler/icons-react';
import {
  listAccounts, createAccount, seedStandardPlan,
  listEntries, createEntry, getTrialBalance, getTurnover,
  getProducts,
} from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableSkeleton } from '../components/Skeleton';
import { enumLabel } from '../i18n/enumLabel';

const typeColors: Record<string, string> = {
  Asset: 'blue',
  Liability: 'red',
  Equity: 'violet',
  Income: 'green',
  Expense: 'orange',
};

export default function AccountingPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState<string>('accounts');
  const [accountModal, setAccountModal] = useState(false);
  const [entryModal, setEntryModal] = useState(false);
  const [accountData, setAccountData] = useState({ code: '', name: '', type: 'Asset', vat: false });
  const [entryData, setEntryData] = useState({ date: new Date(), description: '', number: '', lines: [{ accountId: 0, debit: 0, credit: 0, description: '' }, { accountId: 0, debit: 0, credit: 0, description: '' }] });
  const [trialPeriod, setTrialPeriod] = useState(new Date().toISOString().substring(0, 7));

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({ queryKey: ['accounts'], queryFn: listAccounts });
  const { data: entries = [], isLoading: entriesLoading } = useQuery({ queryKey: ['entries'], queryFn: () => listEntries() });
  const { data: trialBalance = [] } = useQuery({ queryKey: ['trialBalance', trialPeriod], queryFn: () => getTrialBalance(trialPeriod), enabled: tab === 'trial' });
  const { data: turnover = [] } = useQuery({ queryKey: ['turnover'], queryFn: () => getTurnover('2026-01', '2026-12'), enabled: tab === 'turnover' });

  const createAccountMut = useMutation({
    mutationFn: createAccount,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); setAccountModal(false); setAccountData({ code: '', name: '', type: 'Asset', vat: false }); },
  });
  const createEntryMut = useMutation({
    mutationFn: createEntry,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['entries'] }); qc.invalidateQueries({ queryKey: ['trialBalance'] }); setEntryModal(false); },
  });
  const seedMut = useMutation({
    mutationFn: seedStandardPlan,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); },
  });

  const accountOptions = (accounts as any[]).map((a: any) => ({ value: String(a.id), label: `${a.code} — ${a.name}` }));

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('accounting.title')}</Title>
        <Group>
          <Button leftSection={<IconSeeding size={16} />} variant="light" onClick={() => seedMut.mutate()} loading={seedMut.isPending}>
            {t('accounting.seedPlan')}
          </Button>
        </Group>
      </Group>

      <Tabs value={tab} onChange={(v: any) => setTab(v || 'accounts')}>
        <Tabs.List>
          <Tabs.Tab value="accounts" leftSection={<IconBook size={14} />}>{t('accounting.accounts')}</Tabs.Tab>
          <Tabs.Tab value="entries" leftSection={<IconReceipt size={14} />}>{t('accounting.entries')}</Tabs.Tab>
          <Tabs.Tab value="trial" leftSection={<IconChartBar size={14} />}>{t('accounting.trialBalance')}</Tabs.Tab>
          <Tabs.Tab value="turnover">{t('accounting.turnover')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="accounts" pt="md">
          <Group justify="flex-end" mb="sm">
            <Button leftSection={<IconPlus size={14} />} onClick={() => setAccountModal(true)}>
              {t('accounting.newAccount')}
            </Button>
          </Group>
          {accountsLoading ? <TableSkeleton rows={10} cols={5} /> : (
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('accounting.fields.code')}</Table.Th>
                  <Table.Th>{t('accounting.fields.name')}</Table.Th>
                  <Table.Th>{t('accounting.fields.type')}</Table.Th>
                  <Table.Th>{t('accounting.fields.vat')}</Table.Th>
                  <Table.Th>{t('accounting.fields.active')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(accounts as any[]).map((a: any) => (
                  <Table.Tr key={a.id}>
                    <Table.Td><strong>{a.code}</strong></Table.Td>
                    <Table.Td>{a.name}</Table.Td>
                    <Table.Td><Badge color={typeColors[a.type] || 'gray'}>{enumLabel(a.type, 'cash') || a.type}</Badge></Table.Td>
                    <Table.Td>{a.vat ? '✓' : ''}</Table.Td>
                    <Table.Td>{a.isActive ? '✓' : '✗'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="entries" pt="md">
          <Group justify="flex-end" mb="sm">
            <Button leftSection={<IconPlus size={14} />} onClick={() => setEntryModal(true)}>
              {t('accounting.newEntry')}
            </Button>
          </Group>
          {entriesLoading ? <TableSkeleton rows={10} cols={5} /> : (
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('accounting.fields.account')}</Table.Th>
                  <Table.Th>{t('accounting.fields.debit')}</Table.Th>
                  <Table.Th>{t('accounting.fields.credit')}</Table.Th>
                  <Table.Th>{t('accounting.fields.period')}</Table.Th>
                  <Table.Th>{t('accounting.fields.description')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(entries as any[]).slice(0, 100).map((e: any) => (
                  <Table.Tr key={e.id}>
                    <Table.Td>{e.account?.code} — {e.account?.name}</Table.Td>
                    <Table.Td>{e.debit > 0 ? e.debit.toFixed(2) : ''}</Table.Td>
                    <Table.Td>{e.credit > 0 ? e.credit.toFixed(2) : ''}</Table.Td>
                    <Table.Td>{e.period}</Table.Td>
                    <Table.Td>{e.description || ''}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="trial" pt="md">
          <Group mb="sm">
            <TextInput
              label={t('accounting.periodLabel')}
              value={trialPeriod}
              onChange={e => setTrialPeriod(e.currentTarget.value)}
            />
          </Group>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('accounting.fields.code')}</Table.Th>
                <Table.Th>{t('accounting.fields.name')}</Table.Th>
                <Table.Th>{t('accounting.fields.openingDebit')}</Table.Th>
                <Table.Th>{t('accounting.fields.openingCredit')}</Table.Th>
                <Table.Th>{t('accounting.fields.turnDebit')}</Table.Th>
                <Table.Th>{t('accounting.fields.turnCredit')}</Table.Th>
                <Table.Th>{t('accounting.fields.closingDebit')}</Table.Th>
                <Table.Th>{t('accounting.fields.closingCredit')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(trialBalance as any[]).map((r: any) => (
                <Table.Tr key={r.code}>
                  <Table.Td><strong>{r.code}</strong></Table.Td>
                  <Table.Td>{r.name}</Table.Td>
                  <Table.Td>{r.openingDebit || ''}</Table.Td>
                  <Table.Td>{r.openingCredit || ''}</Table.Td>
                  <Table.Td>{r.turnDebit || ''}</Table.Td>
                  <Table.Td>{r.turnCredit || ''}</Table.Td>
                  <Table.Td>{r.closingDebit || ''}</Table.Td>
                  <Table.Td>{r.closingCredit || ''}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="turnover" pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('accounting.fields.code')}</Table.Th>
                <Table.Th>{t('accounting.fields.name')}</Table.Th>
                <Table.Th>{t('accounting.fields.turnDebit')}</Table.Th>
                <Table.Th>{t('accounting.fields.turnCredit')}</Table.Th>
                <Table.Th>{t('accounting.balance')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(turnover as any[]).map((r: any) => (
                <Table.Tr key={r.code}>
                  <Table.Td><strong>{r.code}</strong></Table.Td>
                  <Table.Td>{r.name}</Table.Td>
                  <Table.Td><Badge color={typeColors[r.type] || 'gray'}>{enumLabel(r.type, 'cash') || r.type}</Badge></Table.Td>
                  <Table.Td>{r.debit}</Table.Td>
                  <Table.Td>{r.credit}</Table.Td>
                  <Table.Td>{r.balance}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={accountModal} onClose={() => setAccountModal(false)} title={t('accounting.newAccount')} size="md">
        <Stack>
          <TextInput label={t('accounting.fields.code')} value={accountData.code} onChange={e => setAccountData({ ...accountData, code: e.currentTarget.value })} required />
          <TextInput label={t('accounting.fields.name')} value={accountData.name} onChange={e => setAccountData({ ...accountData, name: e.currentTarget.value })} required />
          <Select
            label={t('common.type')}
            data={[
              { value: 'Asset', label: t('enum.accountType.Asset') },
              { value: 'Liability', label: t('enum.accountType.Liability') },
              { value: 'Equity', label: t('enum.accountType.Equity') },
              { value: 'Income', label: t('enum.accountType.Income') },
              { value: 'Expense', label: t('enum.accountType.Expense') },
            ]}
            value={accountData.type}
            onChange={(v: string | null) => setAccountData({ ...accountData, type: v || 'Asset' })}
          />
          <Group justify="flex-end">
            <Button onClick={() => createAccountMut.mutate(accountData)} loading={createAccountMut.isPending}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={entryModal} onClose={() => setEntryModal(false)} title={t('accounting.newEntry')} size="lg">
        <Stack>
          <Group grow>
            <TextInput label={t('common.number')} value={entryData.number} onChange={e => setEntryData({ ...entryData, number: e.currentTarget.value })} required />
            <DatePickerInput label={t('common.date')} value={entryData.date} onChange={(d: any) => setEntryData({ ...entryData, date: d })} required />
          </Group>
          <TextInput label={t('document.fields.description')} value={entryData.description} onChange={e => setEntryData({ ...entryData, description: e.currentTarget.value })} />
          {entryData.lines.map((line, i) => (
            <Group key={i} grow>
              <Select
                label={`${t('accounting.fields.account')} ${i + 1}`}
                data={accountOptions}
                value={line.accountId ? String(line.accountId) : null}
                onChange={(v: string | null) => {
                  const newLines = [...entryData.lines];
                  newLines[i] = { ...line, accountId: v ? +v : 0 };
                  setEntryData({ ...entryData, lines: newLines });
                }}
                searchable
              />
              <NumberInput label={t('accounting.fields.debit')} value={line.debit} onChange={(v: any) => {
                const newLines = [...entryData.lines];
                newLines[i] = { ...line, debit: Number(v) || 0 };
                setEntryData({ ...entryData, lines: newLines });
              }} />
              <NumberInput label={t('accounting.fields.credit')} value={line.credit} onChange={(v: any) => {
                const newLines = [...entryData.lines];
                newLines[i] = { ...line, credit: Number(v) || 0 };
                setEntryData({ ...entryData, lines: newLines });
              }} />
            </Group>
          ))}
          <Group justify="space-between">
            <Text size="sm">
              {t('accounting.totals', { debit: entryData.lines.reduce((s, l) => s + l.debit, 0).toFixed(2), credit: entryData.lines.reduce((s, l) => s + l.credit, 0).toFixed(2) })}
            </Text>
            <Button
              onClick={() => createEntryMut.mutate({
                ...entryData,
                date: entryData.date.toISOString().split('T')[0],
                lines: entryData.lines.filter(l => l.accountId > 0),
              })}
              loading={createEntryMut.isPending}
            >
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
