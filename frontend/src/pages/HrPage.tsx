import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Title, Group, Tabs, Button, Table, Modal, TextInput, Select, NumberInput, Stack, Badge } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconUsers, IconClock, IconCash } from '@tabler/icons-react';
import { listEmployees, createEmployee, listTimesheets, upsertTimesheet, listPayroll, calculatePayroll, payPayroll } from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enumLabel } from '../i18n/enumLabel';

export default function HrPage() {
  const { t } = useTranslation();
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
        <Title order={3}>{t('hr.title')}</Title>
        <Group>
          {tab === 'employees' && <Button leftSection={<IconPlus size={14} />} onClick={() => setEmpModal(true)}>{t('hr.newEmployee')}</Button>}
          {tab === 'timesheets' && <Button leftSection={<IconPlus size={14} />} onClick={() => setTsModal(true)}>{t('hr.newTimesheet')}</Button>}
          {tab === 'payroll' && (
            <>
              <TextInput value={payPeriod} onChange={e => setPayPeriod(e.currentTarget.value)} placeholder="YYYY-MM" />
              <Button onClick={() => calcPayMut.mutate()} loading={calcPayMut.isPending}>{t('hr.calcPayroll')}</Button>
            </>
          )}
        </Group>
      </Group>

      <Tabs value={tab} onChange={(v: any) => setTab(v || 'employees')}>
        <Tabs.List>
          <Tabs.Tab value="employees" leftSection={<IconUsers size={14} />}>{t('hr.employees')}</Tabs.Tab>
          <Tabs.Tab value="timesheets" leftSection={<IconClock size={14} />}>{t('hr.timesheets')}</Tabs.Tab>
          <Tabs.Tab value="payroll" leftSection={<IconCash size={14} />}>{t('hr.payroll')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="employees" pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('hr.fields.fullName')}</Table.Th>
                <Table.Th>{t('hr.fields.position')}</Table.Th>
                <Table.Th>{t('hr.fields.department')}</Table.Th>
                <Table.Th>{t('hr.fields.salary')}</Table.Th>
                <Table.Th>{t('hr.fields.hireDate')}</Table.Th>
                <Table.Th>{t('hr.fields.status')}</Table.Th>
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
                  <Table.Td>{e.isActive ? <Badge color="green">{t('hr.fields.active')}</Badge> : <Badge color="red">{t('hr.fields.fired')}</Badge>}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="timesheets" pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('hr.employee')}</Table.Th>
                <Table.Th>{t('hr.fields.date')}</Table.Th>
                <Table.Th>{t('hr.fields.hours')}</Table.Th>
                <Table.Th>{t('hr.fields.overtime')}</Table.Th>
                <Table.Th>{t('hr.fields.type')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(timesheets as any[]).slice(0, 100).map((t: any) => (
                <Table.Tr key={t.id}>
                  <Table.Td>{t.employee?.fullName}</Table.Td>
                  <Table.Td>{new Date(t.date).toLocaleDateString()}</Table.Td>
                  <Table.Td>{t.hours}</Table.Td>
                  <Table.Td>{t.overtime}</Table.Td>
                  <Table.Td>{enumLabel(t.type, 'timesheetType')}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="payroll" pt="md">
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('hr.employee')}</Table.Th>
                <Table.Th>{t('hr.baseSalary')}</Table.Th>
                <Table.Th>{t('hr.bonus')}</Table.Th>
                <Table.Th>{t('hr.tax')}</Table.Th>
                <Table.Th>{t('hr.netPay')}</Table.Th>
                <Table.Th>{t('hr.fields.status')}</Table.Th>
                <Table.Th>{t('hr.fields.actions')}</Table.Th>
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
                  <Table.Td><Badge color={p.status === 'Paid' ? 'green' : 'yellow'}>{enumLabel(p.status, 'payroll')}</Badge></Table.Td>
                  <Table.Td>
                    {p.status === 'Calculated' && <Button size="xs" onClick={() => payMut.mutate(p.id)} loading={payMut.isPending}>{t('hr.payPayroll')}</Button>}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={empModal} onClose={() => setEmpModal(false)} title={t('hr.newEmployee')} size="md">
        <Stack>
          <TextInput label={t('hr.fields.fullName')} value={empData.fullName} onChange={e => setEmpData({ ...empData, fullName: e.currentTarget.value })} required />
          <TextInput label={t('hr.fields.position')} value={empData.position} onChange={e => setEmpData({ ...empData, position: e.currentTarget.value })} required />
          <TextInput label={t('hr.fields.department')} value={empData.department} onChange={e => setEmpData({ ...empData, department: e.currentTarget.value })} required />
          <NumberInput label={t('hr.fields.salary')} value={empData.salary} onChange={(v: any) => setEmpData({ ...empData, salary: Number(v) || 0 })} required />
          <TextInput label={t('hr.fields.phone')} value={empData.phone} onChange={e => setEmpData({ ...empData, phone: e.currentTarget.value })} />
          <TextInput label={t('common.email')} value={empData.email} onChange={e => setEmpData({ ...empData, email: e.currentTarget.value })} />
          <TextInput label={t('hr.fields.inn')} value={empData.inn} onChange={e => setEmpData({ ...empData, inn: e.currentTarget.value })} />
          <DatePickerInput label={t('hr.fields.hireDate')} value={empData.hireDate} onChange={(d: any) => setEmpData({ ...empData, hireDate: d || new Date() })} required />
          <Button onClick={() => createEmpMut.mutate()} loading={createEmpMut.isPending} disabled={!empData.fullName || !empData.position}>{t('hr.create')}</Button>
        </Stack>
      </Modal>

      <Modal opened={tsModal} onClose={() => setTsModal(false)} title={t('hr.newTimesheetTitle')}>
        <Stack>
          <Select label={t('hr.employee')} data={empOptions} value={tsData.employeeId ? String(tsData.employeeId) : null} onChange={(v: string | null) => setTsData({ ...tsData, employeeId: v ? +v : 0 })} required searchable />
          <DatePickerInput label={t('hr.fields.date')} value={tsData.date} onChange={(d: any) => setTsData({ ...tsData, date: d || new Date() })} required />
          <NumberInput label={t('hr.fields.hours')} value={tsData.hours} onChange={(v: any) => setTsData({ ...tsData, hours: Number(v) || 0 })} min={0} max={24} required />
          <NumberInput label={t('hr.fields.overtime')} value={tsData.overtime} onChange={(v: any) => setTsData({ ...tsData, overtime: Number(v) || 0 })} min={0} />
          <Select label={t('hr.fields.type')} data={['Regular', 'Sick', 'Vacation', 'DayOff']} value={tsData.type} onChange={(v: string | null) => setTsData({ ...tsData, type: v || 'Regular' })} />
          <Button onClick={() => upsertTsMut.mutate()} loading={upsertTsMut.isPending} disabled={!tsData.employeeId}>{t('hr.save')}</Button>
        </Stack>
      </Modal>
    </Container>
  );
}
