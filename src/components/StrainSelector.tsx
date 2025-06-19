import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import {
  VStack,
  HStack,
  Text,
  IconButton,
  Icon,
  Badge,
  Divider,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '@/constants/theme';
import { debounce } from '@/utils/helpers';

interface StrainSelectorProps {
  onSelect: (parentA: string, parentB: string) => void;
  onClose: () => void;
}

const POPULAR_STRAINS = [
  'OG Kush', 'White Widow', 'AK-47', 'Northern Lights', 'Sour Diesel',
  'Blue Dream', 'Girl Scout Cookies', 'Gorilla Glue #4', 'Purple Haze',
  'Jack Herer', 'Granddaddy Purple', 'Green Crack', 'Amnesia Haze',
  'Lemon Haze', 'Pineapple Express', 'Gelato', 'Wedding Cake',
  'Zkittlez', 'Runtz', 'MAC', 'Cherry Pie', 'Strawberry Cough',
];

export default function StrainSelector({ onSelect, onClose }: StrainSelectorProps) {
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [filteredStrainsA, setFilteredStrainsA] = useState(POPULAR_STRAINS);
  const [filteredStrainsB, setFilteredStrainsB] = useState(POPULAR_STRAINS);

  const handleSearchA = debounce((text: string) => {
    const filtered = POPULAR_STRAINS.filter(strain =>
      strain.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredStrainsA(filtered);
  }, 300);

  const handleSearchB = debounce((text: string) => {
    const filtered = POPULAR_STRAINS.filter(strain =>
      strain.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredStrainsB(filtered);
  }, 300);

  const handleConfirm = () => {
    if (selectedA && selectedB) {
      onSelect(selectedA, selectedB);
    }
  };

  const renderStrainItem = (item: string, isParentA: boolean) => (
    <TouchableOpacity
      onPress={() => isParentA ? setSelectedA(item) : setSelectedB(item)}
      style={[
        styles.strainItem,
        (isParentA ? selectedA : selectedB) === item && styles.selectedStrain,
      ]}
    >
      <HStack alignItems="center" justifyContent="space-between">
        <Text color={colors.text}>{item}</Text>
        {(isParentA ? selectedA : selectedB) === item && (
          <Icon as={MaterialIcons} name="check" size={5} color={colors.primary} />
        )}
      </HStack>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={gradients.dark}
            style={styles.header}
          >
            <HStack alignItems="center" justifyContent="space-between">
              <Text fontSize="xl" fontWeight="bold" color={colors.text}>
                Seleziona Genitori
              </Text>
              <IconButton
                icon={<Icon as={MaterialIcons} name="close" />}
                onPress={onClose}
              />
            </HStack>
          </LinearGradient>

          <VStack style={styles.content} space={4}>
            {/* Parent A */}
            <VStack space={2}>
              <Text fontSize="lg" fontWeight="bold" color={colors.text}>
                Genitore A
              </Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Cerca strain..."
                placeholderTextColor={colors.textSecondary}
                value={searchA}
                onChangeText={(text) => {
                  setSearchA(text);
                  handleSearchA(text);
                }}
              />
              <View style={styles.listContainer}>
                <FlatList
                  data={filteredStrainsA}
                  keyExtractor={(item) => `a-${item}`}
                  renderItem={({ item }) => renderStrainItem(item, true)}
                  showsVerticalScrollIndicator={false}
                />
              </View>
              {selectedA && (
                <Badge colorScheme="primary" alignSelf="flex-start">
                  {selectedA}
                </Badge>
              )}
            </VStack>

            <Divider bg={colors.border} />

            {/* Parent B */}
            <VStack space={2}>
              <Text fontSize="lg" fontWeight="bold" color={colors.text}>
                Genitore B
              </Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Cerca strain..."
                placeholderTextColor={colors.textSecondary}
                value={searchB}
                onChangeText={(text) => {
                  setSearchB(text);
                  handleSearchB(text);
                }}
              />
              <View style={styles.listContainer}>
                <FlatList
                  data={filteredStrainsB}
                  keyExtractor={(item) => `b-${item}`}
                  renderItem={({ item }) => renderStrainItem(item, false)}
                  showsVerticalScrollIndicator={false}
                />
              </View>
              {selectedB && (
                <Badge colorScheme="primary" alignSelf="flex-start">
                  {selectedB}
                </Badge>
              )}
            </VStack>
          </VStack>

          <HStack style={styles.footer} space={3}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text color={colors.textSecondary}>Annulla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                (!selectedA || !selectedB) && styles.disabledButton,
              ]}
              onPress={handleConfirm}
              disabled={!selectedA || !selectedB}
            >
              <Text color="white" fontWeight="bold">
                Conferma Incrocio
              </Text>
            </TouchableOpacity>
          </HStack>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    padding: 20,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontFamily: 'Roboto',
  },
  listContainer: {
    maxHeight: 150,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 8,
  },
  strainItem: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedStrain: {
    backgroundColor: colors.primary + '20',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
});