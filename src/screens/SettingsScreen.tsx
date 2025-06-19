import React, { useState } from 'react';
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
  Switch,
  Icon,
  Divider,
  Badge,
  Progress,
  useToast,
  Avatar,
} from 'native-base';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { RootState } from '@/store';
import { colors, gradients } from '@/constants/theme';
import { logout, updateUser } from '@/store/slices/authSlice';
import { toggleTheme, incrementAdminTaps } from '@/store/slices/uiSlice';
import { clearAllData } from '@/services/storage';
import { calculateUserLevel, xpToNextLevel } from '@/utils/helpers';
import { checkSubscriptionStatus } from '@/services/initialization';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const toast = useToast();
  
  const { user, isAdmin } = useSelector((state: RootState) => state.auth);
  const { theme, adminTaps } = useSelector((state: RootState) => state.ui);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Sei sicuro di voler uscire? I tuoi dati saranno conservati.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            dispatch(logout());
            await clearAllData();
            toast.show({
              description: 'Logout effettuato',
              status: 'info',
            });
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Cancella Tutti i Dati',
      'Questa azione eliminerà TUTTI i tuoi dati incluse strain, cronologia e preferenze. Operazione irreversibile!',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina Tutto',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            dispatch(logout());
            toast.show({
              description: 'Tutti i dati sono stati eliminati',
              status: 'warning',
            });
          },
        },
      ]
    );
  };

  const handleAdminTap = () => {
    dispatch(incrementAdminTaps());
    if (adminTaps === 6) {
      toast.show({
        description: 'Admin panel sbloccato!',
        status: 'success',
      });
    }
  };

  const handleSubscriptionManage = async () => {
    const isActive = await checkSubscriptionStatus();
    if (isActive) {
      // Show subscription management
      Alert.alert(
        'Abbonamento Attivo',
        'Il tuo abbonamento Premium è attivo. Gestisci da App Store o Play Store.',
        [{ text: 'OK' }]
      );
    } else {
      navigation.navigate('Paywall', { feature: 'premium_features' });
    }
  };

  const SettingItem = ({ 
    icon, 
    iconColor = colors.textSecondary,
    title, 
    subtitle, 
    rightElement, 
    onPress,
    showDivider = true 
  }: any) => (
    <>
      <TouchableOpacity onPress={onPress} style={styles.settingItem}>
        <HStack alignItems="center" space={3} flex={1}>
          <Icon as={MaterialIcons} name={icon} size={6} color={iconColor} />
          <VStack flex={1}>
            <Text color={colors.text} fontSize="md">
              {title}
            </Text>
            {subtitle && (
              <Text color={colors.textSecondary} fontSize="sm">
                {subtitle}
              </Text>
            )}
          </VStack>
          {rightElement}
        </HStack>
      </TouchableOpacity>
      {showDivider && <Divider bg={colors.border} />}
    </>
  );

  if (!user) return null;

  const currentLevel = calculateUserLevel(user.stats.xp);
  const xpToNext = xpToNextLevel(user.stats.xp);

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={gradients.dark}
        style={styles.headerGradient}
      >
        <VStack space={4} px={4} py={6}>
          <HStack alignItems="center" space={4}>
            <Avatar bg={colors.primary} size="lg">
              <Text color="white" fontSize="xl" fontWeight="bold">
                {user.username.charAt(0).toUpperCase()}
              </Text>
            </Avatar>
            <VStack flex={1}>
              <HStack alignItems="center" space={2}>
                <Text fontSize="xl" fontWeight="bold" color={colors.text}>
                  {user.username}
                </Text>
                <Badge
                  colorScheme={
                    user.tier === 'admin' ? 'warning' :
                    user.tier === 'premium' ? 'success' : 'gray'
                  }
                  variant="subtle"
                >
                  {user.tier.toUpperCase()}
                </Badge>
              </HStack>
              <Text color={colors.textSecondary}>
                Livello {currentLevel} • {user.stats.totalCrosses} incroci
              </Text>
            </VStack>
          </HStack>

          {/* XP Progress */}
          <VStack space={2}>
            <HStack justifyContent="space-between">
              <Text color={colors.textSecondary} fontSize="sm">
                XP: {user.stats.xp}
              </Text>
              <Text color={colors.textSecondary} fontSize="sm">
                {xpToNext} XP al prossimo livello
              </Text>
            </HStack>
            <Progress
              value={(user.stats.xp % 100)}
              max={100}
              colorScheme="primary"
              bg="gray.700"
              size="sm"
            />
          </VStack>
        </VStack>
      </LinearGradient>

      <VStack style={styles.content}>
        {/* Account Section */}
        <VStack space={0} bg={colors.surface} borderRadius={12} mb={4}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <SettingItem
            icon="workspace-premium"
            iconColor={user.tier === 'premium' ? colors.secondary : colors.textSecondary}
            title="Abbonamento"
            subtitle={
              user.tier === 'premium' 
                ? 'Premium attivo' 
                : 'Passa a Premium per funzioni illimitate'
            }
            rightElement={
              <Icon as={MaterialIcons} name="chevron-right" color={colors.textSecondary} />
            }
            onPress={handleSubscriptionManage}
          />

          <SettingItem
            icon="bar-chart"
            title="Statistiche"
            subtitle={`${user.stats.strainsCreated} strain • ${user.stats.badges.length} badge`}
            rightElement={
              <Icon as={MaterialIcons} name="chevron-right" color={colors.textSecondary} />
            }
            onPress={() => {
              // Navigate to stats screen
            }}
          />

          <SettingItem
            icon="logout"
            iconColor={colors.error}
            title="Logout"
            subtitle="Esci dall'account"
            onPress={handleLogout}
            showDivider={false}
          />
        </VStack>

        {/* App Settings */}
        <VStack space={0} bg={colors.surface} borderRadius={12} mb={4}>
          <Text style={styles.sectionTitle}>Impostazioni App</Text>
          
          <SettingItem
            icon="palette"
            title="Tema"
            subtitle={theme === 'dark' ? 'Modalità scura' : 'Modalità chiara'}
            rightElement={
              <Switch
                value={theme === 'dark'}
                onToggle={() => dispatch(toggleTheme())}
                colorScheme="primary"
              />
            }
          />

          <SettingItem
            icon="notifications"
            title="Notifiche"
            subtitle="Ricevi aggiornamenti e promemoria"
            rightElement={
              <Switch
                value={notifications}
                onToggle={setNotifications}
                colorScheme="primary"
              />
            }
          />

          <SettingItem
            icon="vibration"
            title="Feedback Aptico"
            subtitle="Vibrazioni per interazioni"
            rightElement={
              <Switch
                value={hapticFeedback}
                onToggle={setHapticFeedback}
                colorScheme="primary"
              />
            }
            showDivider={false}
          />
        </VStack>

        {/* Data Management */}
        <VStack space={0} bg={colors.surface} borderRadius={12} mb={4}>
          <Text style={styles.sectionTitle}>Gestione Dati</Text>
          
          <SettingItem
            icon="cloud-download"
            title="Backup Dati"
            subtitle="Salva le tue strain nel cloud"
            rightElement={
              <Icon as={MaterialIcons} name="chevron-right" color={colors.textSecondary} />
            }
            onPress={() => {
              if (user.tier === 'free') {
                navigation.navigate('Paywall', { feature: 'cloud_backup' });
              }
            }}
          />

          <SettingItem
            icon="delete-forever"
            iconColor={colors.error}
            title="Cancella Tutti i Dati"
            subtitle="Elimina definitivamente tutti i dati"
            onPress={handleClearData}
            showDivider={false}
          />
        </VStack>

        {/* About & Legal */}
        <VStack space={0} bg={colors.surface} borderRadius={12} mb={4}>
          <Text style={styles.sectionTitle}>Informazioni</Text>
          
          <SettingItem
            icon="info"
            title="Informazioni App"
            subtitle="Versione 1.0.0"
            rightElement={
              <Icon as={MaterialIcons} name="chevron-right" color={colors.textSecondary} />
            }
          />

          <SettingItem
            icon="gavel"
            title="Termini e Privacy"
            subtitle="Leggi i nostri termini di servizio"
            rightElement={
              <Icon as={MaterialIcons} name="chevron-right" color={colors.textSecondary} />
            }
          />

          <SettingItem
            icon="help"
            title="Supporto"
            subtitle="Aiuto e contatti"
            rightElement={
              <Icon as={MaterialIcons} name="chevron-right" color={colors.textSecondary} />
            }
            showDivider={false}
          />
        </VStack>

        {/* Easter Egg - Admin Access */}
        <TouchableOpacity onPress={handleAdminTap} style={styles.adminEasterEgg}>
          <Text color={colors.textSecondary} fontSize="xs" textAlign="center">
            GREED & GROSS v1.0.0
          </Text>
          {adminTaps > 0 && (
            <Text color={colors.primary} fontSize="xs" textAlign="center">
              {7 - adminTaps} tap rimanenti per accesso admin
            </Text>
          )}
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            onPress={() => navigation.navigate('AdminPanel')}
            style={styles.adminButton}
          >
            <LinearGradient
              colors={[colors.secondary, '#FFA000']}
              style={styles.adminGradient}
            >
              <Icon as={MaterialIcons} name="admin-panel-settings" size={6} color="white" />
              <Text color="white" fontWeight="bold" ml={2}>
                Panel Amministratore
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </VStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Roboto-Bold',
    fontSize: 18,
    color: colors.text,
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    padding: 16,
  },
  adminEasterEgg: {
    padding: 20,
    alignItems: 'center',
  },
  adminButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  adminGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});