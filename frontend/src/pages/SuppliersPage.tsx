import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container, Title, Group, Button, Table, Modal, TextInput, Stack, Badge, Text, Card, SimpleGrid, NumberInput,
} from '@mantine/core';
import { IconPlus, IconBuilding, IconStar, IconTruckDelivery } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, createSupplier, updateSupplier, getSupplierReceipts } from '../api/nomenclature';
import { TableSkeleton } from '../components/Skeleton';
import { notifications } from '../components/Notifications';
import PageHeader from '../components/PageHeader';

export default function SuppliersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [detailSupplier, setDetailSupplier] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm());

  function emptyForm() {
    return { name: '', contactPerson: '', phone: '', email: '', inn: '', address: '', bankAccount: '', bankName: '', bic: '', category: '', rating: 5, isActive: true };
  }

  const { data: suppliers = [], isLoading } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers });
  const { data: receipts = [] } = useQuery({
    queryKey: ['supplier-receipts', detailSupplier?.id],
    queryFn: () => detailSupplier ? getSupplierReceipts(detailSupplier.id) : Promise.resolve([]),
    enabled: !!detailSupplier,
  });

  const createMut = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setCreateOpen(false);
      setForm(emptyForm());
      notifications.show({ title: t('common.success'), message: t('supplier.successCreated'), color: 'green' });
    },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateSupplier(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setEditSupplier(null);
      notifications.show({ title: t('common.success'), message: t('supplier.successUpdated'), color: 'green' });
    },
  });

  const list = Array.isArray(suppliers) ? suppliers : [];
  const totalActive = list.filter((s: any) => s.isActive !== false).length;
  const avgRating = list.length ? (list.reduce((sum: number, s: any) => sum + (s.rating || 0), 0) / list.length).toFixed(1) : '0';

  return (
    <Container size="xl" px={0}>
      <PageHeader
        title={t('supplier.title')}
        icon={IconTruckDelivery}
        actions={
          <Button leftSection={<IconPlus size={14} />} onClick={() => { setForm(emptyForm()); setCreateOpen(true); }} className="gradient-button">
            {t('supplier.create')}
          </Button>
        }
      />

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="md">
        <Card withBorder><Group><IconBuilding size={24} /><div><Text size="xs" c="dimmed">{t('common.total')}</Text><Text size="xl" fw={700}>{list.length}</Text></div></Group></Card>
        <Card withBorder><Group><IconStar size={24} color="orange" /><div><Text size="xs" c="dimmed">{t('supplier.fields.rating')}</Text><Text size="xl" fw={700}>{avgRating}</Text></div></Group></Card>
        <Card withBorder><Group><IconTruckDelivery size={24} color="green" /><div><Text size="xs" c="dimmed">{t('enum.docStatus.Active')}</Text><Text size="xl" fw={700}>{totalActive}</Text></div></Group></Card>
      </SimpleGrid>

      {isLoading ? <TableSkeleton rows={6} cols={5} /> : (
        <Table striped withTableBorder highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('supplier.fields.name')}</Table.Th>
              <Table.Th>{t('supplier.fields.contactPerson')}</Table.Th>
              <Table.Th>{t('supplier.fields.phone')}</Table.Th>
              <Table.Th>{t('supplier.fields.inn')}</Table.Th>
              <Table.Th>{t('supplier.fields.rating')}</Table.Th>
              <Table.Th>{t('common.actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {list.map((s: any) => (
              <Table.Tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setDetailSupplier(s)}>
                <Table.Td>
                  <Text fw={500}>{s.name}</Text>
                  {s.isActive === false && <Badge color="gray" size="xs" ml="xs">inactive</Badge>}
                </Table.Td>
                <Table.Td>{s.contactPerson || '-'}</Table.Td>
                <Table.Td>{s.phone || '-'}</Table.Td>
                <Table.Td>{s.inn || '-'}</Table.Td>
                <Table.Td>
                  <Group gap={2}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <IconStar key={i} size={12} fill={i < (s.rating || 0) ? 'orange' : 'none'} color={i < (s.rating || 0) ? 'orange' : 'gray'} />
                    ))}
                  </Group>
                </Table.Td>
                <Table.Td onClick={(e) => e.stopPropagation()}>
                  <Button size="xs" variant="light" onClick={() => { setForm({ ...s }); setEditSupplier(s); }}>{t('common.edit')}</Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {list.length === 0 && <Table.Tr><Table.Td colSpan={6}><Text ta="center" c="dimmed">{t('supplier.noSuppliers')}</Text></Table.Td></Table.Tr>}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={createOpen || !!editSupplier} onClose={() => { setCreateOpen(false); setEditSupplier(null); }} title={editSupplier ? t('supplier.edit') : t('supplier.create')} size="lg">
        <Stack>
          <TextInput label={t('supplier.fields.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.currentTarget.value })} required />
          <SimpleGrid cols={2}>
            <TextInput label={t('supplier.fields.contactPerson')} value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.currentTarget.value })} />
            <TextInput label={t('supplier.fields.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.currentTarget.value })} />
          </SimpleGrid>
          <SimpleGrid cols={2}>
            <TextInput label={t('supplier.fields.email')} value={form.email} onChange={(e) => setForm({ ...form, email: e.currentTarget.value })} />
            <TextInput label={t('supplier.fields.inn')} value={form.inn} onChange={(e) => setForm({ ...form, inn: e.currentTarget.value })} />
          </SimpleGrid>
          <TextInput label={t('supplier.fields.address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.currentTarget.value })} />
          <SimpleGrid cols={3}>
            <TextInput label={t('supplier.fields.bankAccount')} value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.currentTarget.value })} />
            <TextInput label={t('supplier.fields.bankName')} value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.currentTarget.value })} />
            <TextInput label={t('supplier.fields.bic')} value={form.bic} onChange={(e) => setForm({ ...form, bic: e.currentTarget.value })} />
          </SimpleGrid>
          <SimpleGrid cols={2}>
            <TextInput label={t('supplier.fields.category')} value={form.category} onChange={(e) => setForm({ ...form, category: e.currentTarget.value })} />
            <NumberInput label={t('supplier.fields.rating')} value={form.rating} onChange={(v: any) => setForm({ ...form, rating: Number(v) || 0 })} min={0} max={5} />
          </SimpleGrid>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { setCreateOpen(false); setEditSupplier(null); }}>{t('common.cancel')}</Button>
            <Button onClick={() => editSupplier ? updateMut.mutate({ id: editSupplier.id, data: form }) : createMut.mutate(form)} loading={createMut.isPending || updateMut.isPending}>{t('common.save')}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={!!detailSupplier} onClose={() => setDetailSupplier(null)} title={detailSupplier?.name || ''} size="lg">
        {detailSupplier && (
          <Stack>
            <Card withBorder>
              <SimpleGrid cols={2}>
                <div><Text size="xs" c="dimmed">{t('supplier.fields.contactPerson')}</Text><Text>{detailSupplier.contactPerson || '-'}</Text></div>
                <div><Text size="xs" c="dimmed">{t('supplier.fields.phone')}</Text><Text>{detailSupplier.phone || '-'}</Text></div>
                <div><Text size="xs" c="dimmed">{t('supplier.fields.email')}</Text><Text>{detailSupplier.email || '-'}</Text></div>
                <div><Text size="xs" c="dimmed">{t('supplier.fields.inn')}</Text><Text>{detailSupplier.inn || '-'}</Text></div>
                <div><Text size="xs" c="dimmed">{t('supplier.fields.bankName')}</Text><Text>{detailSupplier.bankName || '-'}</Text></div>
                <div><Text size="xs" c="dimmed">{t('supplier.fields.bankAccount')}</Text><Text>{detailSupplier.bankAccount || '-'}</Text></div>
              </SimpleGrid>
            </Card>
            <Title order={5}>{t('supplier.receipts')}</Title>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('receipt.fields.number')}</Table.Th>
                  <Table.Th>{t('common.date')}</Table.Th>
                  <Table.Th>{t('receipt.fields.totalAmount')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(receipts as any[]).slice(0, 20).map((r: any) => (
                  <Table.Tr key={r.id}>
                    <Table.Td><code>{r.number}</code></Table.Td>
                    <Table.Td>{new Date(r.receivedAt || r.createdAt).toLocaleDateString()}</Table.Td>
                    <Table.Td>{r.totalAmount?.toFixed(2)} {r.currency || 'KZT'}</Table.Td>
                  </Table.Tr>
                ))}
                {(receipts as any[]).length === 0 && <Table.Tr><Table.Td colSpan={3}><Text ta="center" c="dimmed">-</Text></Table.Td></Table.Tr>}
              </Table.Tbody>
            </Table>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
