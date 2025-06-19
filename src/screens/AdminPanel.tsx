import { Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  Spinner,
  Badge,
  Progress,
  useToast,
  Divider,
} from 'native-base';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { colors, gradients, shadows } from '@/constants/theme';
import { AdminStats } from '@/types';
import { getAdminStats } from '@/services/firebase';
import { useGetAdminStatsQuery, useDownloadDatabaseMutation } from '@/store/api';
import { formatNumber } from '@/utils/helpers';

export default function AdminPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigation = useNavigation();
  const toast = useToast();
  const [downloadDatabase] = useDownloadDatabaseMutation();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const adminStats = await getAdminStats();
      setStats(adminStats);
    } catch (error) {
      toast.show({
        description: 'Errore nel caricamento statistiche',
        colorScheme: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDatabase = async (format: 'json' | 'csv') => {
    Alert.alert(
      'Export Database',
      `Sei sicuro di voler esportare il database in formato ${format.toUpperCase()}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Esporta',
          onPress: async () => {
            try {
              const blob = await downloadDatabase({ format }).unwrap();
              const fileUri = FileSystem.documentDirectory + `database.${format}`;
              
              // Convert blob to base64 and save
              const reader = new FileReader();
              reader.onloadend = async () => {
                const base64data = reader.result as string;
                const base64 = base64data.split(',')[1];
                
                await FileSystem.writeAsStringAsync(fileUri, base64, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                
                await Sharing.shareAsync(fileUri);
              };
              reader.readAsDataURL(blob);
              
              toast.show({
                description: `Database esportato in ${format.toUpperCase()}`,
                colorScheme: 'success',
              });
            } catch (error) {
              toast.show({
                description: 'Errore durante l\'export',
                colorScheme: 'error',
              });
            }
          },
        },
      ]
    );
  };

  const StatCard = ({ title, value, subtitle, icon, color = colors.primary }: any) => (
    <View style={[styles.statCard, shadows.sm]}>
      <LinearGradient
        colors={[colors.surface, colors.background]}
        style={styles.statGradient}
      >
        <HStack alignItems="center" justifyContent="space-between">
          <VStack>
            <Text fontSize="2xl" fontWeight="bold" color={colors.text}>
              {value}
            </Text>
            <Text fontSize="md" color={colors.text}>
              {title}
            </Text>
            {subtitle && (
              <Text fontSize="sm" color={colors.textSecondary}>
                {subtitle}
              </Text>
            )}
          </VStack>
          <Icon as={MaterialIcons} name={icon} size={10} color={color} />
        </HStack>
      </LinearGradient>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <VStack style={styles.loading} space={4}>
          <Spinner size="lg" color={colors.secondary} />
          <Text color={colors.textSecondary}>
            Caricamento pannello admin...
          </Text>
        </VStack>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={gradients.dark} style={styles.header}>
        <HStack alignItems="center" justifyContent="space-between">
          <HStack alignItems="center" space={3}>
            <Icon
              as={MaterialIcons}
              name="admin-panel-settings"
              size={8}
              color={colors.secondary}
            />
            <VStack>
              <Text fontSize="xl" fontWeight="bold" color={colors.text}>
                Admin Panel
              </Text>
              <Text fontSize="sm" color={colors.textSecondary}>
                Sistema di gestione GREED & GROSS
              </Text>
            </VStack>
          </HStack>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon as={MaterialIcons} name="close" size={6} color={colors.text} />
          </TouchableOpacity>
        </HStack>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <VStack space={4} mb={6}>
          <Text fontSize="lg" fontWeight="bold" color={colors.text}>
            Statistiche Rapide
          </Text>
          
          <HStack space={3}>
            <StatCard
              title="Utenti Totali"
              value={formatNumber(stats?.totalUsers || 0)}
              icon="people"
              color={colors.primary}
            />
            <StatCard
              title="Utenti Attivi"
              value={formatNumber(stats?.activeUsers || 0)}
              subtitle="24h"
              icon="trending-up"
              color={colors.success}
            />
          </HStack>

          <HStack space={3}>
            <StatCard
              title="Premium"
              value={formatNumber(stats?.premiumUsers || 0)}
              subtitle={`${((stats?.premiumUsers || 0) / (stats?.totalUsers || 1) * 100).toFixed(1)}%`}
              icon="workspace-premium"
              color={colors.secondary}
            />
            <StatCard
              title="Incroci Totali"
              value={formatNumber(stats?.totalCrosses || 0)}
              icon="science"
              color={colors.accent}
            />
          </HStack>
        </VStack>

        {/* Revenue Stats */}
        <VStack style={styles.section} space={3}>
          <Text fontSize="lg" fontWeight="bold" color={colors.text}>
            Revenue Analytics
          </Text>
          
          <VStack space={2}>
            <HStack justifyContent="space-between">
              <Text color={colors.textSecondary}>Giornaliero</Text>
              <Text color={colors.text} fontWeight="bold">
                €{stats?.revenue.daily.toFixed(2) || '0.00'}
              </Text>
            </HStack>
            <HStack justifyContent="space-between">
              <Text color={colors.textSecondary}>Mensile</Text>
              <Text color={colors.text} fontWeight="bold">
                €{stats?.revenue.monthly.toFixed(2) || '0.00'}
              </Text>
            </HStack>
            <HStack justifyContent="space-between">
              <Text color={colors.textSecondary}>Annuale (stimato)</Text>
              <Text color={colors.text} fontWeight="bold">
                €{stats?.revenue.yearly.toFixed(2) || '0.00'}
              </Text>
            </HStack>
          </VStack>
        </VStack>

        {/* System Health */}
        <VStack style={styles.section} space={3}>
          <Text fontSize="lg" fontWeight="bold" color={colors.text}>
            System Health
          </Text>
          
          <VStack space={3}>
            <VStack space={1}>
              <HStack justifyContent="space-between">
                <Text color={colors.textSecondary}>API Latency</Text>
                <Text color={colors.text}>
                  {stats?.systemHealth.apiLatency || 0}ms
                </Text>
              </HStack>
              <Progress
                value={Math.min((stats?.systemHealth.apiLatency || 0) / 500 * 100, 100)}
                colorScheme={
                  (stats?.systemHealth.apiLatency || 0) < 200 ? 'success' :
                  (stats?.systemHealth.apiLatency || 0) < 400 ? 'warning' : 'error'
                }
                bg="gray.700"
                size="sm"
              />
            </VStack>

            <VStack space={1}>
              <HStack justifyContent="space-between">
                <Text color={colors.textSecondary}>Cache Hit Rate</Text>
                <Text color={colors.text}>
                  {((stats?.systemHealth.cacheHitRate || 0) * 100).toFixed(1)}%
                </Text>
              </HStack>
              <Progress
                value={(stats?.systemHealth.cacheHitRate || 0) * 100}
                colorScheme="info"
                bg="gray.700"
                size="sm"
              />
            </VStack>

            <VStack space={1}>
              <HStack justifyContent="space-between">
                <Text color={colors.textSecondary}>Error Rate</Text>
                <Text color={colors.text}>
                  {((stats?.systemHealth.errorRate || 0) * 100).toFixed(2)}%
                </Text>
              </HStack>
              <Progress
                value={(stats?.systemHealth.errorRate || 0) * 100}
                colorScheme="error"
                bg="gray.700"
                size="sm"
              />
            </VStack>
          </VStack>
        </VStack>

        {/* Popular Strains */}
        <VStack style={styles.section} space={3}>
          <Text fontSize="lg" fontWeight="bold" color={colors.text}>
            Strain Più Popolari
          </Text>
          
          {stats?.popularStrains.slice(0, 5).map((strain, index) => (
            <HStack key={strain.id} alignItems="center" justifyContent="space-between">
              <HStack alignItems="center" space={3}>
                <Badge colorScheme="primary" variant="subtle">
                  #{index + 1}
                </Badge>
                <VStack>
                  <Text color={colors.text} fontWeight="bold">
                    {strain.name}
                  </Text>
                  <Text color={colors.textSecondary} fontSize="sm">
                    {strain.parentA} x {strain.parentB}
                  </Text>
                </VStack>
              </HStack>
              <Text color={colors.textSecondary}>
                {strain.popularity} richieste
              </Text>
            </HStack>
          ))}
        </VStack>

        {/* Admin Actions */}
        <VStack style={styles.section} space={3}>
          <Text fontSize="lg" fontWeight="bold" color={colors.text}>
            Azioni Admin
          </Text>
          
          <VStack space={3}>
            <Button
              onPress={() => handleExportDatabase('json')}
              leftIcon={<Icon as={MaterialIcons} name="download" />}
              colorScheme="primary"
              variant="outline"
            >
              Export Database (JSON)
            </Button>
            
            <Button
              onPress={() => handleExportDatabase('csv')}
              leftIcon={<Icon as={MaterialIcons} name="table-chart" />}
              colorScheme="success"
              variant="outline"
            >
              Export Database (CSV)
            </Button>
            
            <Button
              onPress={loadStats}
              leftIcon={<Icon as={MaterialIcons} name="refresh" />}
              colorScheme="info"
              variant="outline"
            >
              Aggiorna Statistiche
            </Button>
          </VStack>
        </VStack>

        {/* Footer */}
        <VStack style={styles.footer} space={2}>
          <Divider bg={colors.border} />
          <Text fontSize="xs" color={colors.textSecondary} textAlign="center">
            GREED & GROSS Admin Panel v1.0.0
          </Text>
          <Text fontSize="xs" color={colors.textSecondary} textAlign="center">
            Last updated: {new Date().toLocaleString('it-IT')}
          </Text>
        </VStack>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  content: {
    padding: 20,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
  },
  section: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  footer: {
    paddingVertical: 20,
  },
});