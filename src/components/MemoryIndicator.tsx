import { errorLogger } from '@/services/errorLogger';
import React, { useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  Pressable,
  Icon,
  Modal,
  Button,
  Progress,
  Badge,
  Switch,
  Divider,
  useColorModeValue,
  useToast,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { useConversationMemory } from '@/hooks/useConversationMemory';
import * as Haptics from 'expo-haptics';

interface MemoryIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showDetails?: boolean;
  position?: string;
  onPress?: () => void;
}

export default function MemoryIndicator({
  size = 'md',
  showLabel = false,
  onPress,
}: MemoryIndicatorProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    isEnabled,
    memoryStrength,
    analytics,
    getMemoryStatus,
    updateMemorySettings,
    clearAllMemory,
    exportUserData,
    getSuggestedPrompt,
  } = useConversationMemory();

  const bgColor = useColorModeValue('white', colors.darkCard);
  const borderColor = useColorModeValue('gray.200', colors.darkBorder);

  const memoryStatus = getMemoryStatus();

  const getMemoryColor = () => {
    if (!isEnabled) return 'gray.400';
    switch (memoryStrength) {
      case 'strong':
        return 'green.500';
      case 'moderate':
        return 'yellow.500';
      case 'weak':
        return 'red.500';
      default:
        return 'gray.400';
    }
  };

  const getMemoryIcon = () => {
    if (!isEnabled) return 'memory';
    switch (memoryStrength) {
      case 'strong':
        return 'psychology';
      case 'moderate':
        return 'lightbulb';
      case 'weak':
        return 'help-outline';
      default:
        return 'memory';
    }
  };

  const getStrengthPercentage = () => {
    switch (memoryStrength) {
      case 'strong':
        return 85;
      case 'moderate':
        return 60;
      case 'weak':
        return 25;
      default:
        return 0;
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setIsModalOpen(true);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggleMemory = async () => {
    try {
      await updateMemorySettings({ enabled: !isEnabled });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      toast.show({
        title: isEnabled ? 'Memory disabilitata' : 'Memory abilitata',
        colorScheme: isEnabled ? 'warning' : 'success',
      });
    } catch (error) {
      toast.show({
        title: 'Errore',
        description: 'Impossibile aggiornare le impostazioni',
        colorScheme: 'error',
      });
    }
  };

  const handleClearMemory = async () => {
    try {
      await clearAllMemory();
      setIsModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      toast.show({
        title: 'Memory cancellata',
        description: 'Tutte le conversazioni sono state eliminate',
        colorScheme: 'success',
      });
    } catch (error) {
      toast.show({
        title: 'Errore',
        description: 'Impossibile cancellare la memory',
        colorScheme: 'error',
      });
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportUserData();
      // In a real app, this would trigger a file download
      errorLogger.info('Exported memory data', 'MemoryIndicator.exportData', {
        dataSize: JSON.stringify(data).length,
      });

      toast.show({
        title: 'Dati esportati',
        description: 'I tuoi dati sono stati preparati per il download',
        colorScheme: 'success',
      });
    } catch (error) {
      toast.show({
        title: 'Errore',
        description: 'Impossibile esportare i dati',
        colorScheme: 'error',
      });
    }
  };

  const iconSize = size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'md';

  return (
    <>
      <Pressable onPress={handlePress} _pressed={{ opacity: 0.7 }}>
        <HStack alignItems="center" space={2}>
          <Icon
            as={MaterialIcons}
            name={getMemoryIcon()}
            size={iconSize}
            color={getMemoryColor()}
          />
          {showLabel && (
            <VStack>
              <Text fontSize="xs" color={getMemoryColor()} fontWeight="medium">
                Memory {memoryStrength}
              </Text>
              <Text fontSize="2xs" color="gray.500">
                {analytics.totalConversations} conversazioni
              </Text>
            </VStack>
          )}
        </HStack>
      </Pressable>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        <Modal.Content bg={bgColor}>
          <Modal.CloseButton />
          <Modal.Header>
            <HStack alignItems="center" space={3}>
              <Icon as={MaterialIcons} name="psychology" size="md" color={colors.primary} />
              <Text fontSize="lg" fontWeight="bold">
                Sistema Memory
              </Text>
            </HStack>
          </Modal.Header>

          <Modal.Body>
            <VStack space={4}>
              {/* Memory Status */}
              <VStack space={3}>
                <Text fontSize="md" fontWeight="semibold">
                  Stato Memory
                </Text>

                <HStack alignItems="center" justifyContent="space-between">
                  <Text>Memoria abilitata</Text>
                  <Switch
                    isChecked={isEnabled}
                    onToggle={handleToggleMemory}
                    colorScheme="primary"
                  />
                </HStack>

                {isEnabled && (
                  <>
                    <VStack space={2}>
                      <HStack justifyContent="space-between">
                        <Text fontSize="sm">Forza memoria:</Text>
                        <Badge
                          colorScheme={
                            memoryStrength === 'strong'
                              ? 'green'
                              : memoryStrength === 'moderate'
                                ? 'yellow'
                                : 'red'
                          }
                          variant="solid"
                        >
                          {memoryStrength.toUpperCase()}
                        </Badge>
                      </HStack>

                      <Progress
                        value={getStrengthPercentage()}
                        colorScheme={
                          memoryStrength === 'strong'
                            ? 'green'
                            : memoryStrength === 'moderate'
                              ? 'yellow'
                              : 'red'
                        }
                        size="sm"
                      />
                    </VStack>

                    <Divider />

                    {/* Statistics */}
                    <VStack space={2}>
                      <Text fontSize="md" fontWeight="semibold">
                        Statistiche
                      </Text>

                      <HStack justifyContent="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Conversazioni totali:
                        </Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {analytics.totalConversations}
                        </Text>
                      </HStack>

                      <HStack justifyContent="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Media sessione:
                        </Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {Math.round(analytics.averageSessionLength)} messaggi
                        </Text>
                      </HStack>

                      <HStack justifyContent="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Ultima attività:
                        </Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {memoryStatus.lastActivity}
                        </Text>
                      </HStack>
                    </VStack>

                    {analytics.topStrains.length > 0 && (
                      <>
                        <Divider />
                        <VStack space={2}>
                          <Text fontSize="md" fontWeight="semibold">
                            Strain preferiti
                          </Text>
                          <HStack flexWrap="wrap" space={1}>
                            {analytics.topStrains.slice(0, 3).map((strain, index) => (
                              <Badge key={index} colorScheme="green" variant="outline">
                                {strain}
                              </Badge>
                            ))}
                          </HStack>
                        </VStack>
                      </>
                    )}

                    {analytics.topEffects.length > 0 && (
                      <>
                        <Divider />
                        <VStack space={2}>
                          <Text fontSize="md" fontWeight="semibold">
                            Effetti preferiti
                          </Text>
                          <HStack flexWrap="wrap" space={1}>
                            {analytics.topEffects.slice(0, 3).map((effect, index) => (
                              <Badge key={index} colorScheme="blue" variant="outline">
                                {effect}
                              </Badge>
                            ))}
                          </HStack>
                        </VStack>
                      </>
                    )}
                  </>
                )}
              </VStack>
            </VStack>
          </Modal.Body>

          <Modal.Footer>
            <VStack w="100%" space={2}>
              {isEnabled && (
                <HStack space={2} w="100%">
                  <Button
                    flex={1}
                    variant="outline"
                    colorScheme="blue"
                    onPress={handleExportData}
                    leftIcon={<Icon as={MaterialIcons} name="download" />}
                  >
                    Esporta
                  </Button>
                  <Button
                    flex={1}
                    variant="outline"
                    colorScheme="red"
                    onPress={handleClearMemory}
                    leftIcon={<Icon as={MaterialIcons} name="delete" />}
                  >
                    Cancella
                  </Button>
                </HStack>
              )}

              <Button w="100%" variant="ghost" onPress={() => setIsModalOpen(false)}>
                Chiudi
              </Button>
            </VStack>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </>
  );
}
