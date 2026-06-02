import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell, Group, Text, NavLink, ActionIcon, Avatar, Menu, Box, ScrollArea, Indicator, TextInput, Kbd } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/AuthContext';
import ThemeToggle from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import AlmatyTime from '../AlmatyTime';
import GlobalSearchModal from '../GlobalSearchModal';
import { useQuery } from '@tanstack/react-query';
import { getUnreadCount, listMyTasks } from '../../api';
import {
  IconLayoutDashboard, IconShoppingCart, IconPackage, IconUsers, IconReport,
  IconRobot, IconSettings, IconLogout, IconMenu2, IconAlertCircle, IconUser,
  IconBook, IconCash, IconBuildingBank, IconBuildingWarehouse, IconBuildingFactory,
  IconUsersGroup, IconFileText, IconClipboardList, IconBell, IconClock,
  IconShield, IconSearch, IconTruckDelivery, IconFileInvoice, IconBoxSeam, IconCalendar,
  IconArrowsRightLeft, IconCategory,
} from '@tabler/icons-react';

const useNavItems = () => {
  const { t } = useTranslation();
  return [
    { label: t('nav.dashboard'), icon: IconLayoutDashboard, path: '/' },
    { label: t('nav.orders'), icon: IconShoppingCart, path: '/orders' },
    { label: t('nav.customers'), icon: IconUsers, path: '/customers' },
    { label: t('nav.complaints'), icon: IconAlertCircle, path: '/complaints' },
    { label: t('nav.tasks'), icon: IconClipboardList, path: '/tasks' },
    { label: t('nav.notifications'), icon: IconBell, path: '/notifications' },
    { label: t('nav.nomenclature'), icon: IconCategory, path: '/nomenclature' },
    { label: t('nav.suppliers'), icon: IconTruckDelivery, path: '/suppliers' },
    { label: t('nav.receipts'), icon: IconFileInvoice, path: '/receipts' },
    { label: t('nav.inventory'), icon: IconPackage, path: '/inventory' },
    { label: t('nav.warehouse'), icon: IconBuildingWarehouse, path: '/warehouse' },
    { label: t('nav.transfers'), icon: IconArrowsRightLeft, path: '/transfers' },
    { label: t('nav.expiry'), icon: IconCalendar, path: '/expiry' },
    { label: t('nav.issues'), icon: IconBoxSeam, path: '/issues' },
    { label: t('nav.production'), icon: IconBuildingFactory, path: '/production' },
    { label: t('nav.documents'), icon: IconFileText, path: '/documents' },
    { label: t('nav.accounting'), icon: IconBook, path: '/accounting' },
    { label: t('nav.cash'), icon: IconCash, path: '/cash' },
    { label: t('nav.bank'), icon: IconBuildingBank, path: '/bank' },
    { label: t('nav.hr'), icon: IconUsersGroup, path: '/hr' },
    { label: t('nav.scheduler'), icon: IconClock, path: '/scheduler' },
    { label: t('nav.reports'), icon: IconReport, path: '/reports' },
    { label: t('nav.ai'), icon: IconRobot, path: '/ai' },
    { label: t('nav.rbac'), icon: IconShield, path: '/rbac' },
    { label: t('nav.configurator'), icon: IconSettings, path: '/configurator' },
    { label: t('nav.admin'), icon: IconSettings, path: '/admin', adminOnly: true },
  ];
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [opened, setOpened] = useState(false);
  const [searchOpened, setSearchOpened] = useState(false);
  const navItems = useNavItems();

  const { data: unread } = useQuery({ queryKey: ['unreadCount'], queryFn: getUnreadCount, refetchInterval: 30000 });
  const { data: myTasks = [] } = useQuery({ queryKey: ['myTasksCount'], queryFn: listMyTasks, refetchInterval: 60000 });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpened(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <ActionIcon variant="subtle" onClick={() => setOpened(!opened)} hiddenFrom="sm">
              <IconMenu2 size={20} />
            </ActionIcon>
            <Text fw={700} size="lg" c="blue.9">SupplyFlow BPM</Text>
            <Text size="xs" c="dimmed">1C-style</Text>
          </Group>
          <Group gap="xs" style={{ flex: 1, justifyContent: 'center', maxWidth: 500 }}>
            <TextInput
              placeholder="Глобальный поиск... (Ctrl+K)"
              leftSection={<IconSearch size={16} />}
              rightSection={<Kbd>Ctrl+K</Kbd>}
              onClick={() => setSearchOpened(true)}
              readOnly
              style={{ flex: 1, cursor: 'pointer' }}
              styles={{ input: { cursor: 'pointer' } }}
            />
          </Group>
          <Group gap="xs">
            <Indicator label={(myTasks as any[]).length} size={16} disabled={(myTasks as any[]).length === 0} color="orange" inline>
              <ActionIcon variant="subtle" onClick={() => navigate('/tasks')}>
                <IconClipboardList size={20} />
              </ActionIcon>
            </Indicator>
            <Indicator label={(unread as any)?.count || 0} size={16} disabled={!(unread as any)?.count} color="red" inline>
              <ActionIcon variant="subtle" onClick={() => navigate('/notifications')}>
                <IconBell size={20} />
              </ActionIcon>
            </Indicator>
            <AlmatyTime />
            <LanguageToggle />
            <ThemeToggle />
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Group style={{ cursor: 'pointer' }} gap="xs">
                  <Avatar size="sm" color="blue" radius="xl">
                    {user?.fullName?.charAt(0) || 'U'}
                  </Avatar>
                  <Box visibleFrom="sm">
                    <Text size="sm" fw={500}>{user?.fullName}</Text>
                    <Text size="xs" c="dimmed">{user?.role}</Text>
                  </Box>
                </Group>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconUser size={14} />}>
                  {user?.fullName}
                </Menu.Item>
                <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>
                  {t('auth.logout')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <ScrollArea>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            if (item.adminOnly && user?.role !== 'Admin') return null;
            return (
              <NavLink
                key={item.path}
                label={item.label}
                leftSection={<Icon size={18} />}
                active={isActive}
                onClick={() => { navigate(item.path); setOpened(false); }}
                variant="filled"
                mb={4}
                styles={{ root: { borderRadius: '8px' } }}
              />
            );
          })}
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </AppShell.Main>

      <GlobalSearchModal opened={searchOpened} onClose={() => setSearchOpened(false)} />
    </AppShell>
  );
}
