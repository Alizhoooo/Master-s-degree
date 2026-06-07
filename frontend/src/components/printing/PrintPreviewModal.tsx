import { Modal, Button, Group, Text, Stack, Loader, Center } from '@mantine/core';
import { IconDownload, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { renderPrintForm, PrintForm } from '../../api';
import { notifications } from '@mantine/notifications';

interface PrintPreviewModalProps {
  form: PrintForm;
  entityType: string;
  entityId: number;
  onClose: () => void;
}

export function PrintPreviewModal({ form, entityType, entityId, onClose }: PrintPreviewModalProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const blob = await renderPrintForm(entityType, entityId, form.code);
        if (active) {
          const objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      } catch (e: any) {
        if (active) {
          notifications.show({
            color: 'red',
            title: t('common.error', 'Ошибка'),
            message: e?.response?.data?.message || t('printing.renderError', 'Не удалось сформировать документ'),
          });
          onClose();
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.code, entityType, entityId]);

  async function download() {
    setDownloading(true);
    try {
      const blob = await renderPrintForm(entityType, entityId, form.code);
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${form.code}-${entityId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e: any) {
      notifications.show({
        color: 'red',
        title: t('common.error', 'Ошибка'),
        message: e?.response?.data?.message || t('printing.downloadError', 'Не удалось скачать файл'),
      });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal
      opened
      onClose={onClose}
      size="xl"
      title={form.name}
      centered
      styles={{ body: { height: '70vh', padding: 0 } }}
    >
      {loading ? (
        <Center style={{ height: '60vh' }}>
          <Stack align="center" gap="sm">
            <Loader />
            <Text size="sm" c="dimmed">
              {t('printing.generating', 'Формирование документа...')}
            </Text>
          </Stack>
        </Center>
      ) : url ? (
        <iframe src={url} style={{ width: '100%', height: '100%', border: 'none' }} title={form.name} />
      ) : null}
      <Group justify="space-between" mt="md">
        <Text size="xs" c="dimmed">
          {form.code} · {entityType} #{entityId}
        </Text>
        <Group gap="xs">
          <Button variant="default" leftSection={<IconX size={16} />} onClick={onClose}>
            {t('common.close', 'Закрыть')}
          </Button>
          <Button leftSection={<IconDownload size={16} />} onClick={download} loading={downloading}>
            {t('printing.download', 'Скачать PDF')}
          </Button>
        </Group>
      </Group>
    </Modal>
  );
}
