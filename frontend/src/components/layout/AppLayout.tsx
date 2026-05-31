import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppShell, Group, Text, NavLink, ActionIcon, Avatar, Menu, Box, ScrollArea } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/AuthContext';
import ThemeToggle from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import AlmatyTime from '../AlmatyTime';
import {
  IconLayoutDashboard, IconShoppingCart, IconPackage, IconUsers, IconReport,
  IconRobot, IconSettings, IconLogout, IconMenu2, IconAlertCircle, IconUser
} from '@tabler/icons-react';

const useNavItems = () => {
  const { t } = useTranslation();
  return [
    { label: t('nav.dashboard'), icon: IconLayoutDashboard, path: '/' },
    { label: t('nav.orders'), icon: IconShoppingCart, path: '/orders' },
    { label: t('nav.inventory'), icon: IconPackage, path: '/inventory' },
    { label: t('nav.customers'), icon: IconUsers, path: '/customers' },
    { label: t('nav.complaints'), icon: IconAlertCircle, path: '/complaints' },
    { label: t('nav.reports'), icon: IconReport, path: '/reports' },
    { label: t('nav.ai'), icon: IconRobot, path: '/ai' },
    { label: t('nav.admin'), icon: IconSettings, path: '/admin' },
  ];
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [opened, setOpened] = useState(false);
  const navItems = useNavItems();

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
            <Text fw={700} size="lg" c="blue.9">SupplyFlow</Text>
            <Text size="xs" c="dimmed">{t('app.subtitle')}</Text>
          </Group>
          <Group gap="xs">
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
            
            // Skip admin link for non-admin users
            if (item.path === '/admin' && user?.role !== 'Admin') return null;
            
            return (
              <NavLink
                key={item.path}
                label={item.label}
                leftSection={<Icon size={20} />}
                active={isActive}
                onClick={() => { navigate(item.path); setOpened(false); }}
                variant="filled"
                mb={4}
                styles={{
                  root: { borderRadius: '8px' },
                }}
              />
            );
          })}
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
