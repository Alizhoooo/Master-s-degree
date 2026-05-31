import { useState } from 'react';
import { Modal, Button, Group, Text, FileInput, Alert } from '@mantine/core';
import { IconUpload, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface Props {
  opened: boolean;
  onClose: () => void;
  title: string;
  importFn: (file: File) => Promise<any>;
  expectedFields: string[];
}

export default function CsvImportModal({ opened, onClose, title, importFn, expectedFields }: Props) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await importFn(file);
      setResult(res);
    } catch (err: any) {
      setResult({ imported: 0, errors: [err.message] });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={title}>
      <Text size="sm" mb="sm">
        CSV файлында келесі бағандар болуы керек: <Text component="span" fw={500}>{expectedFields.join(', ')}</Text>
      </Text>

      <FileInput
        label="CSV файлы"
        placeholder="Файлды таңдаңыз"
        accept=".csv"
        value={file}
        onChange={setFile}
        mb="md"
        clearable
      />

      {result && (
        <Alert color={result.errors.length > 0 ? 'yellow' : 'green'} mb="md">
          <Group gap="xs">
            {result.errors.length > 0 ? <IconAlertCircle size={16} /> : <IconCheck size={16} />}
            <Text size="sm">Импортталды: {result.imported}</Text>
          </Group>
          {result.errors.length > 0 && (
            <Text size="xs" mt="xs" c="dimmed">
              {result.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
            </Text>
          )}
        </Alert>
      )}

      <Group justify="flex-end">
        <Button variant="light" onClick={handleClose}>{t('common.cancel')}</Button>
        <Button leftSection={<IconUpload size={14} />} onClick={handleImport} loading={loading} disabled={!file}>
          Импорт
        </Button>
      </Group>
    </Modal>
  );
}
