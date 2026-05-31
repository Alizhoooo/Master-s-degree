import React from 'react';
import { Container, Paper, Title, Text, Button, Group } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import i18n from '../i18n';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container size="sm" py="xl">
          <Paper withBorder shadow="sm" p="xl" ta="center">
            <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
            <Title order={3} mt="md">{i18n.t('common.error')}</Title>
            <Text c="dimmed" size="sm" mt="sm">
              {this.state.error?.message || i18n.t('common.errorUnknown')}
            </Text>
            <Group justify="center" mt="lg">
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={this.handleRetry}
              >
                {i18n.t('common.retry')}
              </Button>
            </Group>
          </Paper>
        </Container>
      );
    }
    return this.props.children;
  }
}
