import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Title, Group, Tabs, Button, Table, Modal, TextInput, Select, Textarea, Stack, Badge, NumberInput, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconFileText, IconCheck, IconX } from '@tabler/icons-react';
import { listDocuments, createDocument, postDocument, unpostDocument, getCustomers, getProducts } from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableSkeleton } from '../components/Skeleton';
import { statusLabel, enumLabel } from '../i18n/enumLabel';

const typeColors: Record<string, string> = {
  Sale: 'green',
  Purchase: 'blue',
  CustomerInvoice: 'violet',
  SupplierInvoice: 'indigo',
  Receipt: 'cyan',
  Issue: 'orange',
};

export default function DocumentsPage() {
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

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>Документы</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateModal(true)}>Новый документ</Button>
      </Group>

      <Tabs value={tab} onChange={(v: any) => setTab(v || 'all')}>
        <Tabs.List>
          <Tabs.Tab value="all">Все</Tabs.Tab>
          <Tabs.Tab value="Sale">Продажа</Tabs.Tab>
          <Tabs.Tab value="Purchase">Закупка</Tabs.Tab>
          <Tabs.Tab value="CustomerInvoice">Счёт покупателю</Tabs.Tab>
          <Tabs.Tab value="SupplierInvoice">Счёт поставщика</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value={tab} pt="md">
          {docsLoading ? <TableSkeleton rows={10} cols={6} /> : (
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Номер</Table.Th>
                  <Table.Th>Тип</Table.Th>
                  <Table.Th>Дата</Table.Th>
                  <Table.Th>Клиент</Table.Th>
                  <Table.Th>Сумма</Table.Th>
                  <Table.Th>НДС</Table.Th>
                  <Table.Th>Статус</Table.Th>
                  <Table.Th>Действия</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(documents as any[]).map((d: any) => (
                  <Table.Tr key={d.id}>
                    <Table.Td><strong>{d.number}</strong></Table.Td>
                    <Table.Td><Badge color={typeColors[d.type] || 'gray'}>{enumLabel(d.type, 'docStatus') || d.type}</Badge></Table.Td>
                    <Table.Td>{new Date(d.date).toLocaleDateString()}</Table.Td>
                    <Table.Td>{d.customer?.company || '-'}</Table.Td>
                    <Table.Td><strong>{d.totalAmount.toFixed(2)}</strong></Table.Td>
                    <Table.Td>{d.vatAmount.toFixed(2)}</Table.Td>
                    <Table.Td>{d.posted ? <Badge color="green">Проведён</Badge> : <Badge color="yellow">Не проведён</Badge>}</Table.Td>
                    <Table.Td>
                      {!d.posted ? (
                        <Button size="xs" leftSection={<IconCheck size={12} />} onClick={() => postMut.mutate(d.id)}>Провести</Button>
                      ) : (
                        <Button size="xs" color="red" variant="light" leftSection={<IconX size={12} />} onClick={() => unpostMut.mutate(d.id)}>Отменить</Button>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>
      </Tabs>

      <Modal opened={createModal} onClose={() => setCreateModal(false)} title="Новый документ" size="xl">
        <Stack>
          <Group grow>
            <Select label="Тип" data={['Sale', 'Purchase', 'CustomerInvoice', 'SupplierInvoice']} value={type} onChange={(v: string | null) => setType(v || 'Sale')} />
            <Select label="Клиент" data={customerOptions} value={customerId ? String(customerId) : null} onChange={(v: string | null) => setCustomerId(v ? +v : null)} searchable />
          </Group>
          <Textarea label="Описание" value={description} onChange={e => setDescription(e.currentTarget.value)} />
          {items.map((item, i) => (
            <Group key={i} grow>
              <Select label={`Товар ${i + 1}`} data={productOptions} value={item.productId ? String(item.productId) : null} onChange={(v: string | null) => {
                const newItems = [...items];
                newItems[i] = { ...item, productId: v ? +v : 0 };
                setItems(newItems);
              }} searchable />
              <NumberInput label="Кол-во" value={item.quantity} onChange={(v: any) => {
                const newItems = [...items];
                newItems[i] = { ...item, quantity: Number(v) || 1 };
                setItems(newItems);
              }} min={1} />
              <NumberInput label="Цена" value={item.unitPrice} onChange={(v: any) => {
                const newItems = [...items];
                newItems[i] = { ...item, unitPrice: Number(v) || 0 };
                setItems(newItems);
              }} min={0} />
              <NumberInput label="НДС %" value={item.vatRate} onChange={(v: any) => {
                const newItems = [...items];
                newItems[i] = { ...item, vatRate: Number(v) || 0 };
                setItems(newItems);
              }} min={0} max={100} />
            </Group>
          ))}
          <Group justify="space-between">
            <Button variant="subtle" onClick={() => setItems([...items, { productId: 0, quantity: 1, unitPrice: 0, vatRate: 12 }])}>Добавить товар</Button>
            <Text size="sm">Итого: {items.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toFixed(2)}</Text>
            <Button onClick={() => createMut.mutate()} loading={createMut.isPending} disabled={!customerId || items.filter(i => i.productId > 0).length === 0}>Создать</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
