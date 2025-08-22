// SettingsScreen.tsx
// -----------------------------------------------------------------------------
// Tela de Configurações do aplicativo.
// Responsabilidades:
// 1) Carregar/persistir preferências do app (notificações, backup automático,
//    tema e idioma) via storageService.
// 2) Exibir informações de armazenamento (tamanho do cache, total de chaves).
// 3) Ações utilitárias: criar backup (compartilhar), limpar cache e apagar
//    todos os dados (com confirmação em dois passos).
// 4) Recarregar configurações sempre que a tela ganha foco.
//
// Observações de implementação:
// - O estado `settings` é mantido localmente e sincronizado com storageService.
// - As mudanças de toggle são "optimistic updates": atualizam a UI e só então
//   persistem; em erro, mostram Alert (sem revert — ver notas).
// - `Share.share` envia o backup como texto (message). Em apps reais, costuma-se
//   gerar um arquivo e compartilhar a URL/arquivo (ver notas).
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import styled from 'styled-components/native';
import { ScrollView, ViewStyle, Alert, Share } from 'react-native';
import { Button, ListItem, Switch, Text } from 'react-native-elements';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import theme from '../styles/theme';
import Header from '../components/Header';
import { storageService } from '../services/storage';

// Tipagem de navegação desta tela.
type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

// Modelo das preferências da aplicação (mantido simples/local).
interface AppSettings {
  notifications: boolean;
  autoBackup: boolean;
  theme: 'light' | 'dark';
  language: string;
}

