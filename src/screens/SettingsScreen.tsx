import { errorLogger } from '@/services/errorLogger';
import React, { useState, useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import {
  VStack,
  HStack,
  Text,
  ScrollView,
  Box,
  Pressable,
  Icon,
  Switch,
  Avatar,
  Badge,
  Divider,
  useColorMode,
  useColorModeValue,
  useToast,
} from 'native-base';
import { MaterialIcons, MaterialCommunityIcons } from 'react-native-vector-icons';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
// import * as Notifications from 'expo-notifications'; // TODO: Replace with react-native-push-notification
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '@/constants/theme';
import { RootState } from '@/store';
import LanguageSelector from '@/components/LanguageSelector';
import DocumentViewer from '@/components/DocumentViewer';
import { SupportedLanguage, LANGUAGES } from '@/i18n';
import { logAnalytics } from '@/services/firebase';
import { useConversationMemory } from '@/hooks/useConversationMemory';

interface SettingsSectionProps {
  title: string;
  children?: React.ReactNode;
}

interface SettingsItemProps {
  icon: string;
  iconLib?: 'MaterialIcons' | 'MaterialCommunityIcons';
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <VStack space={2} mb={6}>
      <Text fontSize="sm" fontWeight="bold" color="gray.500" px={4} textTransform="uppercase">
        {title}
      </Text>
      <Box bg={useColorModeValue('white', colors.darkCard)} borderRadius="lg" mx={4}>
        {children}
      </Box>
    </VStack>
  );
}

