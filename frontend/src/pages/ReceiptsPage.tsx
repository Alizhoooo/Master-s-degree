import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container, Title, Group, Button, Table, Modal, TextInput, Select, NumberInput, Stack, Badge, Text, Card, SimpleGrid, ActionIcon,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconTrash, IconFileInvoice, IconEye } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../store/AuthContext';
import { listWarehouses, getProducts } from '../api';
import { PrintButton } from '../components/printing/PrintButton';
import { getSuppliers, getReceipts, createReceipt } from '../api/nomenclature';
import { TableSkeleton } from '../components/Skeleton';
import { notifications } from '../components/Notifications';
import PageHeader from '../components/PageHeader';

export default function ReceiptsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState<any>({
    supplierId: null, warehouseId: null, invoiceNumber: '', invoiceDate: null, contractNo: '',
    currency: 'KZT', vatRate: 12, notes: '', items: [],
  });
  const [newItem, setNewItem] = useState<any>({ productId: null, quantity: 1, unitPrice: 0, costPrice: 0, expiryDate: null, manufacturedAt: null, storageLifeDays: 0, batchNo: '', serialNo: '' });

  const { data: receipts = [], isLoading } = useQuery({ queryKey: ['receipts'], queryFn: getReceipts });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: getProducts });

  const createMut = useMutation({
    mutationFn: createReceipt,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receipts'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['low-stock'] });
      setCreateOpen(false);
      setForm({ supplierId: null, warehouseId: null, invoiceNumber: '', invoiceDate: null, contractNo: '', currency: 'KZT', vatRate: 12, notes: '', items: [] });
      notifications.show({ title: t('common.success'), message: t('receipt.successCreated'), color: 'green' });
    },
  });

  const list = Array.isArray(receipts) ? receipts : [];
  const supplierOptions = (Array.isArray(suppliers) ? suppliers : []).map((s: any) => ({ value: String(s.id), label: s.name }));
  const warehouseOptions = (Array.isArray(warehouses) ? warehouses : []).map((w: any) => ({ value: String(w.id), label: w.name }));
  const productOptions = (Array.isArray(products) ? products : []).map((p: any) => ({ value: String(p.id), label: `${p.name} (${p.sku})` }));

  const addItem = () => {
    if (!newItem.productId || !newItem.quantity) return;
    setForm({ ...form, items: [...form.items, { ...newItem }] });
    setNewItem({ productId: null, quantity: 1, unitPrice: 0, costPrice: 0, expiryDate: null, manufacturedAt: null, storageLifeDays: 0, batchNo: '', serialNo: '' });
  };
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_: any, i: number) => i !== idx) });

  const subtotal = form.items.reduce((s: number, it: any) => s + ((it.unitPrice || 0) * (it.quantity || 0)), 0);
  const vatAmount = subtotal * ((form.vatRate || 0) / 100);
  const totalAmount = subtotal + vatAmount;

  const submit = () => {
    const payload: any = {
      ...form,
      supplierId: form.supplierId ? +form.supplierId : undefined,
      warehouseId: form.warehouseId ? +form.warehouseId : undefined,
      invoiceDate: form.invoiceDate?.toISOString?.(),
      items: form.items.map((it: any) => ({
        ...it,
        productId: +it.productId,
        expiryDate: it.expiryDate?.toISOString?.(),
        manufacturedAt: it.manufacturedAt?.toISOString?.(),
      })),
    };
    createMut.mutate({ ...payload, userId: user?.id });
  };

  return (
    <Container size="xl" px={0}>
      <PageHeader
        title={t('receipt.title')}
        icon={IconFileInvoice}
        actions={
          <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateOpen(true)} className="gradient-button">
            {t('receipt.create')}
          </Button>
        }
      />

      {isLoading ? <TableSkeleton rows={6} cols={6} /> : (
        <Table striped withTableBorder highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('receipt.fields.number')}</Table.Th>
              <Table.Th>{t('common.date')}</Table.Th>
              <Table.Th>{t('receipt.fields.supplier')}</Table.Th>
              <Table.Th>{t('receipt.fields.warehouse')}</Table.Th>
              <Table.Th>{t('receipt.fields.invoiceNumber')}</Table.Th>
              <Table.Th>{t('receipt.fields.totalAmount')}</Table.Th>
              <Table.Th>{t('common.status')}</Table.Th>
              <Table.Th>{t('common.actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {list.map((r: any) => (
              <Table.Tr key={r.id}>
                <Table.Td><Group gap={4}><IconFileInvoice size={14} /><code>{r.number}</code></Group></Table.Td>
                <Table.Td>{new Date(r.receivedAt || r.createdAt).toLocaleDateString()}</Table.Td>
                <Table.Td>{r.supplier?.name || r.supplierName || '-'}</Table.Td>
                <Table.Td>{r.warehouse?.name || '-'}</Table.Td>
                <Table.Td>{r.invoiceNumber || '-'}</Table.Td>
                <Table.Td>{r.totalAmount?.toFixed(2)} {r.currency || 'KZT'}</Table.Td>
                <Table.Td><Badge variant="light" color="green">{t(`enum.docStatus.${r.status || 'Posted'}`)}</Badge></Table.Td>
                <Table.Td><Group gap={4}><ActionIcon variant="light" onClick={() => setDetail(r)}><IconEye size={14} /></ActionIcon><PrintButton entityType="ProductReceipt" entityId={r.id} variant="subtle" size="xs" /></Group></Table.Td>
              </Table.Tr>
            ))}
            {list.length === 0 && <Table.Tr><Table.Td colSpan={8}><Text ta="center" c="dimmed">{t('receipt.noReceipts')}</Text></Table.Td></Table.Tr>}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title={t('receipt.create')} size="xl">
        <Stack>
          <SimpleGrid cols={2}>
            <Select label={t('receipt.fields.supplier')} data={supplierOptions} value={form.supplierId} onChange={(v) => setForm({ ...form, supplierId: v })} required searchable />
            <Select label={t('receipt.fields.warehouse')} data={warehouseOptions} value={form.warehouseId} onChange={(v) => setForm({ ...form, warehouseId: v })} required />
          </SimpleGrid>
          <SimpleGrid cols={4}>
            <TextInput label={t('receipt.fields.invoiceNumber')} value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.currentTarget.value })} />
            <DatePickerInput label={t('receipt.fields.invoiceDate')} value={form.invoiceDate} onChange={(d: any) => setForm({ ...form, invoiceDate: d })} />
            <TextInput label={t('receipt.fields.contractNo')} value={form.contractNo} onChange={(e) => setForm({ ...form, contractNo: e.currentTarget.value })} />
            <NumberInput label={t('receipt.fields.vatRate')} value={form.vatRate} onChange={(v: any) => setForm({ ...form, vatRate: Number(v) || 0 })} suffix="%" />
          </SimpleGrid>
          <Card withBorder>
            <Title order={6} mb="xs">{t('receipt.items')}</Title>
            <SimpleGrid cols={4}>
              <Select label={t('receipt.itemFields.product')} data={productOptions} value={newItem.productId} onChange={(v) => setNewItem({ ...newItem, productId: v })} searchable />
              <NumberInput label={t('receipt.itemFields.quantity')} value={newItem.quantity} onChange={(v: any) => setNewItem({ ...newItem, quantity: Number(v) || 0 })} min={0.01} decimalScale={3} />
              <NumberInput label={t('receipt.itemFields.unitPrice')} value={newItem.unitPrice} onChange={(v: any) => setNewItem({ ...newItem, unitPrice: Number(v) || 0 })} decimalScale={2} />
              <NumberInput label={t('receipt.itemFields.costPrice')} value={newItem.costPrice} onChange={(v: any) => setNewItem({ ...newItem, costPrice: Number(v) || 0 })} decimalScale={2} />
            </SimpleGrid>
            <SimpleGrid cols={4} mt="xs">
              <TextInput label={t('receipt.itemFields.batch')} value={newItem.batchNo} onChange={(e) => setNewItem({ ...newItem, batchNo: e.currentTarget.value })} placeholder="B-XXXX" />
              <DatePickerInput label={t('receipt.itemFields.expiryDate')} value={newItem.expiryDate} onChange={(d: any) => setNewItem({ ...newItem, expiryDate: d })} />
              <DatePickerInput label={t('nomenclature.manufacturedAt')} value={newItem.manufacturedAt} onChange={(d: any) => setNewItem({ ...newItem, manufacturedAt: d })} />
              <TextInput label={t('receipt.itemFields.serialNo')} value={newItem.serialNo} onChange={(e) => setNewItem({ ...newItem, serialNo: e.currentTarget.value })} />
            </SimpleGrid>
            <Group justify="flex-end" mt="xs">
              <Button size="xs" leftSection={<IconPlus size={12} />} onClick={addItem} disabled={!newItem.productId}>+</Button>
            </Group>
            <Table mt="md" striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('receipt.itemFields.product')}</Table.Th>
                  <Table.Th>{t('receipt.itemFields.batch')}</Table.Th>
                  <Table.Th>{t('receipt.itemFields.quantity')}</Table.Th>
                  <Table.Th>{t('receipt.itemFields.unitPrice')}</Table.Th>
                  <Table.Th>{t('receipt.itemFields.total')}</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {form.items.map((it: any, i: number) => {
                  const prod = (products as any[]).find((p: any) => p.id === +it.productId);
                  return (
                    <Table.Tr key={i}>
                      <Table.Td>{prod?.name || `#${it.productId}`}</Table.Td>
                      <Table.Td><code>{it.batchNo || '-'}</code></Table.Td>
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
          <Card withBorder>
            <SimpleGrid cols={3}>
              <div><Text size="xs" c="dimmed">{t('receipt.fields.subtotal')}</Text><Text fw={700}>{subtotal.toFixed(2)} {form.currency}</Text></div>
              <div><Text size="xs" c="dimmed">{t('receipt.fields.vatAmount')}</Text><Text fw={700}>{vatAmount.toFixed(2)} {form.currency}</Text></div>
              <div><Text size="xs" c="dimmed">{t('receipt.fields.totalAmount')}</Text><Text fw={700} size="lg" c="blue">{totalAmount.toFixed(2)} {form.currency}</Text></div>
            </SimpleGrid>
          </Card>
          <TextInput label={t('receipt.fields.notes')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.currentTarget.value })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={submit} loading={createMut.isPending} disabled={!form.supplierId || !form.warehouseId || form.items.length === 0}>{t('common.save')}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={!!detail} onClose={() => setDetail(null)} title={detail?.number || ''} size="lg">
        {detail && (
          <Stack>
            <Card withBorder>
              <SimpleGrid cols={2}>
                <div><Text size="xs" c="dimmed">{t('receipt.fields.supplier')}</Text><Text>{detail.supplier?.name || detail.supplierName || '-'}</Text></div>
                <div><Text size="xs" c="dimmed">{t('receipt.fields.warehouse')}</Text><Text>{detail.warehouse?.name || '-'}</Text></div>
                <div><Text size="xs" c="dimmed">{t('receipt.fields.invoiceNumber')}</Text><Text>{detail.invoiceNumber || '-'}</Text></div>
                <div><Text size="xs" c="dimmed">{t('common.date')}</Text><Text>{new Date(detail.receivedAt || detail.createdAt).toLocaleString()}</Text></div>
              </SimpleGrid>
            </Card>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('receipt.itemFields.product')}</Table.Th>
                  <Table.Th>{t('receipt.itemFields.quantity')}</Table.Th>
                  <Table.Th>{t('receipt.itemFields.unitPrice')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(detail.items || []).map((it: any, i: number) => (
                  <Table.Tr key={i}>
                    <Table.Td>{it.product?.name || `#${it.productId}`}</Table.Td>
                    <Table.Td>{it.quantity}</Table.Td>
                    <Table.Td>{it.unitPrice?.toFixed(2)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Group justify="flex-end"><Text fw={700}>{t('receipt.fields.totalAmount')}: {detail.totalAmount?.toFixed(2)} {detail.currency}</Text></Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
