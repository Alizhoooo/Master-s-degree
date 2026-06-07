import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Title, Group, Tabs, Button, Table, Modal, Select, Textarea, Stack, Badge, NumberInput, Text } from '@mantine/core';
import { IconPlus, IconCheck, IconX } from '@tabler/icons-react';
import { listDocuments, createDocument, postDocument, unpostDocument, getCustomers, getProducts } from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableSkeleton } from '../components/Skeleton';
import { enumLabel } from '../i18n/enumLabel';
import { PrintButton } from '../components/printing/PrintButton';

const typeColors: Record<string, string> = {
  Sale: 'green',
  Purchase: 'blue',
  CustomerInvoice: 'violet',
  SupplierInvoice: 'indigo',
  Receipt: 'cyan',
  Issue: 'orange',
};

export default function DocumentsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState('all');
  const [createModal, setCreateModal] = useState(false);
  const [type, setType] = useState('Sale');
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<{ productId: number; quantity: number; unitPrice: number; vatRate: number }[]>([{ productId: 0, quantity: 1, unitPrice: 0, vatRate: 12 }]);

  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: getCustomers });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const { data: documents = [], isLoading: docsLoading } = useQuery({ queryKey: ['documents', tab], queryFn: () => listDocuments(tab !== 'all' ? { type: tab } : undefined) });

  const createMut = useMutation({ mutationFn: () => createDocument({ type, customerId, description, items: items.filter(i => i.productId > 0) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); setCreateModal(false); } });
  const postMut = useMutation({ mutationFn: postDocument, onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }) });
  const unpostMut = useMutation({ mutationFn: unpostDocument, onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }) });

  const customerOptions = (customers as any[]).map((c: any) => ({ value: String(c.id), label: c.company }));
  const productOptions = (products as any[]).map((p: any) => ({ value: String(p.id), label: `${p.name} (${p.sku})` }));

  const typeOptions = [
    { value: 'Sale', label: t('enum.docType.Sale') },
    { value: 'Purchase', label: t('enum.docType.Purchase') },
    { value: 'CustomerInvoice', label: t('enum.docType.CustomerInvoice') },
    { value: 'SupplierInvoice', label: t('enum.docType.SupplierInvoice') },
  ];

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('document.title')}</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateModal(true)}>{t('document.create')}</Button>
      </Group>

      <Tabs value={tab} onChange={(v: any) => setTab(v || 'all')}>
        <Tabs.List>
          <Tabs.Tab value="all">{t('common.all')}</Tabs.Tab>
          <Tabs.Tab value="Sale">{t('enum.docType.Sale')}</Tabs.Tab>
          <Tabs.Tab value="Purchase">{t('enum.docType.Purchase')}</Tabs.Tab>
          <Tabs.Tab value="CustomerInvoice">{t('enum.docType.CustomerInvoice')}</Tabs.Tab>
          <Tabs.Tab value="SupplierInvoice">{t('enum.docType.SupplierInvoice')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value={tab} pt="md">
          {docsLoading ? <TableSkeleton rows={10} cols={6} /> : (
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('common.number')}</Table.Th>
                  <Table.Th>{t('common.type')}</Table.Th>
                  <Table.Th>{t('common.date')}</Table.Th>
                  <Table.Th>{t('common.customer')}</Table.Th>
                  <Table.Th>{t('common.sum')}</Table.Th>
                  <Table.Th>{t('document.vat')}</Table.Th>
                  <Table.Th>{t('common.status')}</Table.Th>
                  <Table.Th>{t('common.actions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(documents as any[]).map((d: any) => (
                  <Table.Tr key={d.id}>
                    <Table.Td><strong>{d.number}</strong></Table.Td>
                    <Table.Td><Badge color={typeColors[d.type] || 'gray'}>{(enumLabel(d.type, 'docStatus') || t(`enum.docType.${d.type}`, d.type)) as string}</Badge></Table.Td>
                    <Table.Td>{new Date(d.date).toLocaleDateString()}</Table.Td>
                    <Table.Td>{d.customer?.company || '-'}</Table.Td>
                    <Table.Td><strong>{d.totalAmount.toFixed(2)}</strong></Table.Td>
                    <Table.Td>{d.vatAmount.toFixed(2)}</Table.Td>
                    <Table.Td>{d.posted ? <Badge color="green">{t('enum.documentPostStatus.Posted')}</Badge> : <Badge color="yellow">{t('enum.documentPostStatus.Unposted')}</Badge>}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {d.posted && d.type === 'SalesInvoice' && <PrintButton entityType="Document" entityId={d.id} size="xs" />}
                        {!d.posted ? (
                          <Button size="xs" leftSection={<IconCheck size={12} />} onClick={() => postMut.mutate(d.id)}>{t('document.post')}</Button>
                        ) : (
                          <Button size="xs" color="red" variant="light" leftSection={<IconX size={12} />} onClick={() => unpostMut.mutate(d.id)}>{t('document.unpost')}</Button>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>
      </Tabs>

      <Modal opened={createModal} onClose={() => setCreateModal(false)} title={t('document.create')} size="xl">
        <Stack>
          <Group grow>
            <Select label={t('common.type')} data={typeOptions} value={type} onChange={(v: string | null) => setType(v || 'Sale')} />
            <Select label={t('common.customer')} data={customerOptions} value={customerId ? String(customerId) : null} onChange={(v: string | null) => setCustomerId(v ? +v : null)} searchable />
          </Group>
          <Textarea label={t('document.fields.description')} value={description} onChange={e => setDescription(e.currentTarget.value)} />
          {items.map((item, i) => (
            <Group key={i} grow>
              <Select label={`${t('document.fields.product')} ${i + 1}`} data={productOptions} value={item.productId ? String(item.productId) : null} onChange={(v: string | null) => {
                const newItems = [...items];
                newItems[i] = { ...item, productId: v ? +v : 0 };
                setItems(newItems);
              }} searchable />
              <NumberInput label={t('common.qty')} value={item.quantity} onChange={(v: any) => {
                const newItems = [...items];
                newItems[i] = { ...item, quantity: Number(v) || 1 };
                setItems(newItems);
              }} min={1} />
              <NumberInput label={t('common.price')} value={item.unitPrice} onChange={(v: any) => {
                const newItems = [...items];
                newItems[i] = { ...item, unitPrice: Number(v) || 0 };
                setItems(newItems);
              }} min={0} />
              <NumberInput label={`${t('document.vat')} %`} value={item.vatRate} onChange={(v: any) => {
                const newItems = [...items];
                newItems[i] = { ...item, vatRate: Number(v) || 0 };
                setItems(newItems);
              }} min={0} max={100} />
            </Group>
          ))}
          <Group justify="space-between">
            <Button variant="subtle" onClick={() => setItems([...items, { productId: 0, quantity: 1, unitPrice: 0, vatRate: 12 }])}>{t('order.addProduct')}</Button>
            <Text size="sm">{t('common.total')}: {items.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toFixed(2)}</Text>
            <Button onClick={() => createMut.mutate()} loading={createMut.isPending} disabled={!customerId || items.filter(i => i.productId > 0).length === 0}>{t('common.create')}</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
