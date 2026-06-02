import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container, Title, Group, Button, Table, Modal, Select, Stack, Badge, Text, Card, SimpleGrid, ActionIcon, NumberInput, TextInput, Alert,
} from '@mantine/core';
import { IconPlus, IconTrash, IconArrowsRightLeft, IconAlertCircle } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../store/AuthContext';
import { listWarehouses, getProducts } from '../api';
import { getTransfers, createTransfer } from '../api/nomenclature';
import { TableSkeleton } from '../components/Skeleton';
import { notifications } from '../components/Notifications';

export default function TransfersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<any>({ fromWarehouseId: null, toWarehouseId: null, reason: '', items: [] });
  const [newItem, setNewItem] = useState<any>({ productId: null, quantity: 1, batchId: null });

  const { data: transfers = [], isLoading } = useQuery({ queryKey: ['transfers'], queryFn: getTransfers });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: getProducts });

  const createMut = useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      setCreateOpen(false);
      setForm({ fromWarehouseId: null, toWarehouseId: null, reason: '', items: [] });
      notifications.show({ title: t('common.success'), message: t('transfer.successCreated'), color: 'green' });
    },
  });

  const list = Array.isArray(transfers) ? transfers : [];
  const warehouseOptions = (Array.isArray(warehouses) ? warehouses : []).map((w: any) => ({ value: String(w.id), label: w.name }));
  const productOptions = (Array.isArray(products) ? products : []).map((p: any) => ({ value: String(p.id), label: `${p.name} (${p.sku})` }));
  const sameWh = form.fromWarehouseId && form.toWarehouseId && form.fromWarehouseId === form.toWarehouseId;

  const addItem = () => {
    if (!newItem.productId || !newItem.quantity) return;
    setForm({ ...form, items: [...form.items, { ...newItem }] });
    setNewItem({ productId: null, quantity: 1, batchId: null });
  };
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_: any, i: number) => i !== idx) });

  const submit = () => {
    createMut.mutate({
      fromWarehouseId: form.fromWarehouseId ? +form.fromWarehouseId : undefined,
      toWarehouseId: form.toWarehouseId ? +form.toWarehouseId : undefined,
      reason: form.reason,
      items: form.items.map((it: any) => ({ ...it, productId: +it.productId, batchId: it.batchId ? +it.batchId : undefined })),
      userId: user?.id,
    });
  };

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('transfer.title')}</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateOpen(true)} disabled={(warehouses as any[]).length < 2}>{t('transfer.create')}</Button>
      </Group>

      {isLoading ? <TableSkeleton rows={5} cols={6} /> : (
        <Table striped withTableBorder highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('transfer.fields.number')}</Table.Th>
              <Table.Th>{t('common.date')}</Table.Th>
              <Table.Th>{t('transfer.fields.from')}</Table.Th>
              <Table.Th></Table.Th>
              <Table.Th>{t('transfer.fields.to')}</Table.Th>
              <Table.Th>{t('transfer.fields.reason')}</Table.Th>
              <Table.Th>{t('common.status')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {list.map((tr: any) => (
              <Table.Tr key={tr.id}>
                <Table.Td><code>{tr.number}</code></Table.Td>
                <Table.Td>{new Date(tr.createdAt).toLocaleDateString()}</Table.Td>
                <Table.Td>{tr.fromWarehouse?.name || '-'}</Table.Td>
                <Table.Td><IconArrowsRightLeft size={14} /></Table.Td>
                <Table.Td>{tr.toWarehouse?.name || '-'}</Table.Td>
                <Table.Td>{tr.reason || '-'}</Table.Td>
                <Table.Td><Badge variant="light" color="green">{t(`enum.docStatus.${tr.status || 'Posted'}`)}</Badge></Table.Td>
              </Table.Tr>
            ))}
            {list.length === 0 && <Table.Tr><Table.Td colSpan={7}><Text ta="center" c="dimmed">{t('transfer.noTransfers')}</Text></Table.Td></Table.Tr>}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title={t('transfer.create')} size="lg">
        <Stack>
          <SimpleGrid cols={2}>
            <Select label={t('transfer.fields.from')} data={warehouseOptions} value={form.fromWarehouseId} onChange={(v) => setForm({ ...form, fromWarehouseId: v })} required />
            <Select label={t('transfer.fields.to')} data={warehouseOptions} value={form.toWarehouseId} onChange={(v) => setForm({ ...form, toWarehouseId: v })} required />
          </SimpleGrid>
          {sameWh && (
            <Alert color="red" icon={<IconAlertCircle size={14} />}>
              From and To warehouses must be different
            </Alert>
          )}
          <TextInput label={t('transfer.fields.reason')} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.currentTarget.value })} />
          <Card withBorder>
            <SimpleGrid cols={3}>
              <Select label={t('receipt.itemFields.product')} data={productOptions} value={newItem.productId} onChange={(v) => setNewItem({ ...newItem, productId: v })} searchable />
              <NumberInput label={t('common.qty')} value={newItem.quantity} onChange={(v: any) => setNewItem({ ...newItem, quantity: Number(v) || 0 })} min={0.01} decimalScale={3} />
              <Group align="end"><Button size="xs" leftSection={<IconPlus size={12} />} onClick={addItem} disabled={!newItem.productId}>+</Button></Group>
            </SimpleGrid>
            <Table mt="md" striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('receipt.itemFields.product')}</Table.Th>
                  <Table.Th>{t('common.qty')}</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {form.items.map((it: any, i: number) => {
                  const prod = (products as any[]).find((p: any) => p.id === +it.productId);
                  return (
                    <Table.Tr key={i}>
                      <Table.Td>{prod?.name || `#${it.productId}`}</Table.Td>
                      <Table.Td>{it.quantity}</Table.Td>
                      <Table.Td><ActionIcon color="red" variant="light" onClick={() => removeItem(i)}><IconTrash size={14} /></ActionIcon></Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Card>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={submit} loading={createMut.isPending} disabled={!form.fromWarehouseId || !form.toWarehouseId || form.items.length === 0 || sameWh}>{t('common.save')}</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
