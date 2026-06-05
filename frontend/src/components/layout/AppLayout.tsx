import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell, Group, Text, NavLink, ActionIcon, Avatar, Menu, Box, ScrollArea, Indicator, TextInput, Kbd, Divider, Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/AuthContext';
import ThemeToggle from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import AlmatyTime from '../AlmatyTime';
import GlobalSearchModal from '../GlobalSearchModal';
import SettingsModal from '../SettingsModal';
import Logo from '../Logo';
import { useQuery } from '@tanstack/react-query';
import { getUnreadCount, listMyTasks } from '../../api';
import {
  IconLayoutDashboard, IconShoppingCart, IconPackage, IconUsers, IconReport,
  IconRobot, IconSettings, IconLogout, IconMenu2, IconAlertCircle, IconUser,
  IconBook, IconCash, IconBuildingBank, IconBuildingWarehouse, IconBuildingFactory,
  IconUsersGroup, IconFileText, IconClipboardList, IconBell, IconClock,
  IconShield, IconShieldLock, IconSearch, IconTruckDelivery, IconFileInvoice, IconBoxSeam, IconCalendar,
  IconArrowsRightLeft, IconCategory, IconChevronRight,
} from '@tabler/icons-react';

type NavItem = { label: string; icon: any; path: string; adminOnly?: boolean };

