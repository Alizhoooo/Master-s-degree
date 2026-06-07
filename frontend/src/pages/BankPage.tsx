import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Title, Group, Tabs, Button, Table, Modal, TextInput, Select, NumberInput, Stack, Badge } from '@mantine/core';
import { IconPlus, IconBuildingBank, IconHistory } from '@tabler/icons-react';
import { listBankAccounts, createBankAccount, listBankOrders, createBankOrder, confirmBankOrder } from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableSkeleton } from '../components/Skeleton';
import { statusLabel, enumLabel } from '../i18n/enumLabel';
import { PrintButton } from '../components/printing/PrintButton';

export default function BankPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState('orders');
  const [accModal, setAccModal] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [accData, setAccData] = useState({ name: '', accountNo: '', bankName: '', bik: '', currency: 'KZT' });
  const [orderData, setOrderData] = useState({ accountId: 0, type: 'In', amount: 0, counterparty: '', counterpartyInn: '', purpose: '' });

  const { data: accounts = [], isLoading: accsLoading } = useQuery({ queryKey: ['bankAccounts'], queryFn: listBankAccounts });
  const { data: orders = [], isLoading: ordersLoading } = useQuery({ queryKey: ['bankOrders'], queryFn: () => listBankOrders() });

  const createAccMut = useMutation({ mutationFn: createBankAccount, onSuccess: () => { qc.invalidateQueries({ queryKey: ['bankAccounts'] }); setAccModal(false); } });
  const createOrderMut = useMutation({ mutationFn: createBankOrder, onSuccess: () => { qc.invalidateQueries({ queryKey: ['bankOrders'] }); qc.invalidateQueries({ queryKey: ['bankAccounts'] }); setOrderModal(false); } });
  const confirmMut = useMutation({ mutationFn: confirmBankOrder, onSuccess: () => qc.invalidateQueries({ queryKey: ['bankOrders'] }) });

  const accOptions = (accounts as any[]).map((a: any) => ({ value: String(a.id), label: `${a.name} (${a.balance.toFixed(2)} ${a.currency})` }));

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('bank.title')}</Title>
        <Group>
          {tab === 'orders' && (
            <Button leftSection={<IconPlus size={14} />} onClick={() => setOrderModal(true)} disabled={accounts.length === 0}>
              {t('bank.newOrder')}
            </Button>
          )}
          {tab === 'accounts' && (
            <Button leftSection={<IconPlus size={14} />} onClick={() => setAccModal(true)}>
              {t('bank.newAccount')}
            </Button>
          )}
        </Group>
      </Group>

      <Tabs value={tab} onChange={(v: any) => setTab(v || 'orders')}>
        <Tabs.List>
          <Tabs.Tab value="orders" leftSection={<IconHistory size={14} />}>{t('bank.orders')}</Tabs.Tab>
          <Tabs.Tab value="accounts" leftSection={<IconBuildingBank size={14} />}>{t('bank.accounts')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="orders" pt="md">
          {ordersLoading ? <TableSkeleton rows={10} cols={6} /> : (
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('bank.fields.account')}</Table.Th>
                  <Table.Th>{t('bank.fields.type')}</Table.Th>
                  <Table.Th>{t('bank.fields.amount')}</Table.Th>
                  <Table.Th>{t('bank.fields.counterparty')}</Table.Th>
                  <Table.Th>{t('bank.fields.purpose')}</Table.Th>
                  <Table.Th>{t('bank.fields.status')}</Table.Th>
                  <Table.Th>{t('bank.fields.actions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(orders as any[]).map((o: any) => (
                  <Table.Tr key={o.id}>
                    <Table.Td>{o.account?.name}</Table.Td>
                    <Table.Td><Badge color={o.type === 'In' ? 'green' : 'red'}>{o.type === 'In' ? t('bank.orderType.In') : t('bank.orderType.Out')}</Badge></Table.Td>
                    <Table.Td><strong>{o.amount.toFixed(2)}</strong></Table.Td>
                    <Table.Td>{o.counterparty}</Table.Td>
                    <Table.Td>{o.purpose}</Table.Td>
                    <Table.Td><Badge color={o.status === 'Completed' ? 'green' : 'yellow'}>{statusLabel(o.status)}</Badge></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        {o.status === 'Pending' && <Button size="xs" variant="light" onClick={() => confirmMut.mutate(o.id)} loading={confirmMut.isPending}>{t('bank.confirm')}</Button>}
                        <PrintButton entityType="BankOrder" entityId={o.id} formCode="payment-order" variant="subtle" size="xs" />
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="accounts" pt="md">
          {accsLoading ? <TableSkeleton rows={5} cols={5} /> : (
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('bank.fields.name')}</Table.Th>
                  <Table.Th>{t('bank.fields.accountNo')}</Table.Th>
                  <Table.Th>{t('bank.fields.bank')}</Table.Th>
                  <Table.Th>{t('bank.fields.currency')}</Table.Th>
                  <Table.Th>{t('bank.fields.balance')}</Table.Th>
                  <Table.Th>{t('common.actions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(accounts as any[]).map((a: any) => (
                  <Table.Tr key={a.id}>
                    <Table.Td>{a.name}</Table.Td>
                    <Table.Td>{a.accountNo}</Table.Td>
                    <Table.Td>{a.bankName || '-'}</Table.Td>
                    <Table.Td>{a.currency}</Table.Td>
                    <Table.Td><strong>{a.balance.toFixed(2)}</strong></Table.Td>
                    <Table.Td>
                      <PrintButton entityType="BankAccount" entityId={a.id} formCode="bank-statement" label={t('printing.bankStatement')} variant="subtle" size="xs" />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>
      </Tabs>

      <Modal opened={accModal} onClose={() => setAccModal(false)} title={t('bank.newAccount')}>
        <Stack>
          <TextInput label={t('bank.fields.name')} value={accData.name} onChange={e => setAccData({ ...accData, name: e.currentTarget.value })} required />
          <TextInput label={t('bank.fields.accountNo')} value={accData.accountNo} onChange={e => setAccData({ ...accData, accountNo: e.currentTarget.value })} required />
          <TextInput label={t('bank.fields.bank')} value={accData.bankName} onChange={e => setAccData({ ...accData, bankName: e.currentTarget.value })} />
          <TextInput label={t('bank.fields.bik')} value={accData.bik} onChange={e => setAccData({ ...accData, bik: e.currentTarget.value })} />
          <Select label={t('bank.fields.currency')} data={['KZT', 'USD', 'EUR', 'RUB']} value={accData.currency} onChange={(v: string | null) => setAccData({ ...accData, currency: v || 'KZT' })} />
          <Button onClick={() => createAccMut.mutate(accData)} loading={createAccMut.isPending}>{t('common.create')}</Button>
        </Stack>
      </Modal>

      <Modal opened={orderModal} onClose={() => setOrderModal(false)} title={t('bank.newOrder')} size="md">
        <Stack>
          <Select label={t('bank.fields.account')} data={accOptions} value={orderData.accountId ? String(orderData.accountId) : null} onChange={(v: string | null) => setOrderData({ ...orderData, accountId: v ? +v : 0 })} required />
          <Select label={t('bank.fields.type')} data={[{ value: 'In', label: t('bank.orderType.In') }, { value: 'Out', label: t('bank.orderType.Out') }]} value={orderData.type} onChange={(v: string | null) => setOrderData({ ...orderData, type: v || 'In' })} />
          <NumberInput label={t('bank.fields.amount')} value={orderData.amount} onChange={(v: any) => setOrderData({ ...orderData, amount: Number(v) || 0 })} min={0} required />
          <TextInput label={t('bank.fields.counterparty')} value={orderData.counterparty} onChange={e => setOrderData({ ...orderData, counterparty: e.currentTarget.value })} required />
          <TextInput label={t('bank.fields.inn')} value={orderData.counterpartyInn} onChange={e => setOrderData({ ...orderData, counterpartyInn: e.currentTarget.value })} />
          <TextInput label={t('bank.fields.purpose')} value={orderData.purpose} onChange={e => setOrderData({ ...orderData, purpose: e.currentTarget.value })} required />
          <Button onClick={() => createOrderMut.mutate(orderData)} loading={createOrderMut.isPending} disabled={!orderData.accountId || orderData.amount <= 0}>
            {t('common.create')}
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
