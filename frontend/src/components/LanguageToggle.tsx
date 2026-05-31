import { ActionIcon, Menu, Tooltip } from '@mantine/core';
import { IconLanguage } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const langs = [
  { code: 'kk', label: 'lang.kk' },
  { code: 'ru', label: 'lang.ru' },
  { code: 'en', label: 'lang.en' },
];

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();

  const switchLang = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
  };

  return (
    <Menu shadow="md" width={140}>
      <Menu.Target>
        <Tooltip label={t('lang.' + i18n.language)}>
          <ActionIcon variant="subtle" size="lg">
            <IconLanguage size={18} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        {langs.map(l => (
          <Menu.Item
            key={l.code}
            onClick={() => switchLang(l.code)}
            style={{ fontWeight: i18n.language === l.code ? 700 : 400 }}
          >
            {t(l.label)}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