const useNavItems = (): { group: string; items: NavItem[] }[] => {
  const { t } = useTranslation();
  return [
    {
      group: t('nav.groupOverview'),
      items: [
        { label: t('nav.dashboard'), icon: IconLayoutDashboard, path: '/' },
        { label: t('nav.orders'), icon: IconShoppingCart, path: '/orders' },
        { label: t('nav.customers'), icon: IconUsers, path: '/customers' },
        { label: t('nav.complaints'), icon: IconAlertCircle, path: '/complaints' },
        { label: t('nav.tasks'), icon: IconClipboardList, path: '/tasks' },
        { label: t('nav.notifications'), icon: IconBell, path: '/notifications' },
      ],
    },
    {
      group: t('nav.groupInventory'),
      items: [
        { label: t('nav.nomenclature'), icon: IconCategory, path: '/nomenclature' },
        { label: t('nav.suppliers'), icon: IconTruckDelivery, path: '/suppliers' },
        { label: t('nav.receipts'), icon: IconFileInvoice, path: '/receipts' },
        { label: t('nav.inventory'), icon: IconPackage, path: '/inventory' },
        { label: t('nav.warehouse'), icon: IconBuildingWarehouse, path: '/warehouse' },
        { label: t('nav.transfers'), icon: IconArrowsRightLeft, path: '/transfers' },
        { label: t('nav.expiry'), icon: IconCalendar, path: '/expiry' },
        { label: t('nav.issues'), icon: IconBoxSeam, path: '/issues' },
      ],
    },
    {
      group: t('nav.groupFinance'),
      items: [
        { label: t('nav.production'), icon: IconBuildingFactory, path: '/production' },
        { label: t('nav.documents'), icon: IconFileText, path: '/documents' },
        { label: t('nav.accounting'), icon: IconBook, path: '/accounting' },
        { label: t('nav.cash'), icon: IconCash, path: '/cash' },
        { label: t('nav.bank'), icon: IconBuildingBank, path: '/bank' },
        { label: t('nav.hr'), icon: IconUsersGroup, path: '/hr' },
      ],
    },
    {
      group: t('nav.groupSystem'),
      items: [
        { label: t('nav.scheduler'), icon: IconClock, path: '/scheduler' },
        { label: t('nav.reports'), icon: IconReport, path: '/reports' },
        { label: t('nav.ai'), icon: IconRobot, path: '/ai' },
        { label: t('nav.rbac'), icon: IconShield, path: '/rbac' },
        { label: t('nav.configurator'), icon: IconSettings, path: '/configurator' },
        { label: t('nav.admin'), icon: IconSettings, path: '/admin', adminOnly: true },
      ],
    },
  ];
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [opened, setOpened] = useState(false);
  const [searchOpened, setSearchOpened] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const navGroups = useNavItems();

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
      header={{ height: 64 }}
      navbar={{ width: 268, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="lg"
      styles={{
        main: { background: 'var(--mantine-color-body)' },
        navbar: { borderRight: '1px solid var(--mantine-color-default-border)' },
      }}
    >
      <AppShell.Header className="glass-header" style={{ border: 'none' }}>
        <Group h="100%" px="lg" justify="space-between" wrap="nowrap">
          <Group gap="md" wrap="nowrap">
            <ActionIcon variant="subtle" onClick={() => setOpened(!opened)} hiddenFrom="sm" size="lg">
              <IconMenu2 size={20} />
            </ActionIcon>
            <Logo size={32} />
          </Group>
          <Box style={{ flex: 1, maxWidth: 520, margin: '0 auto' }}>
            <TextInput
              placeholder={t('common.search') + '... (Ctrl+K)'}
              leftSection={<IconSearch size={16} />}
              rightSection={<Kbd>Ctrl+K</Kbd>}
              onClick={() => setSearchOpened(true)}
              readOnly
              size="md"
              styles={{
                input: {
                  cursor: 'pointer',
                  background: 'var(--mantine-color-default-hover)',
                  border: '1px solid var(--mantine-color-default-border)',
                },
              }}
            />
          </Box>
          <Group gap={4} wrap="nowrap">
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => navigate('/tasks')}
              title={t('nav.tasks')}
            >
              <Indicator label={(myTasks as any[]).length} size={16} disabled={(myTasks as any[]).length === 0} color="orange" inline processing>
                <IconClipboardList size={20} />
              </Indicator>
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => navigate('/notifications')}
              title={t('nav.notifications')}
            >
              <Indicator label={(unread as any)?.count || 0} size={16} disabled={!(unread as any)?.count} color="red" inline>
                <IconBell size={20} />
              </Indicator>
            </ActionIcon>
            <Divider orientation="vertical" mx={4} />
            <AlmatyTime />
            <LanguageToggle />
            <ThemeToggle />
            <Menu shadow="lg" width={240} position="bottom-end" radius="md">
              <Menu.Target>
                <ActionIcon variant="subtle" size="lg" radius="xl">
                  <Avatar size={32} radius="xl" color="indigo">
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  <Group gap="xs">
                    <Avatar size="sm" color="indigo" radius="xl">{user?.fullName?.charAt(0)?.toUpperCase() || 'U'}</Avatar>
                    <Box>
                      <Text size="sm" fw={600}>{user?.fullName}</Text>
                      <Text size="xs" c="dimmed">{user?.role}</Text>
                    </Box>
                  </Group>
                </Menu.Label>
                <Menu.Divider />
                <Menu.Item leftSection={<IconUser size={14} />} onClick={() => setSettingsOpened(true)}>
                  {t('auth.profile') || 'Профиль'}
                </Menu.Item>
                <Menu.Item leftSection={<IconSettings size={14} />} onClick={() => navigate('/admin')}>
                  {t('admin.config') || 'Настройки'}
                </Menu.Item>
                <Menu.Item leftSection={<IconShieldLock size={14} />} onClick={() => setSettingsOpened(true)}>
                  2FA
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>
                  {t('auth.logout')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <ScrollArea style={{ flex: 1 }} scrollbarSize={6} type="hover">
          {navGroups.map((group, gi) => (
            <Box key={group.group} mb="sm">
              <Text className="sf-section-title" style={{ paddingTop: gi === 0 ? 0 : undefined }}>
                {group.group}
              </Text>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);
                if (item.adminOnly && user?.role !== 'Admin') return null;
                return (
                  <NavLink
                    key={item.path}
                    label={item.label}
                    leftSection={<Icon size={18} stroke={2} />}
                    rightSection={isActive ? <IconChevronRight size={14} /> : null}
                    active={isActive}
                    onClick={() => { navigate(item.path); setOpened(false); }}
                    className="sf-navlink"
                    data-active={isActive}
                    variant="filled"
                  />
                );
              })}
            </Box>
          ))}

          <Box mt="md" p="md" style={{
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
          }}>
            <Text size="xs" c="dimmed" mb={4} fw={600}>SupplyFlow BPM</Text>
            <Text size="xs" c="dimmed">v1.0.0 · 1C-style ERP</Text>
            <Badge variant="dot" color="teal" size="xs" mt={6} styles={{ root: { background: 'transparent', padding: 0 } }}>
              Backend: <Text component="span" size="xs" c="teal" fw={600}>Online</Text>
            </Badge>
          </Box>
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </AppShell.Main>

      <GlobalSearchModal opened={searchOpened} onClose={() => setSearchOpened(false)} />
      <SettingsModal opened={settingsOpened} onClose={() => setSettingsOpened(false)} />
    </AppShell>
  );
}
