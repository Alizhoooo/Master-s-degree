import React, { useState } from 'react';
import { Container, Title, Group, Tabs, Button, Table, Modal, TextInput, Select, Textarea, Stack, Badge, Code, ScrollArea } from '@mantine/core';
import { IconPlus, IconDownload, IconSettings, IconFileText } from '@tabler/icons-react';
import { listConfigObjects, createConfigObject, listPrintTemplates, createPrintTemplate, exportConfig, seedPermissions, seedSystemRoles, listPermissions } from '../api';
import { useQuery, useMutation } from '@tanstack/react-query';

export default function ConfiguratorPage() {
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

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>Конфигуратор</Title>
        <Group>
          <Button leftSection={<IconDownload size={14} />} variant="light" onClick={handleExport}>Экспорт</Button>
        </Group>
      </Group>

      <Tabs value={tab} onChange={(v: any) => setTab(v || 'objects')}>
        <Tabs.List>
          <Tabs.Tab value="objects" leftSection={<IconSettings size={14} />}>Объекты</Tabs.Tab>
          <Tabs.Tab value="templates" leftSection={<IconFileText size={14} />}>Печатные формы</Tabs.Tab>
          <Tabs.Tab value="permissions">Разрешения</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="objects" pt="md">
          <Group justify="flex-end" mb="sm">
            <Button leftSection={<IconPlus size={14} />} onClick={() => setObjModal(true)}>Новый объект</Button>
          </Group>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Вид</Table.Th>
                <Table.Th>Имя</Table.Th>
                <Table.Th>Описание</Table.Th>
                <Table.Th>Версия</Table.Th>
                <Table.Th>Активен</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(objects as any[]).map((o: any) => (
                <Table.Tr key={o.id}>
                  <Table.Td><Badge>{o.kind}</Badge></Table.Td>
                  <Table.Td><strong>{o.name}</strong></Table.Td>
                  <Table.Td>{o.description || '-'}</Table.Td>
                  <Table.Td>{o.version}</Table.Td>
                  <Table.Td>{o.isActive ? <Badge color="green">Активен</Badge> : '-'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="templates" pt="md">
          <Group justify="flex-end" mb="sm">
            <Button leftSection={<IconPlus size={14} />} onClick={() => setPtModal(true)}>Новый шаблон</Button>
          </Group>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Название</Table.Th>
                <Table.Th>Тип документа</Table.Th>
                <Table.Th>По умолчанию</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(templates as any[]).map((t: any) => (
                <Table.Tr key={t.id}>
                  <Table.Td><strong>{t.name}</strong></Table.Td>
                  <Table.Td><Badge>{t.documentType}</Badge></Table.Td>
                  <Table.Td>{t.isDefault ? <Badge color="blue">Да</Badge> : '-'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="permissions" pt="md">
          <Group mb="sm">
            <Button onClick={() => seedPermissions()} variant="light">Загрузить стандартные разрешения</Button>
            <Button onClick={() => seedSystemRoles()} variant="light">Загрузить стандартные роли</Button>
          </Group>
          <ScrollArea h={500}>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Ключ</Table.Th>
                  <Table.Th>Ресурс</Table.Th>
                  <Table.Th>Действие</Table.Th>
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

      <Modal opened={objModal} onClose={() => setObjModal(false)} title="Новый объект конфигурации" size="lg">
        <Stack>
          <Select label="Вид" data={['Document', 'Register', 'Catalog', 'Report', 'Processing']} value={objData.kind} onChange={(v: string | null) => setObjData({ ...objData, kind: v || 'Document' })} />
          <TextInput label="Имя" value={objData.name} onChange={e => setObjData({ ...objData, name: e.currentTarget.value })} required />
          <Textarea label="Описание" value={objData.description} onChange={e => setObjData({ ...objData, description: e.currentTarget.value })} />
          <Textarea label="Схема (JSON)" value={objData.schema} onChange={e => setObjData({ ...objData, schema: e.currentTarget.value })} autosize minRows={4} />
          <Button onClick={() => createObjMut.mutate()} loading={createObjMut.isPending}>Создать</Button>
        </Stack>
      </Modal>

      <Modal opened={ptModal} onClose={() => setPtModal(false)} title="Новый шаблон печати" size="lg">
        <Stack>
          <TextInput label="Название" value={ptData.name} onChange={e => setPtData({ ...ptData, name: e.currentTarget.value })} required />
          <Select label="Тип документа" data={['Sale', 'Purchase', 'CustomerInvoice', 'SupplierInvoice', 'Order', 'CashOrder', 'BankOrder']} value={ptData.documentType} onChange={(v: string | null) => setPtData({ ...ptData, documentType: v || 'Sale' })} />
          <Textarea label="Шаблон (JSON)" value={ptData.template} onChange={e => setPtData({ ...ptData, template: e.currentTarget.value })} autosize minRows={4} />
          <Button onClick={() => createPtMut.mutate()} loading={createPtMut.isPending}>Создать</Button>
        </Stack>
      </Modal>
    </Container>
  );
}
