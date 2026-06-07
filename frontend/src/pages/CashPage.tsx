import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Title, Group, Tabs, Button, Table, Modal, TextInput, Select, NumberInput, Stack, Badge, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconCash, IconHistory } from '@tabler/icons-react';
import { listCashRegisters, createCashRegister, listCashOrders, createCashOrder, getCashBalance } from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableSkeleton } from '../components/Skeleton';
import { PrintButton } from '../components/printing/PrintButton';

export default function CashPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState('orders');
  const [regModal, setRegModal] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [regData, setRegData] = useState({ name: '', currency: 'KZT' });
  const [orderData, setOrderData] = useState({ registerId: 0, type: 'Income', amount: 0, counterparty: '', basis: '' });

  const { data: registers = [], isLoading: regsLoading } = useQuery({ queryKey: ['cashRegisters'], queryFn: listCashRegisters });
  const { data: orders = [], isLoading: ordersLoading } = useQuery({ queryKey: ['cashOrders'], queryFn: () => listCashOrders() });

  const createRegMut = useMutation({ mutationFn: createCashRegister, onSuccess: () => { qc.invalidateQueries({ queryKey: ['cashRegisters'] }); setRegModal(false); } });
  const createOrderMut = useMutation({ mutationFn: createCashOrder, onSuccess: () => { qc.invalidateQueries({ queryKey: ['cashOrders'] }); qc.invalidateQueries({ queryKey: ['cashRegisters'] }); setOrderModal(false); } });

  const regOptions = (registers as any[]).map((r: any) => ({ value: String(r.id), label: `${r.name} (${r.balance.toFixed(2)} ${r.currency})` }));

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('cash.title')}</Title>
        <Group>
          {tab === 'orders' && (
            <Button leftSection={<IconPlus size={14} />} onClick={() => setOrderModal(true)} disabled={registers.length === 0}>
              {t('cash.newOrder')}
            </Button>
          )}
          {tab === 'registers' && (
            <Button leftSection={<IconPlus size={14} />} onClick={() => setRegModal(true)}>
              {t('cash.newRegister')}
            </Button>
          )}
        </Group>
      </Group>

      <Tabs value={tab} onChange={(v: any) => setTab(v || 'orders')}>
        <Tabs.List>
          <Tabs.Tab value="orders" leftSection={<IconHistory size={14} />}>{t('cash.orders')}</Tabs.Tab>
          <Tabs.Tab value="registers" leftSection={<IconCash size={14} />}>{t('cash.registers')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="orders" pt="md">
          {ordersLoading ? <TableSkeleton rows={10} cols={6} /> : (
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('cash.fields.register')}</Table.Th>
                  <Table.Th>{t('cash.fields.type')}</Table.Th>
                  <Table.Th>{t('cash.fields.amount')}</Table.Th>
                  <Table.Th>{t('cash.fields.counterparty')}</Table.Th>
                  <Table.Th>{t('cash.fields.basis')}</Table.Th>
                  <Table.Th>{t('cash.fields.date')}</Table.Th>
                  <Table.Th>{t('common.actions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(orders as any[]).map((o: any) => (
                  <Table.Tr key={o.id}>
                    <Table.Td>{o.register?.name}</Table.Td>
                    <Table.Td><Badge color={o.type === 'Income' ? 'green' : 'red'}>{o.type === 'Income' ? t('cash.orderType.Income') : t('cash.orderType.Expense')}</Badge></Table.Td>
                    <Table.Td><strong>{o.amount.toFixed(2)}</strong></Table.Td>
                    <Table.Td>{o.counterparty}</Table.Td>
                    <Table.Td>{o.basis}</Table.Td>
                    <Table.Td>{new Date(o.createdAt).toLocaleDateString()}</Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <PrintButton
                          entityType="CashOrder"
                          entityId={o.id}
                          formCode={o.type === 'Income' ? 'pko' : 'rko'}
                          variant="subtle"
                          size="xs"
                        />
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="registers" pt="md">
          {regsLoading ? <TableSkeleton rows={5} cols={4} /> : (
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('cash.fields.name')}</Table.Th>
                  <Table.Th>{t('cash.fields.currency')}</Table.Th>
                  <Table.Th>{t('cash.fields.balance')}</Table.Th>
                  <Table.Th>{t('cash.fields.status')}</Table.Th>
                  <Table.Th>{t('common.actions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(registers as any[]).map((r: any) => (
                  <Table.Tr key={r.id}>
                    <Table.Td>{r.name}</Table.Td>
                    <Table.Td>{r.currency}</Table.Td>
                    <Table.Td><strong>{r.balance.toFixed(2)}</strong></Table.Td>
                    <Table.Td><Badge color={r.isActive ? 'green' : 'red'}>{r.isActive ? t('enum.cashRegisterStatus.Active') : t('enum.cashRegisterStatus.Inactive')}</Badge></Table.Td>
                    <Table.Td>
                      <PrintButton entityType="CashRegister" entityId={r.id} formCode="ko-4" label={t('printing.cashBook', 'Кассовая книга')} variant="subtle" size="xs" />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>
      </Tabs>

      <Modal opened={regModal} onClose={() => setRegModal(false)} title={t('cash.newRegister')}>
        <Stack>
          <TextInput label={t('cash.fields.name')} value={regData.name} onChange={e => setRegData({ ...regData, name: e.currentTarget.value })} required />
          <Select label={t('cash.fields.currency')} data={['KZT', 'USD', 'EUR', 'RUB']} value={regData.currency} onChange={(v: string | null) => setRegData({ ...regData, currency: v || 'KZT' })} />
          <Button onClick={() => createRegMut.mutate(regData)} loading={createRegMut.isPending}>{t('common.create')}</Button>
        </Stack>
      </Modal>

      <Modal opened={orderModal} onClose={() => setOrderModal(false)} title={t('cash.newOrder')} size="md">
        <Stack>
          <Select label={t('cash.fields.register')} data={regOptions} value={orderData.registerId ? String(orderData.registerId) : null} onChange={(v: string | null) => setOrderData({ ...orderData, registerId: v ? +v : 0 })} required />
          <Select label={t('cash.fields.type')} data={[{ value: 'Income', label: t('cash.orderType.Income') }, { value: 'Expense', label: t('cash.orderType.Expense') }]} value={orderData.type} onChange={(v: string | null) => setOrderData({ ...orderData, type: v || 'Income' })} />
          <NumberInput label={t('cash.fields.amount')} value={orderData.amount} onChange={(v: any) => setOrderData({ ...orderData, amount: Number(v) || 0 })} min={0} required />
          <TextInput label={t('cash.fields.counterparty')} value={orderData.counterparty} onChange={e => setOrderData({ ...orderData, counterparty: e.currentTarget.value })} required />
          <TextInput label={t('cash.fields.basis')} value={orderData.basis} onChange={e => setOrderData({ ...orderData, basis: e.currentTarget.value })} required />
          <Button onClick={() => createOrderMut.mutate(orderData)} loading={createOrderMut.isPending} disabled={!orderData.registerId || orderData.amount <= 0}>
            {t('common.create')}
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
