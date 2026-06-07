import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container, Title, Group, Button, Table, Modal, TextInput, Select, NumberInput, Stack, Badge, Text,
  Tabs, Card, SimpleGrid, ActionIcon, Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconEdit, IconArchive, IconBarcode, IconCategory, IconBoxSeam, IconHistory } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '../api';
import { searchProducts, getLowStockProducts, getProductCategories, getProductBatches, getProductStock, getProductPriceHistory, createProduct, updateProduct, archiveProduct } from '../api/nomenclature';
import { TableSkeleton } from '../components/Skeleton';
import { notifications } from '../components/Notifications';
import PageHeader from '../components/PageHeader';

const PRODUCT_TYPES = ['Goods', 'Service', 'Material', 'Product', 'SemiFinished'];
const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB'];

export default function NomenclaturePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [detailProduct, setDetailProduct] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm());

  function emptyForm() {
    return {
      sku: '', artikul: '', barcode: '', name: '', description: '',
      category: '', type: 'Goods', unit: 'шт',
      unitPrice: 0, costPrice: 0, markup: 0, currency: 'KZT',
      quantityOnHand: 0, reorderPoint: 0, minStock: 0, maxStock: 0,
      vatRate: 0, weight: 0, volume: 0,
      manufacturer: '', country: '', imageUrl: '',
      storageLifeDays: 0, isActive: true,
    };
  }

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['nomenclature-products', search, category],
    queryFn: () => search ? searchProducts(search) : getProducts(),
  });
  const { data: lowStock = [] } = useQuery({ queryKey: ['low-stock'], queryFn: getLowStockProducts });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getProductCategories });
  const { data: batches = [] } = useQuery({
    queryKey: ['product-batches', detailProduct?.id],
    queryFn: () => detailProduct ? getProductBatches(detailProduct.id) : Promise.resolve([]),
    enabled: !!detailProduct,
  });
  const { data: stockByWh = [] } = useQuery({
    queryKey: ['product-stock', detailProduct?.id],
    queryFn: () => detailProduct ? getProductStock(detailProduct.id) : Promise.resolve([]),
    enabled: !!detailProduct,
  });
  const { data: priceHist = [] } = useQuery({
    queryKey: ['product-price', detailProduct?.id],
    queryFn: () => detailProduct ? getProductPriceHistory(detailProduct.id) : Promise.resolve([]),
    enabled: !!detailProduct,
  });

  const createMut = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nomenclature-products'] });
      qc.invalidateQueries({ queryKey: ['low-stock'] });
      setCreateOpen(false);
      setForm(emptyForm());
      notifications.show({ title: t('common.success'), message: t('nomenclature.successCreated'), color: 'green' });
    },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateProduct(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nomenclature-products'] });
      setEditProduct(null);
      notifications.show({ title: t('common.success'), message: t('nomenclature.successUpdated'), color: 'green' });
    },
  });
  const archiveMut = useMutation({
    mutationFn: archiveProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nomenclature-products'] });
      notifications.show({ title: t('common.success'), message: t('nomenclature.successArchived'), color: 'yellow' });
    },
  });

  const list = Array.isArray(products) ? products : [];
  const filtered = category ? list.filter((p: any) => p.category === category) : list;
  const categoryOptions = (Array.isArray(categories) ? categories : []).map((c: any) => ({ value: c, label: c }));
  const typeOptions = PRODUCT_TYPES.map((tp) => ({ value: tp, label: t(`enum.productType.${tp}`) }));
  const currencyOptions = CURRENCIES.map((c) => ({ value: c, label: c }));

  const openCreate = () => { setForm(emptyForm()); setCreateOpen(true); };
  const openEdit = (p: any) => {
    setForm({ ...p, markup: p.markup || 0, storageLifeDays: p.storageLifeDays || 0, vatRate: p.vatRate || 0 });
    setEditProduct(p);
  };
  const submitCreate = () => createMut.mutate(form);
  const submitEdit = () => editProduct && updateMut.mutate({ id: editProduct.id, data: form });

  return (
    <Container size="xl" px={0}>
      <PageHeader
        title={t('nomenclature.title')}
        description={t('nomenclature.subtitle')}
        icon={IconCategory}
        actions={
          <Group>
            <TextInput
              placeholder={t('nomenclature.search')}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              leftSection={<IconBarcode size={14} />}
              w={260}
            />
            <Select placeholder={t('nomenclature.categories')} data={categoryOptions} value={category} onChange={setCategory} clearable w={180} leftSection={<IconCategory size={14} />} />
            <Button leftSection={<IconPlus size={14} />} onClick={openCreate} className="gradient-button">
              {t('nomenclature.create')}
            </Button>
          </Group>
        }
      />

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="md">
        <Card withBorder><Text size="xs" c="dimmed">{t('common.total')}</Text><Text size="xl" fw={700}>{list.length}</Text></Card>
        <Card withBorder><Text size="xs" c="dimmed">{t('nomenclature.lowStock')}</Text><Text size="xl" fw={700} c="red">{(lowStock as any[]).length}</Text></Card>
        <Card withBorder><Text size="xs" c="dimmed">{t('nomenclature.categories')}</Text><Text size="xl" fw={700}>{(categories as any[]).length}</Text></Card>
        <Card withBorder><Text size="xs" c="dimmed">{t('enum.docStatus.Active')}</Text><Text size="xl" fw={700} c="green">{list.filter((p: any) => p.isActive !== false).length}</Text></Card>
      </SimpleGrid>

      {isLoading ? <TableSkeleton rows={8} cols={6} /> : (
        <Table striped withTableBorder highlightOnHover className="sf-table">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('nomenclature.fields.sku')}</Table.Th>
              <Table.Th>{t('nomenclature.fields.name')}</Table.Th>
              <Table.Th>{t('nomenclature.fields.category')}</Table.Th>
              <Table.Th>{t('nomenclature.fields.type')}</Table.Th>
              <Table.Th>{t('nomenclature.fields.unitPrice')}</Table.Th>
              <Table.Th>{t('nomenclature.fields.quantityOnHand')}</Table.Th>
              <Table.Th>{t('common.actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((p: any) => {
              const low = (p.quantityOnHand || 0) <= (p.reorderPoint || p.minStock || 0);
              return (
                <Table.Tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setDetailProduct(p)}>
                  <Table.Td><code>{p.sku}</code></Table.Td>
                  <Table.Td>
                    <Text fw={500}>{p.name}</Text>
                    {p.artikul && <Text size="xs" c="dimmed">{t('nomenclature.artikulLabel')} {p.artikul}</Text>}
                  </Table.Td>
                  <Table.Td>{p.category || '-'}</Table.Td>
                  <Table.Td><Badge variant="light">{t(`enum.productType.${p.type || 'Goods'}`)}</Badge></Table.Td>
                  <Table.Td>{p.unitPrice?.toFixed(2)} {p.currency || 'KZT'}</Table.Td>
                  <Table.Td>
                    <Badge color={low ? 'red' : 'green'} variant={low ? 'filled' : 'light'}>
                      {p.quantityOnHand || 0} {low && t('nomenclature.lowStock')}
                    </Badge>
                  </Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Group gap="xs">
                      <Tooltip label={t('nomenclature.edit')}><ActionIcon variant="light" onClick={() => openEdit(p)}><IconEdit size={14} /></ActionIcon></Tooltip>
                      <Tooltip label={t('nomenclature.archive')}><ActionIcon variant="light" color="yellow" onClick={() => archiveMut.mutate(p.id)}><IconArchive size={14} /></ActionIcon></Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
            {filtered.length === 0 && <Table.Tr><Table.Td colSpan={7}><Text ta="center" c="dimmed">{t('nomenclature.noProducts')}</Text></Table.Td></Table.Tr>}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={createOpen || !!editProduct} onClose={() => { setCreateOpen(false); setEditProduct(null); }} title={editProduct ? t('nomenclature.edit') : t('nomenclature.create')} size="lg">
        <Stack>
          <SimpleGrid cols={3}>
            <TextInput label={t('nomenclature.fields.sku')} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.currentTarget.value })} required />
            <TextInput label={t('nomenclature.fields.artikul')} value={form.artikul} onChange={(e) => setForm({ ...form, artikul: e.currentTarget.value })} />
            <TextInput label={t('nomenclature.fields.barcode')} value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.currentTarget.value })} />
          </SimpleGrid>
          <TextInput label={t('nomenclature.fields.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.currentTarget.value })} required />
          <TextInput label={t('nomenclature.fields.description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.currentTarget.value })} />
          <SimpleGrid cols={3}>
            <TextInput label={t('nomenclature.fields.category')} value={form.category} onChange={(e) => setForm({ ...form, category: e.currentTarget.value })} />
            <Select label={t('nomenclature.fields.type')} data={typeOptions} value={form.type} onChange={(v) => setForm({ ...form, type: v || 'Goods' })} />
            <TextInput label={t('nomenclature.fields.unit')} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.currentTarget.value })} />
          </SimpleGrid>
          <SimpleGrid cols={4}>
            <NumberInput label={t('nomenclature.fields.unitPrice')} value={form.unitPrice} onChange={(v: any) => setForm({ ...form, unitPrice: Number(v) || 0 })} decimalScale={2} />
            <NumberInput label={t('nomenclature.fields.costPrice')} value={form.costPrice} onChange={(v: any) => setForm({ ...form, costPrice: Number(v) || 0 })} decimalScale={2} />
            <NumberInput label={t('nomenclature.fields.markup')} value={form.markup} onChange={(v: any) => setForm({ ...form, markup: Number(v) || 0 })} decimalScale={2} suffix="%" />
            <Select label={t('nomenclature.fields.currency')} data={currencyOptions} value={form.currency} onChange={(v) => setForm({ ...form, currency: v || 'KZT' })} />
          </SimpleGrid>
          <SimpleGrid cols={4}>
            <NumberInput label={t('nomenclature.fields.minStock')} value={form.minStock} onChange={(v: any) => setForm({ ...form, minStock: Number(v) || 0 })} />
            <NumberInput label={t('nomenclature.fields.maxStock')} value={form.maxStock} onChange={(v: any) => setForm({ ...form, maxStock: Number(v) || 0 })} />
            <NumberInput label={t('nomenclature.fields.reorderPoint')} value={form.reorderPoint} onChange={(v: any) => setForm({ ...form, reorderPoint: Number(v) || 0 })} />
            <NumberInput label={t('nomenclature.fields.vatRate')} value={form.vatRate} onChange={(v: any) => setForm({ ...form, vatRate: Number(v) || 0 })} suffix="%" />
          </SimpleGrid>
          <SimpleGrid cols={4}>
            <NumberInput label={t('nomenclature.fields.weight')} value={form.weight} onChange={(v: any) => setForm({ ...form, weight: Number(v) || 0 })} decimalScale={3} />
            <NumberInput label={t('nomenclature.fields.volume')} value={form.volume} onChange={(v: any) => setForm({ ...form, volume: Number(v) || 0 })} decimalScale={3} />
            <TextInput label={t('nomenclature.fields.manufacturer')} value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.currentTarget.value })} />
            <TextInput label={t('nomenclature.fields.country')} value={form.country} onChange={(e) => setForm({ ...form, country: e.currentTarget.value })} />
          </SimpleGrid>
          <SimpleGrid cols={2}>
            <TextInput label={t('nomenclature.fields.imageUrl')} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.currentTarget.value })} />
            <NumberInput label={t('nomenclature.fields.storageLifeDays')} value={form.storageLifeDays} onChange={(v: any) => setForm({ ...form, storageLifeDays: Number(v) || 0 })} />
          </SimpleGrid>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { setCreateOpen(false); setEditProduct(null); }}>{t('common.cancel')}</Button>
            <Button onClick={editProduct ? submitEdit : submitCreate} loading={createMut.isPending || updateMut.isPending}>{t('common.save')}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={!!detailProduct} onClose={() => setDetailProduct(null)} title={detailProduct?.name || ''} size="xl">
        {detailProduct && (
          <Tabs defaultValue="batches">
            <Tabs.List>
              <Tabs.Tab value="batches" leftSection={<IconBoxSeam size={14} />}>{t('nomenclature.batches')}</Tabs.Tab>
              <Tabs.Tab value="stock" leftSection={<IconBarcode size={14} />}>{t('nomenclature.stockByWarehouse')}</Tabs.Tab>
              <Tabs.Tab value="prices" leftSection={<IconHistory size={14} />}>{t('nomenclature.priceHistory')}</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="batches" pt="md">
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('nomenclature.batchNo')}</Table.Th>
                    <Table.Th>{t('nomenclature.manufacturedAt')}</Table.Th>
                    <Table.Th>{t('nomenclature.expiryDate')}</Table.Th>
                    <Table.Th>{t('common.qty')}</Table.Th>
                    <Table.Th>{t('nomenclature.daysLeft')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(batches as any[]).map((b: any) => {
                    const daysLeft = b.expiryDate ? Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / 86400000) : null;
                    return (
                      <Table.Tr key={b.id}>
                        <Table.Td><code>{b.batchNo}</code></Table.Td>
                        <Table.Td>{b.manufacturedAt ? new Date(b.manufacturedAt).toLocaleDateString() : '-'}</Table.Td>
                        <Table.Td>{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '-'}</Table.Td>
                        <Table.Td>{b.remainingQty ?? b.quantity}</Table.Td>
                        <Table.Td>
                          {daysLeft === null ? '-' : (
                            <Badge color={daysLeft < 0 ? 'red' : daysLeft <= 7 ? 'red' : daysLeft <= 30 ? 'yellow' : 'green'}>
                              {daysLeft < 0 ? t('common.expired') : `${daysLeft}d`}
                            </Badge>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                  {(batches as any[]).length === 0 && <Table.Tr><Table.Td colSpan={5}><Text ta="center" c="dimmed">-</Text></Table.Td></Table.Tr>}
                </Table.Tbody>
              </Table>
            </Tabs.Panel>
            <Tabs.Panel value="stock" pt="md">
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('common.warehouse')}</Table.Th>
                    <Table.Th>{t('common.qty')}</Table.Th>
                    <Table.Th>{t('inventory.reserved')}</Table.Th>
                    <Table.Th>{t('inventory.available')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(stockByWh as any[]).map((s: any) => (
                    <Table.Tr key={s.warehouseId}>
                      <Table.Td>{s.warehouseName || s.warehouse?.name || `#${s.warehouseId}`}</Table.Td>
                      <Table.Td>{s.quantity}</Table.Td>
                      <Table.Td>{s.reserved || 0}</Table.Td>
                      <Table.Td><Badge color="green">{(s.quantity || 0) - (s.reserved || 0)}</Badge></Table.Td>
                    </Table.Tr>
                  ))}
                  {(stockByWh as any[]).length === 0 && <Table.Tr><Table.Td colSpan={4}><Text ta="center" c="dimmed">-</Text></Table.Td></Table.Tr>}
                </Table.Tbody>
              </Table>
            </Tabs.Panel>
            <Tabs.Panel value="prices" pt="md">
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('common.date')}</Table.Th>
                    <Table.Th>{t('nomenclature.fields.unitPrice')}</Table.Th>
                    <Table.Th>{t('nomenclature.fields.costPrice')}</Table.Th>
                    <Table.Th>{t('nomenclature.fields.markup')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(priceHist as any[]).map((h: any, i: number) => (
                    <Table.Tr key={i}>
                      <Table.Td>{h.changedAt ? new Date(h.changedAt).toLocaleString() : '-'}</Table.Td>
                      <Table.Td>{h.unitPrice?.toFixed(2)}</Table.Td>
                      <Table.Td>{h.costPrice?.toFixed(2)}</Table.Td>
                      <Table.Td>{h.markup?.toFixed(1)}%</Table.Td>
                    </Table.Tr>
                  ))}
                  {(priceHist as any[]).length === 0 && <Table.Tr><Table.Td colSpan={4}><Text ta="center" c="dimmed">-</Text></Table.Td></Table.Tr>}
                </Table.Tbody>
              </Table>
            </Tabs.Panel>
          </Tabs>
        )}
      </Modal>
    </Container>
  );
}
