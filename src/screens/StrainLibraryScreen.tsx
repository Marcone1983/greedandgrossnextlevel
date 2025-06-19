import { Platform } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import {
  VStack,
  HStack,
  Input,
  IconButton,
  Icon,
  Text,
  Select,
  CheckIcon,
  useToast,
  Actionsheet,
  useDisclose,
  Center,
  Spinner,
} from 'native-base';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';

import { RootState } from '@/store';
import { colors, gradients } from '@/constants/theme';
import { Strain } from '@/types';
import { setFilters, clearFilters, removeStrain } from '@/store/slices/strainSlice';
import { getStrains, saveStrains } from '@/services/storage';
import StrainCard from '@/components/StrainCard';
import { debounce } from '@/utils/helpers';

export default function StrainLibraryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [strains, setStrains] = useState<Strain[]>([]);
  const [filteredStrains, setFilteredStrains] = useState<Strain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclose();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const toast = useToast();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { filters } = useSelector((state: RootState) => state.strain);

  const loadStrains = useCallback(async () => {
    try {
      const savedStrains = await getStrains();
      setStrains(savedStrains);
    } catch (error) {
      toast.show({
        description: 'Errore nel caricamento delle strain',
        colorScheme: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterStrains = useCallback(() => {
    let filtered = [...strains];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(strain =>
        strain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strain.parentA.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strain.parentB.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(strain => strain.type === filters.type);
    }

    // Terpene filter
    if (filters.terpene) {
      filtered = filtered.filter(strain =>
        strain.terpenes.some(t => 
          t.name.toLowerCase().includes(filters.terpene!.toLowerCase())
        )
      );
    }

    // Effect filter
    if (filters.effect) {
      filtered = filtered.filter(strain =>
        strain.effects.some(e => 
          e.toLowerCase().includes(filters.effect!.toLowerCase())
        )
      );
    }

    setFilteredStrains(filtered);
  }, [strains, searchQuery, filters]);

  useEffect(() => {
    loadStrains();
  }, [loadStrains]);

  useEffect(() => {
    filterStrains();
  }, [filterStrains, searchQuery, filters, strains]);

  const handleSearch = debounce((text: string) => {
    setSearchQuery(text);
  }, 300);

  const handleStrainPress = (strain: Strain) => {
    if (user?.tier === 'free' && strains.length >= 10) {
      navigation.navigate('Paywall', { feature: 'unlimited_strains' });
      return;
    }
    setSelectedStrain(strain);
    onOpen();
  };

  const handleDeleteStrain = (strainId: string) => {
    Alert.alert(
      'Elimina Strain',
      'Sei sicuro di voler eliminare questa strain dalla tua libreria?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            const updatedStrains = strains.filter(s => s.id !== strainId);
            setStrains(updatedStrains);
            saveStrains(updatedStrains);
            dispatch(removeStrain(strainId));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleExportPDF = useCallback(async () => {
    if (user?.tier === 'free') {
      navigation.navigate('Paywall', { feature: 'export_pdf' });
      return;
    }

    try {
      const pdfContent = generatePDFContent(filteredStrains);
      const fileUri = `${FileSystem.documentDirectory}strain_library.pdf`;
      
      // In a real app, you'd use react-native-pdf or similar
      await FileSystem.writeAsStringAsync(fileUri, pdfContent);
      await Sharing.shareAsync(fileUri);
      
      toast.show({
        description: 'PDF esportato con successo',
        colorScheme: 'success',
      });
    } catch (error) {
      toast.show({
        description: 'Errore durante l\'esportazione',
        colorScheme: 'error',
      });
    }
  }, []);

  const generatePDFContent = (strains: Strain[]): string => {
    return JSON.stringify(strains, null, 2); // Simplified for now
  };

  const renderStrainItem = ({ item }: { item: Strain }) => (
    <StrainCard
      strain={item}
      onPress={() => handleStrainPress(item)}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Center flex={1}>
          <Spinner size="lg" color={colors.primary} />
          <Text color={colors.textSecondary} mt={4}>
            Caricamento libreria...
          </Text>
        </Center>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.dark}
        style={styles.headerGradient}
      >
        <VStack space={3} px={4} py={2}>
          <HStack alignItems="center" justifyContent="space-between">
            <HStack alignItems="center" space={2}>
              <Icon as={MaterialCommunityIcons} name="cannabis" size={6} color={colors.primary} />
              <VStack>
                <Text fontSize="lg" fontWeight="bold" color={colors.text}>
                  Strain Library
                </Text>
                <Text fontSize="xs" color={colors.textSecondary}>
                  {filteredStrains.length} strain disponibili
                </Text>
              </VStack>
            </HStack>
            <HStack space={2}>
              <IconButton
                icon={<Icon as={MaterialIcons} name="filter-list" />}
                onPress={() => dispatch(clearFilters())}
                size="sm"
              />
              <IconButton
                icon={<Icon as={MaterialIcons} name="file-download" />}
                onPress={handleExportPDF}
                size="sm"
              />
            </HStack>
          </HStack>

          {/* Search */}
          <Input
            placeholder="Cerca per nome, genitori, effetti..."
            onChangeText={handleSearch}
            size="md"
            bg="gray.800"
            borderColor={colors.border}
            _focus={{
              borderColor: colors.primary,
              bg: 'gray.700',
            }}
            InputLeftElement={
              <Icon
                as={MaterialIcons}
                name="search"
                size={5}
                color={colors.textSecondary}
                ml={3}
              />
            }
            style={styles.input}
          />

          {/* Filters */}
          <HStack space={2}>
            <Select
              selectedValue={filters.type}
              placeholder="Tipo"
              onValueChange={(value) => dispatch(setFilters({ type: value as 'sativa' | 'indica' | 'hybrid' | 'all' }))}
              dropdownIcon={<Icon as={MaterialIcons} name="arrow-drop-down" />}
              _selectedItem={{
                bg: colors.primary,
                endIcon: <CheckIcon size="5" />,
              }}
              flex={1}
              bg="gray.800"
            >
              <Select.Item label="Tutti" value="all" />
              <Select.Item label="Sativa" value="sativa" />
              <Select.Item label="Indica" value="indica" />
              <Select.Item label="Hybrid" value="hybrid" />
            </Select>

            <Input
              placeholder="Terpene"
              value={filters.terpene || ''}
              onChangeText={(value) => dispatch(setFilters({ terpene: value }))}
              flex={1}
              bg="gray.800"
            />

            <Input
              placeholder="Effetto"
              value={filters.effect || ''}
              onChangeText={(value) => dispatch(setFilters({ effect: value }))}
              flex={1}
              bg="gray.800"
            />
          </HStack>
        </VStack>
      </LinearGradient>

      {filteredStrains.length === 0 ? (
        <Center flex={1}>
          <Icon
            as={MaterialCommunityIcons}
            name="cannabis-off"
            size={20}
            color={colors.textSecondary}
            mb={4}
          />
          <Text color={colors.textSecondary} textAlign="center" fontSize="lg">
            Nessuna strain trovata
          </Text>
          <Text color={colors.textSecondary} textAlign="center" mt={2}>
            Prova a modificare i filtri o crea nuove strain
          </Text>
        </Center>
      ) : (
        <FlatList
          data={filteredStrains}
          keyExtractor={(item) => item.id}
          renderItem={renderStrainItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content>
          <Actionsheet.Item
            startIcon={<Icon as={MaterialIcons} name="share" />}
            onPress={() => {
              // Share strain logic
              onClose();
            }}
          >
            Condividi Strain
          </Actionsheet.Item>
          <Actionsheet.Item
            startIcon={<Icon as={MaterialIcons} name="file-download" />}
            onPress={() => {
              // Export single strain
              onClose();
            }}
          >
            Esporta PDF
          </Actionsheet.Item>
          <Actionsheet.Item
            startIcon={<Icon as={MaterialIcons} name="delete" />}
            _text={{ color: 'red.500' }}
            onPress={() => {
              if (selectedStrain) {
                handleDeleteStrain(selectedStrain.id);
              }
              onClose();
            }}
          >
            Elimina dalla Libreria
          </Actionsheet.Item>
        </Actionsheet.Content>
      </Actionsheet>
    </View>
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
  input: {
    fontFamily: 'Roboto',
    color: colors.text,
  },
  list: {
    padding: 16,
  },
});