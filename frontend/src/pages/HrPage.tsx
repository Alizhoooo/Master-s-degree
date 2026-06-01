import React, { useState } from 'react';
import { Container, Title, Group, Tabs, Button, Table, Modal, TextInput, Select, NumberInput, Stack, Badge } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconUsers, IconClock, IconCash } from '@tabler/icons-react';
import { listEmployees, createEmployee, listTimesheets, upsertTimesheet, listPayroll, calculatePayroll, payPayroll } from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function HrPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('employees');
  const [empModal, setEmpModal] = useState(false);
  const [tsModal, setTsModal] = useState(false);
  const [payPeriod, setPayPeriod] = useState(new Date().toISOString().substring(0, 7));
  const [empData, setEmpData] = useState({ fullName: '', position: '', department: '', salary: 0, hireDate: new Date(), phone: '', email: '', inn: '' });
  const [tsData, setTsData] = useState({ employeeId: 0, date: new Date(), hours: 8, overtime: 0, type: 'Regular' });

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => listEmployees() });
  const { data: timesheets = [] } = useQuery({ queryKey: ['timesheets'], queryFn: () => listTimesheets() });
  const { data: payroll = [] } = useQuery({ queryKey: ['payroll', payPeriod], queryFn: () => listPayroll(payPeriod) });

  const createEmpMut = useMutation({ mutationFn: () => createEmployee({ ...empData, hireDate: empData.hireDate.toISOString() }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setEmpModal(false); } });
  const upsertTsMut = useMutation({ mutationFn: () => upsertTimesheet({ ...tsData, date: tsData.date.toISOString() }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['timesheets'] }); setTsModal(false); } });
  const calcPayMut = useMutation({ mutationFn: () => calculatePayroll(payPeriod), onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }) });
  const payMut = useMutation({ mutationFn: payPayroll, onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }) });

  const empOptions = (employees as any[]).map((e: any) => ({ value: String(e.id), label: `${e.fullName} — ${e.position}` }));

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>HR / Зарплата</Title>
        <Group>
          {tab === 'employees' && <Button leftSection={<IconPlus size={14} />} onClick={() => setEmpModal(true)}>Сотрудник</Button>}
          {tab === 'timesheets' && <Button leftSection={<IconPlus size={14} />} onClick={() => setTsModal(true)}>Табель</Button>}
          {tab === 'payroll' && (
            <>
              <TextInput value={payPeriod} onChange={e => setPayPeriod(e.currentTarget.value)} placeholder="YYYY-MM" />
              <Button onClick={() => calcPayMut.mutate()} loading={calcPayMut.isPending}>Рассчитать</Button>
            </>
          )}
        </Group>
      </Group>

      <Tabs value={tab} onChange={(v: any) => setTab(v || 'employees')}>
        <Tabs.List>
          <Tabs.Tab value="employees" leftSection={<IconUsers size={14} />}>Сотрудники</Tabs.Tab>
          <Tabs.Tab value="timesheets" leftSection={<IconClock size={14} />}>Табель</Tabs.Tab>
          <Tabs.Tab value="payroll" leftSection={<IconCash size={14} />}>Зарплата</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="employees" pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ФИО</Table.Th>
                <Table.Th>Должность</Table.Th>
                <Table.Th>Отдел</Table.Th>
                <Table.Th>Оклад</Table.Th>
                <Table.Th>Принят</Table.Th>
                <Table.Th>Активен</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(employees as any[]).map((e: any) => (
                <Table.Tr key={e.id}>
                  <Table.Td><strong>{e.fullName}</strong></Table.Td>
                  <Table.Td>{e.position}</Table.Td>
                  <Table.Td>{e.department}</Table.Td>
                  <Table.Td>{e.salary.toFixed(2)}</Table.Td>
                  <Table.Td>{new Date(e.hireDate).toLocaleDateString()}</Table.Td>
                  <Table.Td>{e.isActive ? <Badge color="green">Активен</Badge> : <Badge color="red">Уволен</Badge>}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="timesheets" pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Сотрудник</Table.Th>
                <Table.Th>Дата</Table.Th>
                <Table.Th>Часы</Table.Th>
                <Table.Th>Сверхурочные</Table.Th>
                <Table.Th>Тип</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(timesheets as any[]).slice(0, 100).map((t: any) => (
                <Table.Tr key={t.id}>
                  <Table.Td>{t.employee?.fullName}</Table.Td>
                  <Table.Td>{new Date(t.date).toLocaleDateString()}</Table.Td>
                  <Table.Td>{t.hours}</Table.Td>
                  <Table.Td>{t.overtime}</Table.Td>
                  <Table.Td>{t.type}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="payroll" pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Сотрудник</Table.Th>
                <Table.Th>Оклад</Table.Th>
                <Table.Th>Сверх.</Table.Th>
                <Table.Th>Налог</Table.Th>
                <Table.Th>К выплате</Table.Th>
                <Table.Th>Статус</Table.Th>
                <Table.Th>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(payroll as any[]).map((p: any) => (
                <Table.Tr key={p.id}>
                  <Table.Td><strong>{p.employee?.fullName}</strong></Table.Td>
                  <Table.Td>{p.baseSalary.toFixed(2)}</Table.Td>
                  <Table.Td>{p.overtime.toFixed(2)}</Table.Td>
                  <Table.Td>{p.tax.toFixed(2)}</Table.Td>
                  <Table.Td><strong>{p.netPay.toFixed(2)}</strong></Table.Td>
                  <Table.Td><Badge color={p.status === 'Paid' ? 'green' : 'yellow'}>{p.status}</Badge></Table.Td>
                  <Table.Td>
                    {p.status === 'Calculated' && <Button size="xs" onClick={() => payMut.mutate(p.id)} loading={payMut.isPending}>Выплатить</Button>}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={empModal} onClose={() => setEmpModal(false)} title="Новый сотрудник" size="md">
        <Stack>
          <TextInput label="ФИО" value={empData.fullName} onChange={e => setEmpData({ ...empData, fullName: e.currentTarget.value })} required />
          <TextInput label="Должность" value={empData.position} onChange={e => setEmpData({ ...empData, position: e.currentTarget.value })} required />
          <TextInput label="Отдел" value={empData.department} onChange={e => setEmpData({ ...empData, department: e.currentTarget.value })} required />
          <NumberInput label="Оклад" value={empData.salary} onChange={(v: any) => setEmpData({ ...empData, salary: Number(v) || 0 })} required />
          <TextInput label="Телефон" value={empData.phone} onChange={e => setEmpData({ ...empData, phone: e.currentTarget.value })} />
          <TextInput label="Email" value={empData.email} onChange={e => setEmpData({ ...empData, email: e.currentTarget.value })} />
          <TextInput label="ИИН" value={empData.inn} onChange={e => setEmpData({ ...empData, inn: e.currentTarget.value })} />
          <DatePickerInput label="Дата приёма" value={empData.hireDate} onChange={(d: any) => setEmpData({ ...empData, hireDate: d || new Date() })} required />
          <Button onClick={() => createEmpMut.mutate()} loading={createEmpMut.isPending} disabled={!empData.fullName || !empData.position}>Создать</Button>
        </Stack>
      </Modal>

      <Modal opened={tsModal} onClose={() => setTsModal(false)} title="Запись табеля">
        <Stack>
          <Select label="Сотрудник" data={empOptions} value={tsData.employeeId ? String(tsData.employeeId) : null} onChange={(v: string | null) => setTsData({ ...tsData, employeeId: v ? +v : 0 })} required searchable />
          <DatePickerInput label="Дата" value={tsData.date} onChange={(d: any) => setTsData({ ...tsData, date: d || new Date() })} required />
          <NumberInput label="Часы" value={tsData.hours} onChange={(v: any) => setTsData({ ...tsData, hours: Number(v) || 0 })} min={0} max={24} required />
          <NumberInput label="Сверхурочные" value={tsData.overtime} onChange={(v: any) => setTsData({ ...tsData, overtime: Number(v) || 0 })} min={0} />
          <Select label="Тип" data={['Regular', 'Sick', 'Vacation', 'DayOff']} value={tsData.type} onChange={(v: string | null) => setTsData({ ...tsData, type: v || 'Regular' })} />
          <Button onClick={() => upsertTsMut.mutate()} loading={upsertTsMut.isPending} disabled={!tsData.employeeId}>Сохранить</Button>
        </Stack>
      </Modal>
    </Container>
  );
}
