import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppShell, Group, Text, NavLink, ActionIcon, Avatar, Menu, Box, ScrollArea } from '@mantine/core';
import { useAuth } from '../../store/AuthContext';
import {
  IconLayoutDashboard, IconShoppingCart, IconPackage, IconUsers, IconReport,
  IconRobot, IconSettings, IconLogout, IconMenu2, IconAlertCircle, IconUser
} from '@tabler/icons-react';

const navItems = [
  { label: 'Бақылау тақтасы', icon: IconLayoutDashboard, path: '/' },
  { label: 'Тапсырыстар', icon: IconShoppingCart, path: '/orders' },
  { label: 'Қойма', icon: IconPackage, path: '/inventory' },
  { label: 'Клиенттер', icon: IconUsers, path: '/customers' },
  { label: 'Шағымдар', icon: IconAlertCircle, path: '/complaints' },
  { label: 'Есептер', icon: IconReport, path: '/reports' },
  { label: 'ЖИ болжамдар', icon: IconRobot, path: '/ai' },
  { label: 'Админ', icon: IconSettings, path: '/admin' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [opened, setOpened] = useState(false);

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
            <Text size="xs" c="dimmed">Бизнес процестерді басқару жүйесі</Text>
          </Group>
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
                Шығу
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
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
