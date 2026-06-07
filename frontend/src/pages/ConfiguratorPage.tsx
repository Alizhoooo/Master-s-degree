import React, { useState } from 'react';
import { Container, Title, Group, Tabs, Button, Table, Modal, TextInput, Select, Textarea, Stack, Badge, Code, ScrollArea } from '@mantine/core';
import { IconPlus, IconDownload, IconSettings, IconFileText } from '@tabler/icons-react';
import { listConfigObjects, createConfigObject, listPrintTemplates, createPrintTemplate, exportConfig, seedPermissions, seedSystemRoles, listPermissions } from '../api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export default function ConfiguratorPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('objects');
  const [objModal, setObjModal] = useState(false);
  const [ptModal, setPtModal] = useState(false);
  const [objData, setObjData] = useState({ kind: 'Document', name: '', description: '', schema: '{}' });
  const [ptData, setPtData] = useState({ name: '', documentType: 'Sale', template: '{}', isDefault: false });

  const { data: objects = [] } = useQuery({ queryKey: ['configObjects'], queryFn: listConfigObjects as any });
  const { data: templates = [] } = useQuery({ queryKey: ['printTemplates'], queryFn: listPrintTemplates as any });
  const { data: permissions = [] } = useQuery({ queryKey: ['permissions'], queryFn: listPermissions as any });

  const createObjMut = useMutation({ mutationFn: () => createConfigObject({ ...objData, schema: JSON.parse(objData.schema) }), onSuccess: () => setObjModal(false) });
  const createPtMut = useMutation({ mutationFn: () => createPrintTemplate({ ...ptData, template: JSON.parse(ptData.template) }), onSuccess: () => setPtModal(false) });

  const handleExport = async () => {
    const data = await exportConfig();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();
  };

  const kindOptions = [
    { value: 'Document', label: t('enum.configKind.Document') },
    { value: 'Register', label: t('enum.configKind.Register') },
    { value: 'Catalog', label: t('enum.configKind.Catalog') },
    { value: 'Report', label: t('enum.configKind.Report') },
    { value: 'Processing', label: t('enum.configKind.Processing') },
  ];

  const docTypeOptions = [
    { value: 'Sale', label: t('enum.docType.Sale') },
    { value: 'Purchase', label: t('enum.docType.Purchase') },
    { value: 'CustomerInvoice', label: t('enum.docType.CustomerInvoice') },
    { value: 'SupplierInvoice', label: t('enum.docType.SupplierInvoice') },
    { value: 'Order', label: t('enum.docType.Order') },
    { value: 'CashOrder', label: t('enum.docType.CashOrder') },
    { value: 'BankOrder', label: t('enum.docType.BankOrder') },
  ];

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('configurator.title')}</Title>
        <Group>
          <Button leftSection={<IconDownload size={14} />} variant="light" onClick={handleExport}>{t('configurator.export')}</Button>
        </Group>
      </Group>

      <Tabs value={tab} onChange={(v: any) => setTab(v || 'objects')}>
        <Tabs.List>
          <Tabs.Tab value="objects" leftSection={<IconSettings size={14} />}>{t('configurator.objects')}</Tabs.Tab>
          <Tabs.Tab value="templates" leftSection={<IconFileText size={14} />}>{t('configurator.templates')}</Tabs.Tab>
          <Tabs.Tab value="permissions">{t('configurator.permissions')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="objects" pt="md">
          <Group justify="flex-end" mb="sm">
            <Button leftSection={<IconPlus size={14} />} onClick={() => setObjModal(true)}>{t('configurator.newObject')}</Button>
          </Group>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('configurator.fields.kind')}</Table.Th>
                <Table.Th>{t('configurator.fields.name')}</Table.Th>
                <Table.Th>{t('configurator.fields.description')}</Table.Th>
                <Table.Th>{t('configurator.fields.version')}</Table.Th>
                <Table.Th>{t('configurator.fields.active')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(objects as any[]).map((o: any) => (
                <Table.Tr key={o.id}>
                  <Table.Td><Badge>{t(`enum.configKind.${o.kind}`, o.kind) as string}</Badge></Table.Td>
                  <Table.Td><strong>{o.name}</strong></Table.Td>
                  <Table.Td>{o.description || '-'}</Table.Td>
                  <Table.Td>{o.version}</Table.Td>
                  <Table.Td>{o.isActive ? <Badge color="green">{t('configurator.fields.active')}</Badge> : '-'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="templates" pt="md">
          <Group justify="flex-end" mb="sm">
            <Button leftSection={<IconPlus size={14} />} onClick={() => setPtModal(true)}>{t('configurator.newTemplate')}</Button>
          </Group>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('configurator.fields.name')}</Table.Th>
                <Table.Th>{t('configurator.fields.documentType')}</Table.Th>
                <Table.Th>{t('configurator.fields.isDefault')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(templates as any[]).map((tpl: any) => (
                <Table.Tr key={tpl.id}>
                  <Table.Td><strong>{tpl.name}</strong></Table.Td>
                  <Table.Td><Badge>{t(`enum.docType.${tpl.documentType}`, tpl.documentType) as string}</Badge></Table.Td>
                  <Table.Td>{tpl.isDefault ? <Badge color="blue">{t('common.yes')}</Badge> : '-'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="permissions" pt="md">
          <Group mb="sm">
            <Button onClick={() => seedPermissions()} variant="light">{t('configurator.seedPermissions')}</Button>
            <Button onClick={() => seedSystemRoles()} variant="light">{t('configurator.seedRoles')}</Button>
          </Group>
          <ScrollArea h={500}>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('configurator.fields.key')}</Table.Th>
                  <Table.Th>{t('configurator.fields.resource')}</Table.Th>
                  <Table.Th>{t('configurator.fields.action')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(permissions as any[]).map((p: any) => (
                  <Table.Tr key={p.id}>
                    <Table.Td><Code>{p.key}</Code></Table.Td>
                    <Table.Td>{p.resource || '-'}</Table.Td>
                    <Table.Td>{p.action || '-'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={objModal} onClose={() => setObjModal(false)} title={t('configurator.newObjectConfig')} size="lg">
        <Stack>
          <Select label={t('configurator.fields.kind')} data={kindOptions} value={objData.kind} onChange={(v: string | null) => setObjData({ ...objData, kind: v || 'Document' })} />
          <TextInput label={t('configurator.fields.name')} value={objData.name} onChange={e => setObjData({ ...objData, name: e.currentTarget.value })} required />
          <Textarea label={t('configurator.fields.description')} value={objData.description} onChange={e => setObjData({ ...objData, description: e.currentTarget.value })} />
          <Textarea label={t('configurator.fields.schema')} value={objData.schema} onChange={e => setObjData({ ...objData, schema: e.currentTarget.value })} autosize minRows={4} />
          <Button onClick={() => createObjMut.mutate()} loading={createObjMut.isPending}>{t('configurator.create')}</Button>
        </Stack>
      </Modal>

      <Modal opened={ptModal} onClose={() => setPtModal(false)} title={t('configurator.newPrintTemplate')} size="lg">
        <Stack>
          <TextInput label={t('configurator.fields.name')} value={ptData.name} onChange={e => setPtData({ ...ptData, name: e.currentTarget.value })} required />
          <Select label={t('configurator.fields.documentType')} data={docTypeOptions} value={ptData.documentType} onChange={(v: string | null) => setPtData({ ...ptData, documentType: v || 'Sale' })} />
          <Textarea label={t('configurator.fields.template')} value={ptData.template} onChange={e => setPtData({ ...ptData, template: e.currentTarget.value })} autosize minRows={4} />
          <Button onClick={() => createPtMut.mutate()} loading={createPtMut.isPending}>{t('configurator.create')}</Button>
        </Stack>
      </Modal>
    </Container>
  );
}
