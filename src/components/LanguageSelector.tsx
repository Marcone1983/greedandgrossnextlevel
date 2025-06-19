import React, { useState } from 'react';
import { Alert } from 'react-native';
import {
  VStack,
  HStack,
  Text,
  Pressable,
  Icon,
  Modal,
  Button,
  Box,
  FlatList,
  Radio,
  useColorModeValue,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, SupportedLanguage, changeLanguage } from '@/i18n';
import { colors } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange?: (language: SupportedLanguage) => void;
}

export default function LanguageSelector({ 
  currentLanguage, 
  onLanguageChange 
}: LanguageSelectorProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [isChanging, setIsChanging] = useState(false);

  const bgColor = useColorModeValue('white', colors.darkCard);
  const borderColor = useColorModeValue('gray.200', colors.darkBorder);

  const handleLanguageSelect = (language: SupportedLanguage) => {
    setSelectedLanguage(language);
    Haptics.selectionAsync();
  };

  const confirmLanguageChange = () => {
    if (selectedLanguage === currentLanguage) {
      setIsModalOpen(false);
      return;
    }

    Alert.alert(
      t('settings.language.changeLanguage'),
      t('settings.language.confirmChange', { 
        language: LANGUAGES[selectedLanguage].nativeName 
      }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => {
            setSelectedLanguage(currentLanguage);
          },
        },
        {
          text: t('common.confirm'),
          onPress: async () => {
            setIsChanging(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            try {
              await changeLanguage(selectedLanguage);
              onLanguageChange?.(selectedLanguage);
              setIsModalOpen(false);
              
              // Show reload message
              Alert.alert(
                t('settings.language.changeLanguage'),
                t('settings.language.reloadRequired'),
                [{ text: t('common.done') }]
              );
            } catch (error) {
              console.error('Error changing language:', error);
              Alert.alert(t('common.error'), t('errors.unknownError'));
            } finally {
              setIsChanging(false);
            }
          },
        },
      ]
    );
  };

  const renderLanguageItem = ({ item }: { item: SupportedLanguage }) => {
    const language = LANGUAGES[item];
    const isSelected = selectedLanguage === item;
    
    return (
      <Pressable
        onPress={() => handleLanguageSelect(item)}
        bg={isSelected ? colors.primary + '20' : 'transparent'}
        p={4}
        borderRadius="md"
        _pressed={{ bg: colors.primary + '10' }}
      >
        <HStack alignItems="center" space={3}>
          <Text fontSize="xl">{language.flag}</Text>
          <VStack flex={1}>
            <Text 
              fontSize="md" 
              fontWeight={isSelected ? 'semibold' : 'normal'}
              color={isSelected ? colors.primary : undefined}
            >
              {language.nativeName}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {language.name}
            </Text>
          </VStack>
          <Radio.Icon
            icon={<Icon as={MaterialIcons} name="check" />}
            _checked={{ 
              color: colors.primary,
              bg: colors.primary + '20' 
            }}
          />
        </HStack>
      </Pressable>
    );
  };

  return (
    <>
      <Pressable
        onPress={() => setIsModalOpen(true)}
        bg={bgColor}
        borderWidth={1}
        borderColor={borderColor}
        borderRadius="lg"
        p={4}
        _pressed={{ bg: colors.primary + '10' }}
      >
        <HStack alignItems="center" justifyContent="space-between">
          <HStack alignItems="center" space={3}>
            <Icon as={MaterialIcons} name="language" size="md" color={colors.primary} />
            <VStack>
              <Text fontSize="md" fontWeight="medium">
                {t('settings.language.title')}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {LANGUAGES[currentLanguage].nativeName}
              </Text>
            </VStack>
          </HStack>
          <Icon as={MaterialIcons} name="arrow-forward-ios" size="sm" color="gray.400" />
        </HStack>
      </Pressable>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
      >
        <Modal.Content bg={bgColor}>
          <Modal.CloseButton />
          <Modal.Header>
            <Text fontSize="lg" fontWeight="bold">
              {t('settings.language.title')}
            </Text>
          </Modal.Header>
          
          <Modal.Body>
            <Text fontSize="sm" color="gray.500" mb={4}>
              {t('settings.language.description')}
            </Text>
            
            <FlatList
              data={Object.keys(LANGUAGES) as SupportedLanguage[]}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
            />
          </Modal.Body>
          
          <Modal.Footer>
            <Button.Group space={2}>
              <Button
                variant="ghost"
                colorScheme="blueGray"
                onPress={() => {
                  setSelectedLanguage(currentLanguage);
                  setIsModalOpen(false);
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                bg={colors.primary}
                onPress={confirmLanguageChange}
                isLoading={isChanging}
                isDisabled={selectedLanguage === currentLanguage}
              >
                {t('common.confirm')}
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </>
  );
}