const SettingsScreen: React.FC = () => {
  // Estado global (auth) para eventual logout após "apagar tudo".
  const { user, signOut } = useAuth();

  // Navegação tipada para voltar a telas anteriores.
  const navigation = useNavigation<SettingsScreenProps['navigation']>();

  // ---------------------------------------------------------------------------
  // Estado local de preferências: inicia com valores padrão até carregar do storage.
  // `loading` bloqueia a tela com "Carregando" até que settings e storageInfo venham.
  // `storageInfo` guarda dados agregados (ex.: tamanho de cache, total de chaves).
  // ---------------------------------------------------------------------------
  const [settings, setSettings] = useState<AppSettings>({
    notifications: true,
    autoBackup: true,
    theme: 'light',
    language: 'pt-BR',
  });
  const [loading, setLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState<any>(null); // ver notas sobre tipagem

  // ---------------------------------------------------------------------------
  // loadSettings:
  // - Busca as preferências atuais e infos de armazenamento via storageService.
  // - Atualiza estados e encerra loading.
  // - Executada sempre que a tela volta ao foco (useFocusEffect).
  // ---------------------------------------------------------------------------
  const loadSettings = async () => {
    try {
      const appSettings = await storageService.getAppSettings();
      setSettings(appSettings);
      
      const info = await storageService.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recarrega configurações sempre que a tela estiver em foco.
  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
    }, [])
  );

  // ---------------------------------------------------------------------------
  // updateSetting:
  // - Aplica alteração local imediatamente (optimistic update) para resposta rápida.
  // - Persiste alteração no storage. Em erro, exibe alerta (não faz rollback).
  // - `keyof AppSettings` garante chave válida; `value` pode variar por chave.
  // ---------------------------------------------------------------------------
  const updateSetting = async (key: keyof AppSettings, value: any) => {
    try {
      const updatedSettings = { ...settings, [key]: value };
      setSettings(updatedSettings); // Atualiza UI imediatamente
      await storageService.updateAppSettings({ [key]: value }); // Persiste alteração
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      Alert.alert('Erro', 'Não foi possível salvar a configuração');
      // Opcional (ver notas): reverter `setSettings` ao estado anterior.
    }
  };

  // ---------------------------------------------------------------------------
  // handleCreateBackup:
  // - Solicita ao storageService a criação de um "backup" (string JSON).
  // - Compartilha via Share API do RN (como texto).
  // - Exibe feedback visual com `loading` no botão.
  // ---------------------------------------------------------------------------
  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      const backup = await storageService.createBackup();
      
      // Nome do "arquivo" para título de compartilhamento (não cria arquivo físico aqui).
      const fileName = `backup_${new Date().toISOString().split('T')[0]}.json`;
      
      await Share.share({
        message: backup,                      // Conteúdo textual do backup
        title: `Backup do App - ${fileName}`, // Título exibido no share sheet
        // Nota: Para iOS, também existe o campo `url`. Ver notas.
      });
      
      Alert.alert('Sucesso', 'Backup criado e compartilhado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      Alert.alert('Erro', 'Não foi possível criar o backup');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // handleClearCache:
  // - Confirmação simples antes de limpar o cache via storageService.
  // - Após limpar, recarrega informações e dá feedback ao usuário.
  // ---------------------------------------------------------------------------
  const handleClearCache = async () => {
    Alert.alert(
      'Limpar Cache',
      'Isso irá limpar o cache da aplicação. Tem certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Nota: storageService.clearCache() pode ser assíncrono; se for, prefira await.
              storageService.clearCache();
              await loadSettings();
              Alert.alert('Sucesso', 'Cache limpo com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível limpar o cache');
            }
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // handleClearAllData:
  // - "Zona de perigo": confirmação dupla antes de apagar **todos** os dados.
  // - Após concluir, força signOut, o que deve levar o app a um estado limpo.
  // ---------------------------------------------------------------------------
  const handleClearAllData = async () => {
    Alert.alert(
      'Apagar Todos os Dados',
      'ATENÇÃO: Isso irá apagar TODOS os dados da aplicação permanentemente. Esta ação não pode ser desfeita!',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'APAGAR TUDO',
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Confirmação Final',
              'Tem certeza absoluta? Todos os dados serão perdidos!',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'SIM, APAGAR',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await storageService.clearAll();
                      Alert.alert(
                        'Concluído',
                        'Todos os dados foram apagados. O app será reiniciado.',
                        [
                          // Ao sair, AuthContext limpa user/AsyncStorage e o AppNavigator muda para stack público.
                          { text: 'OK', onPress: () => signOut() }
                        ]
                      );
                    } catch (error) {
                      Alert.alert('Erro', 'Não foi possível apagar os dados');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Enquanto carrega, retorna uma tela simples com o Header + spinner/texto
  if (loading) {
    return (
      <Container>
        <Header />
        <LoadingContainer>
          <LoadingText>Carregando configurações...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header (saudação + sino) */}
      <Header />

      {/* Conteúdo rolável */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title>Configurações</Title>

        {/* Seção de preferências (toggles) */}
        <SectionTitle>Preferências</SectionTitle>
        <SettingsCard>
          {/* Notificações push (simulado) */}
          <ListItem>
            <ListItem.Content>
              <ListItem.Title>Notificações</ListItem.Title>
              <ListItem.Subtitle>Receber notificações push</ListItem.Subtitle>
            </ListItem.Content>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => updateSetting('notifications', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </ListItem>

          {/* Backup automático (simulado) */}
          <ListItem>
            <ListItem.Content>
              <ListItem.Title>Backup Automático</ListItem.Title>
              <ListItem.Subtitle>Criar backups automaticamente</ListItem.Subtitle>
            </ListItem.Content>
            <Switch
              value={settings.autoBackup}
              onValueChange={(value) => updateSetting('autoBackup', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </ListItem>
        </SettingsCard>

        {/* Seção de dados/armazenamento: infos agregadas do storageService */}
        <SectionTitle>Dados e Armazenamento</SectionTitle>
        <SettingsCard>
          {storageInfo && (
            <>
              <InfoItem>
                <InfoLabel>Itens no Cache:</InfoLabel>
                <InfoValue>{storageInfo.cacheSize}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Total de Chaves:</InfoLabel>
                <InfoValue>{storageInfo.totalKeys}</InfoValue>
              </InfoItem>
            </>
          )}
        </SettingsCard>

        {/* Utilidades: criar backup, limpar cache */}
        <Button
          title="Criar Backup"
          onPress={handleCreateBackup}
          containerStyle={styles.button as ViewStyle}
          buttonStyle={styles.backupButton}
          loading={loading} // desabilita/indica processamento do backup
        />

        <Button
          title="Limpar Cache"
          onPress={handleClearCache}
          containerStyle={styles.button as ViewStyle}
          buttonStyle={styles.cacheButton}
        />

        {/* Zona de perigo: apagar tudo (dupla confirmação) */}
        <SectionTitle>Ações Perigosas</SectionTitle>
        <Button
          title="Apagar Todos os Dados"
          onPress={handleClearAllData}
          containerStyle={styles.button as ViewStyle}
          buttonStyle={styles.dangerButton}
        />

        {/* Voltar para a tela anterior */}
        <Button
          title="Voltar"
          onPress={() => navigation.goBack()}
          containerStyle={styles.button as ViewStyle}
          buttonStyle={styles.buttonStyle}
        />
      </ScrollView>
    </Container>
  );
};

// -----------------------------------------------------------------------------
// Estilos (objetos JS usados em componentes de terceiros)
// -----------------------------------------------------------------------------
const styles = {
  scrollContent: {
    padding: 20,
  },
  button: {
    marginBottom: 15,
    width: '100%',
  },
  buttonStyle: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
  },
  backupButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: 12,
  },
  cacheButton: {
    backgroundColor: theme.colors.warning,
    paddingVertical: 12,
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
    paddingVertical: 12,
  },
};

// -----------------------------------------------------------------------------
// Estilos (styled-components) — layout e tipografia da tela
// -----------------------------------------------------------------------------
const Container = styled.View`
  flex: 1;
  background-color: ${theme.colors.background};
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const LoadingText = styled.Text`
  font-size: 16px;
  color: ${theme.colors.text};
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${theme.colors.text};
  margin-bottom: 20px;
  text-align: center;
`;

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${theme.colors.text};
  margin-bottom: 10px;
  margin-top: 20px;
`;

const SettingsCard = styled.View`
  background-color: ${theme.colors.white};
  border-radius: 8px;
  margin-bottom: 15px;
  border-width: 1px;
  border-color: ${theme.colors.border};
`;

const InfoItem = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.border};
`;

const InfoLabel = styled.Text`
  font-size: 16px;
  color: ${theme.colors.text};
`;

const InfoValue = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${theme.colors.primary};
`;

export default SettingsScreen;
