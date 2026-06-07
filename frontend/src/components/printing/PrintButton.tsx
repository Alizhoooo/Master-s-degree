import { Button, Menu, Text } from '@mantine/core';
import { IconPrinter } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { listPrintForms, PrintForm } from '../../api';
import { PrintPreviewModal } from './PrintPreviewModal';

interface PrintButtonProps {
  entityType: string;
  entityId: number;
  label?: string;
  variant?: 'filled' | 'light' | 'subtle' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  formCode?: string;
}

export function PrintButton({ entityType, entityId, label, variant = 'light', size = 'sm', formCode }: PrintButtonProps) {
  const { t } = useTranslation();
  const [forms, setForms] = useState<PrintForm[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [openedForm, setOpenedForm] = useState<PrintForm | null>(null);
  const [opened, setOpened] = useState(false);

  async function open() {
    if (formCode) {
      setOpenedForm({
        id: 0,
        code: formCode,
        name: formCode,
        applicableTypes: [entityType],
        isSystem: true,
        isActive: true,
        sortOrder: 0,
      });
      return;
    }
    if (forms) {
      setOpened(true);
      return;
    }
    setLoading(true);
    try {
      const data = await listPrintForms(entityType);
      setForms(data);
      setOpened(true);
    } catch (e: any) {
      notifications.show({
        color: 'red',
        title: t('common.error', 'Ошибка'),
        message: e?.response?.data?.message || t('printing.loadError', 'Не удалось загрузить формы'),
      });
    } finally {
      setLoading(false);
    }
  }

  function selectForm(form: PrintForm) {
    setOpenedForm(form);
    setOpened(false);
  }

  if (formCode) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          leftSection={<IconPrinter size={16} />}
          onClick={open}
        >
          {label || t('printing.print', 'Печать')}
        </Button>
        {openedForm && (
          <PrintPreviewModal
            form={openedForm}
            entityType={entityType}
            entityId={entityId}
            onClose={() => setOpenedForm(null)}
          />
        )}
      </>
    );
  }

  if (forms && forms.length === 0) {
    return null;
  }

  const buttonLabel = label || t('printing.print', 'Печать');

  return (
    <>
      <Menu opened={opened} onChange={setOpened} position="bottom-end" withinPortal>
        <Menu.Target>
          <Button
            variant={variant}
            size={size}
            leftSection={<IconPrinter size={16} />}
            loading={loading}
            onClick={open}
          >
            {buttonLabel}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {forms === null && (
            <Text size="sm" c="dimmed" p="sm">
              {t('printing.noForms', 'Нет доступных форм')}
            </Text>
          )}
          {forms?.map((f) => (
            <Menu.Item
              key={f.id}
              leftSection={<IconPrinter size={14} />}
              onClick={() => selectForm(f)}
            >
              {f.name}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
      {openedForm && (
        <PrintPreviewModal
          form={openedForm}
          entityType={entityType}
          entityId={entityId}
          onClose={() => setOpenedForm(null)}
        />
      )}
    </>
  );
}
