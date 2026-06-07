import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Title, Group, Tabs, Button, Table, Modal, TextInput, Select, NumberInput, Stack, Badge, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconBuildingWarehouse, IconArrowsTransferUp, IconBoxSeam, IconHistory } from '@tabler/icons-react';
import { listWarehouses, createWarehouse, getWarehouseStock, transferStock, listMovements, listBatches, createBatch, getProducts } from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableSkeleton } from '../components/Skeleton';

export default function WarehousePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState('warehouses');
  const [whModal, setWhModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [batchModal, setBatchModal] = useState(false);
  const [whData, setWhData] = useState({ name: '', address: '', isMain: false });
  const [transferData, setTransferData] = useState({ fromWarehouseId: 0, toWarehouseId: 0, productId: 0, quantity: 1 });
  const [batchData, setBatchData] = useState({ productId: 0, batchNo: '', quantity: 0, costPrice: 0, expiryDate: null as Date | null });

  const { data: warehouses = [], isLoading: whLoading } = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses });
  const { data: movements = [] } = useQuery({ queryKey: ['movements'], queryFn: () => listMovements(), enabled: tab === 'movements' });
  const { data: batches = [] } = useQuery({ queryKey: ['batches'], queryFn: () => listBatches(), enabled: tab === 'batches' });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: getProducts });

  const createWhMut = useMutation({ mutationFn: createWarehouse, onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); setWhModal(false); } });
  const transferMut = useMutation({ mutationFn: transferStock, onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); qc.invalidateQueries({ queryKey: ['movements'] }); setTransferModal(false); } });
  const createBatchMut = useMutation({ mutationFn: createBatch, onSuccess: () => { qc.invalidateQueries({ queryKey: ['batches'] }); setBatchModal(false); } });

  const whOptions = (warehouses as any[]).map((w: any) => ({ value: String(w.id), label: w.name }));
  const productOptions = (products as any[]).map((p: any) => ({ value: String(p.id), label: `${p.name} (${p.sku})` }));

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('warehouse.title')}</Title>
        <Group>
          {tab === 'warehouses' && <Button leftSection={<IconPlus size={14} />} onClick={() => setWhModal(true)}>{t('warehouse.warehouses')}</Button>}
          {tab === 'warehouses' && <Button leftSection={<IconArrowsTransferUp size={14} />} variant="light" onClick={() => setTransferModal(true)} disabled={warehouses.length < 2}>{t('warehouse.transfer')}</Button>}
          {tab === 'batches' && <Button leftSection={<IconPlus size={14} />} onClick={() => setBatchModal(true)}>{t('warehouse.batches')}</Button>}
        </Group>
      </Group>

      <Tabs value={tab} onChange={(v: any) => setTab(v || 'warehouses')}>
        <Tabs.List>
          <Tabs.Tab value="warehouses" leftSection={<IconBuildingWarehouse size={14} />}>{t('warehouse.warehouses')}</Tabs.Tab>
          <Tabs.Tab value="movements" leftSection={<IconHistory size={14} />}>{t('warehouse.movements')}</Tabs.Tab>
          <Tabs.Tab value="batches" leftSection={<IconBoxSeam size={14} />}>{t('warehouse.batches')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="warehouses" pt="md">
          {whLoading ? <TableSkeleton rows={5} cols={4} /> : (
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('warehouse.fields.name')}</Table.Th>
                  <Table.Th>{t('warehouse.fields.address')}</Table.Th>
                  <Table.Th>{t('warehouse.fields.type')}</Table.Th>
                  <Table.Th>{t('warehouse.fields.positions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(warehouses as any[]).map((w: any) => (
                  <Table.Tr key={w.id}>
                    <Table.Td><strong>{w.name}</strong></Table.Td>
                    <Table.Td>{w.address || '-'}</Table.Td>
                    <Table.Td>{w.isMain ? <Badge color="blue">{t('warehouse.main')}</Badge> : '-'}</Table.Td>
                    <Table.Td>{w._count?.stockBalances || 0}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="movements" pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('warehouse.fields.date')}</Table.Th>
                <Table.Th>{t('warehouse.fields.warehouse')}</Table.Th>
                <Table.Th>{t('warehouse.fields.product')}</Table.Th>
                <Table.Th>{t('warehouse.fields.quantity')}</Table.Th>
                <Table.Th>{t('warehouse.fields.reason')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(movements as any[]).map((m: any) => (
                <Table.Tr key={m.id}>
                  <Table.Td>{new Date(m.createdAt).toLocaleString()}</Table.Td>
                  <Table.Td>{m.warehouse?.name}</Table.Td>
                  <Table.Td>{m.product?.name}</Table.Td>
                  <Table.Td><Badge color={m.delta > 0 ? 'green' : 'red'}>{m.delta > 0 ? '+' : ''}{m.delta}</Badge></Table.Td>
                  <Table.Td>{m.reason}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="batches" pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('warehouse.fields.number')}</Table.Th>
                <Table.Th>{t('warehouse.fields.product')}</Table.Th>
                <Table.Th>{t('warehouse.fields.quantity')}</Table.Th>
                <Table.Th>{t('warehouse.fields.costPrice')}</Table.Th>
                <Table.Th>{t('warehouse.fields.expiryDate')}</Table.Th>
                <Table.Th>{t('warehouse.fields.date')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(batches as any[]).map((b: any) => (
                <Table.Tr key={b.id}>
                  <Table.Td><strong>{b.batchNo}</strong></Table.Td>
                  <Table.Td>{b.product?.name}</Table.Td>
                  <Table.Td>{b.quantity}</Table.Td>
                  <Table.Td>{b.costPrice.toFixed(2)}</Table.Td>
                  <Table.Td>{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '-'}</Table.Td>
                  <Table.Td>{new Date(b.createdAt).toLocaleDateString()}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={whModal} onClose={() => setWhModal(false)} title={t('warehouse.newWarehouse')}>
        <Stack>
          <TextInput label={t('warehouse.fields.name')} value={whData.name} onChange={e => setWhData({ ...whData, name: e.currentTarget.value })} required />
          <TextInput label={t('warehouse.fields.address')} value={whData.address} onChange={e => setWhData({ ...whData, address: e.currentTarget.value })} />
          <Button onClick={() => createWhMut.mutate(whData)} loading={createWhMut.isPending}>{t('warehouse.create')}</Button>
        </Stack>
      </Modal>

      <Modal opened={transferModal} onClose={() => setTransferModal(false)} title={t('warehouse.newMovement')}>
        <Stack>
          <Select label={t('warehouse.fields.from')} data={whOptions} value={transferData.fromWarehouseId ? String(transferData.fromWarehouseId) : null} onChange={(v: string | null) => setTransferData({ ...transferData, fromWarehouseId: v ? +v : 0 })} required />
          <Select label={t('warehouse.fields.to')} data={whOptions} value={transferData.toWarehouseId ? String(transferData.toWarehouseId) : null} onChange={(v: string | null) => setTransferData({ ...transferData, toWarehouseId: v ? +v : 0 })} required />
          <Select label={t('warehouse.fields.product')} data={productOptions} value={transferData.productId ? String(transferData.productId) : null} onChange={(v: string | null) => setTransferData({ ...transferData, productId: v ? +v : 0 })} required searchable />
          <NumberInput label={t('warehouse.fields.quantity')} value={transferData.quantity} onChange={(v: any) => setTransferData({ ...transferData, quantity: Number(v) || 1 })} min={1} required />
          <Button onClick={() => transferMut.mutate(transferData)} loading={transferMut.isPending} disabled={!transferData.fromWarehouseId || !transferData.toWarehouseId || !transferData.productId}>
            {t('warehouse.move')}
          </Button>
        </Stack>
      </Modal>

      <Modal opened={batchModal} onClose={() => setBatchModal(false)} title={t('warehouse.newBatch')}>
        <Stack>
          <Select label={t('warehouse.fields.product')} data={productOptions} value={batchData.productId ? String(batchData.productId) : null} onChange={(v: string | null) => setBatchData({ ...batchData, productId: v ? +v : 0 })} required searchable />
          <TextInput label={t('warehouse.fields.batchNo')} value={batchData.batchNo} onChange={e => setBatchData({ ...batchData, batchNo: e.currentTarget.value })} required />
          <NumberInput label={t('warehouse.fields.quantity')} value={batchData.quantity} onChange={(v: any) => setBatchData({ ...batchData, quantity: Number(v) || 0 })} required />
          <NumberInput label={t('warehouse.fields.costPrice')} value={batchData.costPrice} onChange={(v: any) => setBatchData({ ...batchData, costPrice: Number(v) || 0 })} required />
          <DatePickerInput label={t('warehouse.fields.expiryDate')} value={batchData.expiryDate} onChange={(d: any) => setBatchData({ ...batchData, expiryDate: d })} clearable />
          <Button onClick={() => createBatchMut.mutate({ ...batchData, expiryDate: batchData.expiryDate?.toISOString() })} loading={createBatchMut.isPending} disabled={!batchData.productId || !batchData.batchNo}>
            {t('warehouse.create')}
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
