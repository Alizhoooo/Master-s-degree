import { ActionIcon, useMantineColorScheme, Tooltip } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export default function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { t } = useTranslation();
  const dark = colorScheme === 'dark';

  return (
    <Tooltip label={dark ? t('theme.light') : t('theme.dark')}>
      <ActionIcon variant="subtle" onClick={toggleColorScheme} size="lg">
        {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}
