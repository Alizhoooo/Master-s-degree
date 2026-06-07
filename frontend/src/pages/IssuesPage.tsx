import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container, Title, Group, Button, Table, Modal, Select, Stack, Badge, Text, Card, SimpleGrid, ActionIcon, NumberInput, TextInput, SegmentedControl,
} from '@mantine/core';
import { IconPlus, IconTrash, IconEye, IconArrowsRightLeft, IconBoxSeam } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../store/AuthContext';
import { listWarehouses, getProducts } from '../api';
import { getIssues, createIssue, getTransfers, createTransfer } from '../api/nomenclature';
import { PrintButton } from '../components/printing/PrintButton';
import { TableSkeleton } from '../components/Skeleton';
import { notifications } from '../components/Notifications';
import PageHeader from '../components/PageHeader';

const ISSUE_TYPES = ['Sale', 'WriteOff', 'Production', 'Return'];

export default function IssuesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [type, setType] = useState('Sale');
  const [form, setForm] = useState<any>({ warehouseId: null, customerId: null, reason: '', notes: '', items: [] });
  const [newItem, setNewItem] = useState<any>({ productId: null, quantity: 1, unitPrice: 0, batchId: null });

  const { data: issues = [], isLoading } = useQuery({ queryKey: ['issues', type], queryFn: getIssues });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: getProducts });

  const createMut = useMutation({
    mutationFn: createIssue,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['low-stock'] });
      setCreateOpen(false);
      setForm({ warehouseId: null, customerId: null, reason: '', notes: '', items: [] });
      notifications.show({ title: t('common.success'), message: t('issue.successCreated'), color: 'green' });
    },
  });

  const list = Array.isArray(issues) ? issues : [];
  const filtered = list.filter((i: any) => !i.type || i.type === type);
  const warehouseOptions = (Array.isArray(warehouses) ? warehouses : []).map((w: any) => ({ value: String(w.id), label: w.name }));
  const productOptions = (Array.isArray(products) ? products : []).map((p: any) => ({ value: String(p.id), label: `${p.name} (${p.sku})` }));
  const totalAmount = form.items.reduce((s: number, it: any) => s + ((it.unitPrice || 0) * (it.quantity || 0)), 0);

  const addItem = () => {
    if (!newItem.productId || !newItem.quantity) return;
    setForm({ ...form, items: [...form.items, { ...newItem }] });
    setNewItem({ productId: null, quantity: 1, unitPrice: 0, batchId: null });
  };
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_: any, i: number) => i !== idx) });

  const submit = () => {
    createMut.mutate({
      type,
      warehouseId: form.warehouseId ? +form.warehouseId : undefined,
      customerId: form.customerId ? +form.customerId : undefined,
      reason: form.reason,
      notes: form.notes,
      totalAmount,
      items: form.items.map((it: any) => ({ ...it, productId: +it.productId, batchId: it.batchId ? +it.batchId : undefined })),
      userId: user?.id,
    });
  };

  return (
    <Container size="xl" px={0}>
      <PageHeader
        title={t('issue.title')}
        icon={IconBoxSeam}
        actions={
          <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateOpen(true)} className="gradient-button">
            {t('issue.create')}
          </Button>
        }
      />

      <SegmentedControl
        value={type}
        onChange={setType}
        data={ISSUE_TYPES.map((tp) => ({ value: tp, label: t(`issue.types.${tp}`) }))}
        mb="md"
      />

      {isLoading ? <TableSkeleton rows={6} cols={6} /> : (
        <Table striped withTableBorder highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('issue.fields.number')}</Table.Th>
              <Table.Th>{t('common.date')}</Table.Th>
              <Table.Th>{t('issue.fields.type')}</Table.Th>
              <Table.Th>{t('issue.fields.warehouse')}</Table.Th>
              <Table.Th>{t('issue.fields.reason')}</Table.Th>
              <Table.Th>{t('issue.fields.totalAmount')}</Table.Th>
              <Table.Th>{t('common.status')}</Table.Th>
              <Table.Th>{t('common.actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((i: any) => (
              <Table.Tr key={i.id}>
                <Table.Td><code>{i.number}</code></Table.Td>
                <Table.Td>{new Date(i.createdAt).toLocaleDateString()}</Table.Td>
                <Table.Td><Badge variant="light">{t(`issue.types.${i.type || 'Sale'}`)}</Badge></Table.Td>
                <Table.Td>{i.warehouse?.name || '-'}</Table.Td>
                <Table.Td>{i.reason || '-'}</Table.Td>
                <Table.Td>{i.totalAmount?.toFixed(2)}</Table.Td>
                <Table.Td><Badge variant="light" color="green">{t(`enum.docStatus.${i.status || 'Posted'}`)}</Badge></Table.Td>
                <Table.Td><Group gap={4}><ActionIcon variant="light" onClick={() => setDetail(i)}><IconEye size={14} /></ActionIcon><PrintButton entityType="ProductIssue" entityId={i.id} variant="subtle" size="xs" /></Group></Table.Td>
              </Table.Tr>
            ))}
            {filtered.length === 0 && <Table.Tr><Table.Td colSpan={8}><Text ta="center" c="dimmed">{t('issue.noIssues')}</Text></Table.Td></Table.Tr>}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title={`${t('issue.create')} (${t(`issue.types.${type}`)})`} size="xl">
        <Stack>
          <Select label={t('issue.fields.warehouse')} data={warehouseOptions} value={form.warehouseId} onChange={(v) => setForm({ ...form, warehouseId: v })} required />
          <TextInput label={t('issue.fields.reason')} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.currentTarget.value })} />
          <TextInput label={t('issue.fields.notes')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.currentTarget.value })} />
          <Card withBorder>
            <SimpleGrid cols={3}>
              <Select label={t('issue.itemFields.product' as any) || t('receipt.itemFields.product')} data={productOptions} value={newItem.productId} onChange={(v) => setNewItem({ ...newItem, productId: v })} searchable />
              <NumberInput label={t('common.qty')} value={newItem.quantity} onChange={(v: any) => setNewItem({ ...newItem, quantity: Number(v) || 0 })} min={0.01} decimalScale={3} />
              <NumberInput label={t('common.price')} value={newItem.unitPrice} onChange={(v: any) => setNewItem({ ...newItem, unitPrice: Number(v) || 0 })} decimalScale={2} />
            </SimpleGrid>
            <Group justify="flex-end" mt="xs">
              <Button size="xs" leftSection={<IconPlus size={12} />} onClick={addItem} disabled={!newItem.productId}>+</Button>
            </Group>
            <Table mt="md" striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('receipt.itemFields.product')}</Table.Th>
                  <Table.Th>{t('common.qty')}</Table.Th>
                  <Table.Th>{t('common.price')}</Table.Th>
                  <Table.Th>{t('common.sum')}</Table.Th>
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
                      <Table.Td>{it.unitPrice?.toFixed(2)}</Table.Td>
                      <Table.Td>{((it.unitPrice || 0) * (it.quantity || 0)).toFixed(2)}</Table.Td>
                      <Table.Td><ActionIcon color="red" variant="light" onClick={() => removeItem(i)}><IconTrash size={14} /></ActionIcon></Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Card>
          <Group justify="flex-end"><Text fw={700}>{t('common.total')}: {totalAmount.toFixed(2)}</Text></Group>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={submit} loading={createMut.isPending} disabled={!form.warehouseId || form.items.length === 0}>{t('common.save')}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={!!detail} onClose={() => setDetail(null)} title={detail?.number || ''} size="lg">
        {detail && (
          <Stack>
            <Card withBorder>
              <SimpleGrid cols={2}>
                <div><Text size="xs" c="dimmed">{t('issue.fields.type')}</Text><Text>{t(`issue.types.${detail.type || 'Sale'}`)}</Text></div>
                <div><Text size="xs" c="dimmed">{t('issue.fields.warehouse')}</Text><Text>{detail.warehouse?.name || '-'}</Text></div>
                <div><Text size="xs" c="dimmed">{t('issue.fields.reason')}</Text><Text>{detail.reason || '-'}</Text></div>
                <div><Text size="xs" c="dimmed">{t('common.date')}</Text><Text>{new Date(detail.createdAt).toLocaleString()}</Text></div>
              </SimpleGrid>
            </Card>
            <Table striped>
              <Table.Thead>
                <Table.Tr><Table.Th>{t('receipt.itemFields.product')}</Table.Th><Table.Th>{t('common.qty')}</Table.Th><Table.Th>{t('common.sum')}</Table.Th></Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(detail.items || []).map((it: any, i: number) => (
                  <Table.Tr key={i}>
                    <Table.Td>{it.product?.name || `#${it.productId}`}</Table.Td>
                    <Table.Td>{it.quantity}</Table.Td>
                    <Table.Td>{((it.unitPrice || 0) * (it.quantity || 0)).toFixed(2)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