function SettingsItem({
  icon,
  iconLib = 'MaterialIcons',
  title,
  subtitle,
  onPress,
  rightElement,
  showArrow = true,
  isFirst = false,
  isLast = false,
}: SettingsItemProps) {
  const IconComponent = iconLib === 'MaterialIcons' ? MaterialIcons : MaterialCommunityIcons;

  return (
    <Pressable
      onPress={onPress}
      _pressed={{ bg: `${colors.primary}10` }}
      borderTopRadius={isFirst ? 'lg' : 0}
      borderBottomRadius={isLast ? 'lg' : 0}
    >
      <HStack alignItems="center" p={4} space={3}>
        <Icon as={IconComponent} name={icon} size="md" color={colors.primary} />
        <VStack flex={1}>
          <Text fontSize="md" fontWeight="medium">
            {title}
          </Text>
          {subtitle && (
            <Text fontSize="sm" color="gray.500">
              {subtitle}
            </Text>
          )}
        </VStack>
        {rightElement}
        {showArrow && !rightElement && (
          <Icon as={MaterialIcons} name="arrow-forward-ios" size="sm" color="gray.400" />
        )}
      </HStack>
      {!isLast && <Divider ml={16} />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();

  const { user } = useSelector((state: RootState) => state.auth);

  // Memory system integration
  const {
    memoryEnabled,
    conversationCount,
    memoryProfile,
    updatePrivacySettings,
    clearHistory,
    exportData,
  } = useConversationMemory();

  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    () => (i18n.language as SupportedLanguage) || 'en'
  );
  const [notificationSettings, setNotificationSettings] = useState({
    push: true,
    chatMessages: true,
    breeding: true,
    updates: false,
  });
  const [documentViewer, setDocumentViewer] = useState<{
    isOpen: boolean;
    type: 'privacy-policy' | 'terms-service' | 'disclaimer' | 'support-info' | null;
  }>({
    isOpen: false,
    type: null,
  });

  const bgColor = useColorModeValue('gray.50', colors.darkBackground);
  const isDarkMode = colorMode === 'dark';

  useEffect(() => {
    loadNotificationSettings();
    logAnalytics('screen_view', { screen_name: 'settings' });
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('@greedgross:notifications');
      if (settings) {
        setNotificationSettings(JSON.parse(settings));
      }
    } catch (error) {
      errorLogger.error(
        'Error loading notification settings',
        error,
        'SettingsScreen.loadNotificationSettings'
      );
    }
  };

  const saveNotificationSettings = async (newSettings: typeof notificationSettings) => {
    try {
      await AsyncStorage.setItem('@greedgross:notifications', JSON.stringify(newSettings));
      setNotificationSettings(newSettings);
    } catch (error) {
      errorLogger.error(
        'Error saving notification settings',
        error,
        'SettingsScreen.saveNotificationSettings'
      );
      toast.show({
        title: t('errors.storageError'),
        colorScheme: 'error',
      });
    }
  };

  const handleNotificationToggle = async (key: keyof typeof notificationSettings) => {
    const newSettings = { ...notificationSettings, [key]: !notificationSettings[key] };

    if (key === 'push') {
      // Request notification permissions if enabling
      if (!notificationSettings.push) {
        // const { status } = await Notifications.requestPermissionsAsync();
        const status = 'granted'; // TODO: Implement with react-native-push-notification
        if (status !== 'granted') {
          toast.show({
            title: t('errors.permissionDenied'),
            description: t('settings.notifications.permissionRequired'),
            colorScheme: 'warning',
          });
          return;
        }
      }
    }

    await saveNotificationSettings(newSettings);
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false
    });

    logAnalytics('notification_setting_changed', {
      setting: key,
      enabled: newSettings[key],
    });
  };

  const handleLanguageChange = (language: SupportedLanguage) => {
    setCurrentLanguage(language);
    logAnalytics('language_changed', { language });
  };

  const handleThemeToggle = () => {
    toggleColorMode();
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false
    });
    logAnalytics('theme_changed', { theme: isDarkMode ? 'light' : 'dark' });
  };

  const handleSubscriptionPress = () => {
    navigation.navigate('Paywall', { feature: 'subscription_management' });
    logAnalytics('subscription_management_opened');
  };

  const handleRestorePurchases = async () => {
    try {
      // RevenueCat restore purchases logic here
      toast.show({
        title: t('settings.subscription.restorePurchases'),
        description: t('common.success'),
        colorScheme: 'success',
      });
      logAnalytics('purchases_restored');
    } catch (error) {
      toast.show({
        title: t('common.error'),
        description: t('errors.unknownError'),
        colorScheme: 'error',
      });
    }
  };

  const handleDocumentPress = (
    type: 'privacy-policy' | 'terms-service' | 'disclaimer' | 'support-info'
  ) => {
    setDocumentViewer({ isOpen: true, type });
    logAnalytics('legal_document_opened', { document_type: type });
  };

  const handleSupportPress = () => {
    const email = 'support@greedandgross.com';
    const subject = encodeURIComponent('GREED & GROSS - Support Request');
    const body = encodeURIComponent(`
Hi GREED & GROSS Support Team,

User ID: ${user?.id || 'N/A'}
App Version: ${Platform.OS === 'ios' ? '1.0.0' : '1.0.0'}
Device: ${Platform.OS} ${Platform.Version}
Language: ${currentLanguage}

Issue Description:
[Please describe your issue here]

Thank you!
    `);

    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

    Linking.canOpenURL(mailtoUrl).then(supported => {
      if (supported) {
        Linking.openURL(mailtoUrl);
      } else {
        toast.show({
          title: t('common.error'),
          description: t('errors.emailNotSupported'),
          colorScheme: 'error',
        });
      }
    });

    logAnalytics('support_contact_opened');
  };

  const getTierBadgeColor = () => {
    switch (user?.tier) {
      case 'premium':
        return 'yellow';
      case 'admin':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const getTierLabel = () => {
    switch (user?.tier) {
      case 'premium':
        return t('settings.subscription.premium');
      case 'admin':
        return t('settings.subscription.admin');
      default:
        return t('settings.subscription.free');
    }
  };

  // Memory Settings Handlers
  const handleMemoryToggle = async () => {
    try {
      await updatePrivacySettings({ enableMemory: !memoryEnabled });
      ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false
    });
      logAnalytics('memory_setting_changed', { enabled: !memoryEnabled });
    } catch (error) {
      toast.show({
        title: 'Error',
        description: 'Failed to update memory settings',
        colorScheme: 'error',
      });
    }
  };

  const handleEncryptionToggle = async () => {
    try {
      await updatePrivacySettings({
        encryptSensitive: !memoryProfile?.privacySettings?.encryptSensitive,
      });
      ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false
    });
      logAnalytics('encryption_setting_changed', {
        enabled: !memoryProfile?.privacySettings?.encryptSensitive,
      });
    } catch (error) {
      toast.show({
        title: 'Error',
        description: 'Failed to update encryption settings',
        colorScheme: 'error',
      });
    }
  };

  const handleClearMemory = () => {
    Alert.alert(
      'Clear Memory',
      'This will permanently delete all your conversation history and learned preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearHistory();
              toast.show({
                title: 'Success',
                description: 'Memory cleared successfully',
                colorScheme: 'success',
              });
              logAnalytics('memory_cleared');
            } catch (error) {
              toast.show({
                title: 'Error',
                description: 'Failed to clear memory',
                colorScheme: 'error',
              });
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const data = await exportData();
      toast.show({
        title: 'Export Ready',
        description: 'Your data has been prepared for export',
        colorScheme: 'success',
      });
      logAnalytics('data_exported');
      // In a real app, implement file sharing here
    } catch (error) {
      toast.show({
        title: 'Error',
        description: 'Failed to export data',
        colorScheme: 'error',
      });
    }
  };

  const handleConversationHistory = () => {
    navigation.navigate('ConversationHistory');
    logAnalytics('conversation_history_opened');
  };

  if (documentViewer.isOpen && documentViewer.type) {
    return (
      <DocumentViewer
        documentType={documentViewer.type}
        language={currentLanguage}
        onClose={() => setDocumentViewer({ isOpen: false, type: null })}
      />
    );
  }

  return (
    <Box flex={1} bg={bgColor}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <SettingsSection title={t('settings.profile.title')}>
          <SettingsItem
            icon="person"
            title={user?.username || 'Anonymous User'}
            subtitle={`${t('settings.profile.tier')}: ${getTierLabel()}`}
            rightElement={
              <HStack alignItems="center" space={2}>
                <Badge colorScheme={getTierBadgeColor()} variant="solid">
                  {getTierLabel().toUpperCase()}
                </Badge>
                <Avatar
                  size="sm"
                  bg={colors.primary}
                  source={user?.avatar ? { uri: user.avatar } : undefined}
                >
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </Avatar>
              </HStack>
            }
            showArrow={false}
            isFirst
            isLast
          />
        </SettingsSection>

        {/* Language Section */}
        <SettingsSection title={t('settings.language.title')}>
          <Box p={4}>
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
          </Box>
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title={t('settings.notifications.title')}>
          <SettingsItem
            icon="notifications"
            title={t('settings.notifications.push')}
            subtitle={t('settings.notifications.pushDescription')}
            rightElement={
              <Switch
                isChecked={notificationSettings.push}
                onToggle={() => handleNotificationToggle('push')}
                colorScheme="primary"
              />
            }
            showArrow={false}
            isFirst
          />
          <SettingsItem
            icon="chat"
            title={t('settings.notifications.chatMessages')}
            subtitle={t('settings.notifications.chatDescription')}
            rightElement={
              <Switch
                isChecked={notificationSettings.chatMessages}
                onToggle={() => handleNotificationToggle('chatMessages')}
                colorScheme="primary"
                isDisabled={!notificationSettings.push}
              />
            }
            showArrow={false}
          />
          <SettingsItem
            icon="science"
            iconLib="MaterialCommunityIcons"
            title={t('settings.notifications.breeding')}
            subtitle={t('settings.notifications.breedingDescription')}
            rightElement={
              <Switch
                isChecked={notificationSettings.breeding}
                onToggle={() => handleNotificationToggle('breeding')}
                colorScheme="primary"
                isDisabled={!notificationSettings.push}
              />
            }
            showArrow={false}
          />
          <SettingsItem
            icon="system-update"
            title={t('settings.notifications.updates')}
            subtitle={t('settings.notifications.updatesDescription')}
            rightElement={
              <Switch
                isChecked={notificationSettings.updates}
                onToggle={() => handleNotificationToggle('updates')}
                colorScheme="primary"
                isDisabled={!notificationSettings.push}
              />
            }
            showArrow={false}
            isLast
          />
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection title={t('settings.appearance.title')}>
          <SettingsItem
            icon="palette"
            title={t('settings.appearance.theme')}
            subtitle={
              isDarkMode ? t('settings.appearance.darkMode') : t('settings.appearance.lightMode')
            }
            rightElement={
              <Switch isChecked={isDarkMode} onToggle={handleThemeToggle} colorScheme="primary" />
            }
            showArrow={false}
            isFirst
            isLast
          />
        </SettingsSection>

        {/* Memory & Privacy Section */}
        <SettingsSection title="Memory & Privacy">
          <SettingsItem
            icon="memory"
            title="Smart Memory"
            subtitle={
              memoryEnabled
                ? `Active with ${conversationCount} conversations`
                : 'Disabled - No conversation tracking'
            }
            rightElement={
              <Switch
                isChecked={memoryEnabled}
                onToggle={handleMemoryToggle}
                colorScheme="primary"
              />
            }
            showArrow={false}
            isFirst
          />

          {memoryEnabled && (
            <>
              <SettingsItem
                icon="enhanced-encryption"
                title="Encrypt Sensitive Data"
                subtitle="Encrypt conversations and personal preferences"
                rightElement={
                  <Switch
                    isChecked={memoryProfile?.privacySettings?.encryptSensitive || false}
                    onToggle={handleEncryptionToggle}
                    colorScheme="primary"
                  />
                }
                showArrow={false}
              />

              <SettingsItem
                icon="history"
                title="Conversation History"
                subtitle={`View and manage ${conversationCount} conversations`}
                onPress={handleConversationHistory}
              />

              <SettingsItem
                icon="download"
                title="Export My Data"
                subtitle="Download all your data (GDPR compliant)"
                onPress={handleExportData}
              />

              <SettingsItem
                icon="delete-forever"
                title="Clear All Memory"
                subtitle="Permanently delete all conversation history"
                onPress={handleClearMemory}
                isLast
              />
            </>
          )}

          {!memoryEnabled && (
            <SettingsItem
              icon="info"
              title="About Smart Memory"
              subtitle="Enable to get personalized AI responses based on your conversation history"
              showArrow={false}
              isLast
            />
          )}
        </SettingsSection>

        {/* Subscription Section */}
        <SettingsSection title={t('settings.subscription.title')}>
          <SettingsItem
            icon="card-membership"
            title={t('settings.subscription.managePlan')}
            subtitle={`${t('settings.subscription.currentPlan')}: ${getTierLabel()}`}
            onPress={handleSubscriptionPress}
            isFirst
          />
          <SettingsItem
            icon="restore"
            title={t('settings.subscription.restorePurchases')}
            onPress={handleRestorePurchases}
            showArrow={false}
            isLast
          />
        </SettingsSection>

        {/* Legal Section */}
        <SettingsSection title={t('settings.legal.title')}>
          <SettingsItem
            icon="privacy-tip"
            title={t('settings.legal.privacyPolicy')}
            onPress={() => handleDocumentPress('privacy-policy')}
            isFirst
          />
          <SettingsItem
            icon="description"
            title={t('settings.legal.termsOfService')}
            onPress={() => handleDocumentPress('terms-service')}
          />
          <SettingsItem
            icon="school"
            title={t('settings.legal.disclaimer')}
            onPress={() => handleDocumentPress('disclaimer')}
          />
          <SettingsItem
            icon="support"
            title={t('settings.legal.support')}
            onPress={handleSupportPress}
            isLast
          />
        </SettingsSection>

        {/* App Info Section */}
        <SettingsSection title={t('settings.app.title')}>
          <SettingsItem
            icon="info"
            title={t('settings.app.version')}
            subtitle="1.0.0 (1)"
            showArrow={false}
            isFirst
          />
          <SettingsItem
            icon="build"
            title={t('settings.app.build')}
            subtitle={Platform.OS === 'ios' ? 'iOS' : 'Android'}
            showArrow={false}
          />
          <SettingsItem
            icon="favorite"
            title={t('settings.app.credits')}
            subtitle="Made with ❤️ for cannabis breeders"
            showArrow={false}
            isLast
          />
        </SettingsSection>

        {/* Bottom spacing */}
        <Box h={20} />
      </ScrollView>
    </Box>
  );
}
