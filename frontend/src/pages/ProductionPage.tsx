import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Title, Group, Tabs, Button, Table, Modal, TextInput, Select, NumberInput, Stack, Badge, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconBuildingFactory, IconClipboardList, IconSettings } from '@tabler/icons-react';
import { listWorkshops, createWorkshop, listTechCards, createTechCard, listProductionOrders, createProductionOrder, startProductionOrder, completeProductionOrder, getProducts, listEmployees } from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableSkeleton } from '../components/Skeleton';
import { statusLabel, enumLabel } from '../i18n/enumLabel';

export default function ProductionPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState('orders');
  const [whModal, setWhModal] = useState(false);
  const [tcModal, setTcModal] = useState(false);
  const [poModal, setPoModal] = useState(false);
  const [whData, setWhData] = useState({ name: '' });
  const [tcData, setTcData] = useState({ name: '', outputProductId: 0, outputQuantity: 1, inputs: [] as any[] });
  const [poData, setPoData] = useState({ techCardId: 0, workshopId: 0, quantity: 1, plannedDate: new Date() });

  const { data: workshops = [] } = useQuery({ queryKey: ['workshops'], queryFn: listWorkshops });
  const { data: techCards = [] } = useQuery({ queryKey: ['techCards'], queryFn: listTechCards });
  const { data: orders = [] } = useQuery({ queryKey: ['productionOrders'], queryFn: () => listProductionOrders() });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: getProducts });

  const createWhMut = useMutation({ mutationFn: () => createWorkshop(whData), onSuccess: () => { qc.invalidateQueries({ queryKey: ['workshops'] }); setWhModal(false); } });
  const createTcMut = useMutation({ mutationFn: () => createTechCard(tcData), onSuccess: () => { qc.invalidateQueries({ queryKey: ['techCards'] }); setTcModal(false); } });
  const createPoMut = useMutation({ mutationFn: () => createProductionOrder({ ...poData, plannedDate: poData.plannedDate.toISOString() }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['productionOrders'] }); setPoModal(false); } });
  const startMut = useMutation({ mutationFn: startProductionOrder, onSuccess: () => qc.invalidateQueries({ queryKey: ['productionOrders'] }) });
  const completeMut = useMutation({ mutationFn: completeProductionOrder, onSuccess: () => qc.invalidateQueries({ queryKey: ['productionOrders'] }) });

  const productOptions = (products as any[]).map((p: any) => ({ value: String(p.id), label: `${p.name} (${p.sku})` }));
  const whOptions = (workshops as any[]).map((w: any) => ({ value: String(w.id), label: w.name }));
  const tcOptions = (techCards as any[]).map((t: any) => ({ value: String(t.id), label: t.name }));

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('production.title')}</Title>
        <Group>
          {tab === 'workshops' && <Button leftSection={<IconPlus size={14} />} onClick={() => setWhModal(true)}>{t('production.newWorkshop')}</Button>}
          {tab === 'techcards' && <Button leftSection={<IconPlus size={14} />} onClick={() => setTcModal(true)}>{t('production.newTechCard')}</Button>}
          {tab === 'orders' && <Button leftSection={<IconPlus size={14} />} onClick={() => setPoModal(true)} disabled={workshops.length === 0 || techCards.length === 0}>{t('production.newOrder')}</Button>}
        </Group>
      </Group>

      <Tabs value={tab} onChange={(v: any) => setTab(v || 'orders')}>
        <Tabs.List>
          <Tabs.Tab value="orders" leftSection={<IconClipboardList size={14} />}>{t('production.orders')}</Tabs.Tab>
          <Tabs.Tab value="techcards" leftSection={<IconSettings size={14} />}>{t('production.techCards')}</Tabs.Tab>
          <Tabs.Tab value="workshops" leftSection={<IconBuildingFactory size={14} />}>{t('production.workshops')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="orders" pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('production.fields.number')}</Table.Th>
                <Table.Th>{t('production.fields.techCard')}</Table.Th>
                <Table.Th>{t('production.fields.workshop')}</Table.Th>
                <Table.Th>{t('production.fields.quantity')}</Table.Th>
                <Table.Th>{t('production.fields.plannedDate')}</Table.Th>
                <Table.Th>{t('production.fields.status')}</Table.Th>
                <Table.Th>{t('production.fields.actions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(orders as any[]).map((o: any) => (
                <Table.Tr key={o.id}>
                  <Table.Td><strong>{o.number}</strong></Table.Td>
                  <Table.Td>{o.techCard?.name}</Table.Td>
                  <Table.Td>{o.workshop?.name}</Table.Td>
                  <Table.Td>{o.quantity}</Table.Td>
                  <Table.Td>{new Date(o.plannedDate).toLocaleDateString()}</Table.Td>
                  <Table.Td><Badge>{statusLabel(o.status)}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {o.status === 'Planned' && <Button size="xs" variant="light" onClick={() => startMut.mutate(o.id)}>{t('production.start')}</Button>}
                      {o.status === 'InProgress' && <Button size="xs" color="green" onClick={() => completeMut.mutate(o.id)}>{t('production.complete')}</Button>}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="techcards" pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('production.fields.name')}</Table.Th>
                <Table.Th>{t('production.fields.product')}</Table.Th>
                <Table.Th>{t('production.fields.output')}</Table.Th>
                <Table.Th>{t('production.fields.materials')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(techCards as any[]).map((t: any) => (
                <Table.Tr key={t.id}>
                  <Table.Td><strong>{t.name}</strong></Table.Td>
                  <Table.Td>{t.outputProduct?.name}</Table.Td>
                  <Table.Td>{t.outputQuantity}</Table.Td>
                  <Table.Td>{t.inputs?.length || 0}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="workshops" pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr><Table.Th>{t('production.fields.name')}</Table.Th><Table.Th>{t('production.fields.head')}</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(workshops as any[]).map((w: any) => (
                <Table.Tr key={w.id}>
                  <Table.Td><strong>{w.name}</strong></Table.Td>
                  <Table.Td>{w.head?.fullName || '-'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={whModal} onClose={() => setWhModal(false)} title={t('production.newWorkshop')}>
        <Stack>
          <TextInput label={t('production.fields.name')} value={whData.name} onChange={e => setWhData({ ...whData, name: e.currentTarget.value })} required />
          <Button onClick={() => createWhMut.mutate()} loading={createWhMut.isPending}>{t('production.create')}</Button>
        </Stack>
      </Modal>

      <Modal opened={tcModal} onClose={() => setTcModal(false)} title={t('production.newTechCard')} size="lg">
        <Stack>
          <TextInput label={t('production.fields.name')} value={tcData.name} onChange={e => setTcData({ ...tcData, name: e.currentTarget.value })} required />
          <Select label={t('production.fields.outputProduct')} data={productOptions} value={tcData.outputProductId ? String(tcData.outputProductId) : null} onChange={(v: string | null) => setTcData({ ...tcData, outputProductId: v ? +v : 0 })} required searchable />
          <NumberInput label={t('production.fields.outputQty')} value={tcData.outputQuantity} onChange={(v: any) => setTcData({ ...tcData, outputQuantity: Number(v) || 1 })} min={1} required />
          <Text size="sm" c="dimmed">{t('production.materialsHint')}</Text>
          <Button onClick={() => createTcMut.mutate()} loading={createTcMut.isPending} disabled={!tcData.name || !tcData.outputProductId}>{t('production.create')}</Button>
        </Stack>
      </Modal>

      <Modal opened={poModal} onClose={() => setPoModal(false)} title={t('production.newOrder')}>
        <Stack>
          <Select label={t('production.fields.techCard')} data={tcOptions} value={poData.techCardId ? String(poData.techCardId) : null} onChange={(v: string | null) => setPoData({ ...poData, techCardId: v ? +v : 0 })} required />
          <Select label={t('production.fields.workshop')} data={whOptions} value={poData.workshopId ? String(poData.workshopId) : null} onChange={(v: string | null) => setPoData({ ...poData, workshopId: v ? +v : 0 })} required />
          <NumberInput label={t('production.fields.quantity')} value={poData.quantity} onChange={(v: any) => setPoData({ ...poData, quantity: Number(v) || 1 })} min={1} required />
          <DatePickerInput label={t('production.fields.plannedDate')} value={poData.plannedDate} onChange={(d: any) => setPoData({ ...poData, plannedDate: d || new Date() })} required />
          <Button onClick={() => createPoMut.mutate()} loading={createPoMut.isPending} disabled={!poData.techCardId || !poData.workshopId}>{t('production.create')}</Button>
        </Stack>
      </Modal>
    </Container>
  );
}
