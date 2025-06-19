import React, { useState, useEffect } from 'react';
import { RefreshControl } from 'react-native';
import {
  VStack,
  HStack,
  Text,
  ScrollView,
  Box,
  Pressable,
  Icon,
  Input,
  Button,
  Badge,
  Divider,
  Modal,
  useColorModeValue,
  useToast,
  FlatList,
  Spinner,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/constants/theme';
import { useConversationMemory } from '@/hooks/useConversationMemory';
import { ConversationEntry } from '@/services/memoryService';
import * as Haptics from 'expo-haptics';

interface ConversationItemProps {
  key?: string | number;
  conversation: ConversationEntry;
  onPress: () => void;
}

function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const bgColor = useColorModeValue('white', colors.darkCard);
  const borderColor = useColorModeValue('gray.200', colors.darkBorder);

  const formatTime = (date: Date) => {
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQueryTypeColor = (type: ConversationEntry['queryType']) => {
    switch (type) {
      case 'breeding': return 'green';
      case 'recommendation': return 'blue';
      case 'education': return 'purple';
      default: return 'gray';
    }
  };

  const getQueryTypeLabel = (type: ConversationEntry['queryType']) => {
    switch (type) {
      case 'breeding': return 'Breeding';
      case 'recommendation': return 'Consigli';
      case 'education': return 'Educazione';
      default: return 'Generale';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      _pressed={{ opacity: 0.7 }}
    >
      <Box
        bg={bgColor}
        borderWidth={1}
        borderColor={borderColor}
        borderRadius="lg"
        p={4}
        mb={3}
      >
        <VStack space={3}>
          {/* Header */}
          <HStack justifyContent="space-between" alignItems="flex-start">
            <VStack flex={1} space={1}>
              <Text fontSize="sm" fontWeight="medium" numberOfLines={2}>
                {conversation.query.substring(0, 80)}...
              </Text>
              <Text fontSize="xs" color="gray.500">
                {formatTime(conversation.timestamp)}
              </Text>
            </VStack>
            
            <VStack alignItems="flex-end" space={1}>
              <Badge
                colorScheme={getQueryTypeColor(conversation.queryType)}
                variant="solid"
                size="sm"
              >
                {getQueryTypeLabel(conversation.queryType)}
              </Badge>
              {conversation.isEncrypted && (
                <Icon as={MaterialIcons} name="lock" size="xs" color="gray.400" />
              )}
            </VStack>
          </HStack>

          {/* Strains mentioned */}
          {conversation.strainsHentioned && conversation.strainsHentioned.length > 0 && (
            <HStack space={1} flexWrap="wrap">
              <Text fontSize="xs" color="gray.600">Strain:</Text>
              {conversation.strainsHentioned.slice(0, 3).map((strain, index) => (
                <Badge key={index} colorScheme="green" variant="outline" size="xs">
                  {strain}
                </Badge>
              ))}
            </HStack>
          )}

          {/* Effects mentioned */}
          {conversation.effectsRequested && conversation.effectsRequested.length > 0 && (
            <HStack space={1} flexWrap="wrap">
              <Text fontSize="xs" color="gray.600">Effetti:</Text>
              {conversation.effectsRequested.slice(0, 3).map((effect, index) => (
                <Badge key={index} colorScheme="blue" variant="outline" size="xs">
                  {effect}
                </Badge>
              ))}
            </HStack>
          )}

          {/* User feedback */}
          {conversation.userFeedback && (
            <HStack alignItems="center" space={2}>
              <Icon
                as={MaterialIcons}
                name={conversation.userFeedback === 'helpful' ? 'thumb-up' : 'thumb-down'}
                size="xs"
                color={conversation.userFeedback === 'helpful' ? 'green.500' : 'red.500'}
              />
              <Text fontSize="xs" color="gray.600">
                {conversation.userFeedback === 'helpful' ? 'Utile' : 'Non utile'}
              </Text>
            </HStack>
          )}
        </VStack>
      </Box>
    </Pressable>
  );
}

export default function ConversationHistoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();

  const {
    recentConversations,
    analytics,
    isLoaded,
    loadConversationContext,
    clearAllMemory,
    exportUserData
  } = useConversationMemory();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ConversationEntry['queryType'] | 'all'>('all');
  const [selectedConversation, setSelectedConversation] = useState<ConversationEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const bgColor = useColorModeValue('gray.50', colors.darkBackground);

  useEffect(() => {
    if (!isLoaded) {
      loadConversationContext();
    }
  }, [isLoaded, loadConversationContext]);

  const filteredConversations = recentConversations.filter(conv => {
    const matchesSearch = searchQuery === '' || 
      conv.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.aiResponse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.strainsHentioned?.some(strain => 
        strain.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesType = filterType === 'all' || conv.queryType === filterType;

    return matchesSearch && matchesType;
  });

  const handleConversationPress = (conversation: ConversationEntry) => {
    setSelectedConversation(conversation);
    setIsDetailModalOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadConversationContext();
    } catch (error) {
      toast.show({
        title: 'Errore',
        description: 'Impossibile aggiornare la cronologia',
        colorScheme: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearAllMemory();
      navigation.goBack();
      
      toast.show({
        title: 'Cronologia cancellata',
        description: 'Tutte le conversazioni sono state eliminate',
        colorScheme: 'success',
      });
    } catch (error) {
      toast.show({
        title: 'Errore',
        description: 'Impossibile cancellare la cronologia',
        colorScheme: 'error',
      });
    }
  };

  const handleExportHistory = async () => {
    try {
      const data = await exportUserData();
      
      toast.show({
        title: 'Esportazione completata',
        description: 'I dati sono pronti per il download',
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

  const renderFilterButton = (type: ConversationEntry['queryType'] | 'all', label: string) => (
    <Button
      key={type}
      size="sm"
      variant={filterType === type ? 'solid' : 'outline'}
      colorScheme={filterType === type ? 'primary' : 'gray'}
      onPress={() => setFilterType(type)}
    >
      {label}
    </Button>
  );

  if (!isLoaded) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg={bgColor}>
        <Spinner size="lg" color={colors.primary} />
        <Text mt={4} color="gray.500">Caricamento cronologia...</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg={bgColor}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <VStack space={4} p={4}>
          {/* Header */}
          <VStack space={3}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack>
                <Text fontSize="xl" fontWeight="bold">
                  Cronologia Conversazioni
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {analytics.totalConversations} conversazioni totali
                </Text>
              </VStack>
              
              <HStack space={2}>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  onPress={handleExportHistory}
                  leftIcon={<Icon as={MaterialIcons} name="download" />}
                >
                  Esporta
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="red"
                  onPress={handleClearHistory}
                  leftIcon={<Icon as={MaterialIcons} name="delete" />}
                >
                  Cancella
                </Button>
              </HStack>
            </HStack>

            {/* Search */}
            <Input
              placeholder="Cerca conversazioni..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              InputLeftElement={
                <Icon as={MaterialIcons} name="search" size="sm" ml={3} color="gray.400" />
              }
              InputRightElement={
                searchQuery ? (
                  <Pressable onPress={() => setSearchQuery('')} pr={3}>
                    <Icon as={MaterialIcons} name="clear" size="sm" color="gray.400" />
                  </Pressable>
                ) : undefined
              }
              bg={useColorModeValue('white', colors.darkCard)}
            />

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <HStack space={2}>
                {renderFilterButton('all', 'Tutte')}
                {renderFilterButton('breeding', 'Breeding')}
                {renderFilterButton('recommendation', 'Consigli')}
                {renderFilterButton('education', 'Educazione')}
                {renderFilterButton('general', 'Generale')}
              </HStack>
            </ScrollView>
          </VStack>

          {/* Statistics */}
          {analytics.totalConversations > 0 && (
            <Box
              bg={useColorModeValue('white', colors.darkCard)}
              p={4}
              borderRadius="lg"
              borderWidth={1}
              borderColor={useColorModeValue('gray.200', colors.darkBorder)}
            >
              <VStack space={3}>
                <Text fontSize="md" fontWeight="semibold">
                  Statistiche
                </Text>
                
                <HStack justifyContent="space-around">
                  <VStack alignItems="center">
                    <Text fontSize="lg" fontWeight="bold" color={colors.primary}>
                      {analytics.totalConversations}
                    </Text>
                    <Text fontSize="xs" color="gray.500">Conversazioni</Text>
                  </VStack>
                  
                  <VStack alignItems="center">
                    <Text fontSize="lg" fontWeight="bold" color={colors.primary}>
                      {Math.round(analytics.averageSessionLength)}
                    </Text>
                    <Text fontSize="xs" color="gray.500">Media/sessione</Text>
                  </VStack>
                  
                  <VStack alignItems="center">
                    <Text fontSize="lg" fontWeight="bold" color={colors.primary}>
                      {analytics.topStrains.length}
                    </Text>
                    <Text fontSize="xs" color="gray.500">Strain discussi</Text>
                  </VStack>
                </HStack>

                {analytics.topStrains.length > 0 && (
                  <>
                    <Divider />
                    <VStack space={2}>
                      <Text fontSize="sm" fontWeight="medium">Strain più discussi:</Text>
                      <HStack flexWrap="wrap" space={1}>
                        {analytics.topStrains.slice(0, 5).map((strain, index) => (
                          <Badge key={index} colorScheme="green" variant="outline">
                            {strain}
                          </Badge>
                        ))}
                      </HStack>
                    </VStack>
                  </>
                )}
              </VStack>
            </Box>
          )}

          {/* Conversation List */}
          <VStack space={3}>
            <Text fontSize="md" fontWeight="semibold">
              Conversazioni ({filteredConversations.length})
            </Text>
            
            {filteredConversations.length === 0 ? (
              <Box
                bg={useColorModeValue('white', colors.darkCard)}
                p={8}
                borderRadius="lg"
                alignItems="center"
              >
                <Icon
                  as={MaterialIcons}
                  name="chat-bubble-outline"
                  size="xl"
                  color="gray.400"
                  mb={3}
                />
                <Text color="gray.500" textAlign="center">
                  {searchQuery || filterType !== 'all' 
                    ? 'Nessuna conversazione trovata con i filtri attuali'
                    : 'Nessuna conversazione ancora. Inizia a chattare!'
                  }
                </Text>
              </Box>
            ) : (
              filteredConversations.map((conversation, index) => (
                <ConversationItem
                  key={conversation.id || index}
                  conversation={conversation}
                  onPress={() => handleConversationPress(conversation)}
                />
              ))
            )}
          </VStack>

          <Box h={10} />
        </VStack>
      </ScrollView>

      {/* Conversation Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        size="full"
      >
        <Modal.Content maxW="95%" maxH="95%">
          <Modal.CloseButton />
          <Modal.Header>
            <Text fontSize="lg" fontWeight="bold">
              Dettagli Conversazione
            </Text>
          </Modal.Header>

          <Modal.Body>
            {selectedConversation && (
              <VStack space={4}>
                {/* Metadata */}
                <Box
                  bg={useColorModeValue('gray.50', colors.darkCard)}
                  p={3}
                  borderRadius="md"
                >
                  <VStack space={2}>
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color="gray.600">Data:</Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {selectedConversation.timestamp.toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </HStack>
                    
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color="gray.600">Tipo:</Text>
                      <Badge
                        colorScheme={
                          selectedConversation.queryType === 'breeding' ? 'green' :
                          selectedConversation.queryType === 'recommendation' ? 'blue' :
                          selectedConversation.queryType === 'education' ? 'purple' : 'gray'
                        }
                        variant="solid"
                        size="sm"
                      >
                        {selectedConversation.queryType}
                      </Badge>
                    </HStack>
                    
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color="gray.600">Sessione:</Text>
                      <Text fontSize="sm" fontFamily="monospace">
                        {selectedConversation.sessionId.substring(0, 16)}...
                      </Text>
                    </HStack>
                  </VStack>
                </Box>

                {/* Query */}
                <VStack space={2}>
                  <Text fontSize="md" fontWeight="semibold" color={colors.primary}>
                    Domanda:
                  </Text>
                  <Box
                    bg={useColorModeValue('blue.50', colors.darkCard)}
                    p={3}
                    borderRadius="md"
                    borderLeftWidth={3}
                    borderLeftColor="blue.500"
                  >
                    <Text fontSize="sm">
                      {selectedConversation.query}
                    </Text>
                  </Box>
                </VStack>

                {/* Response */}
                <VStack space={2}>
                  <Text fontSize="md" fontWeight="semibold" color={colors.primary}>
                    Risposta:
                  </Text>
                  <Box
                    bg={useColorModeValue('green.50', colors.darkCard)}
                    p={3}
                    borderRadius="md"
                    borderLeftWidth={3}
                    borderLeftColor="green.500"
                  >
                    <Text fontSize="sm">
                      {selectedConversation.aiResponse}
                    </Text>
                  </Box>
                </VStack>

                {/* Tags */}
                {(selectedConversation.strainsHentioned?.length > 0 || 
                  (selectedConversation.effectsRequested && selectedConversation.effectsRequested.length > 0)) && (
                  <VStack space={3}>
                    <Text fontSize="md" fontWeight="semibold">
                      Tags:
                    </Text>
                    
                    {selectedConversation.strainsHentioned?.length > 0 && (
                      <VStack space={2}>
                        <Text fontSize="sm" color="gray.600">Strain menzionati:</Text>
                        <HStack flexWrap="wrap" space={1}>
                          {selectedConversation.strainsHentioned.map((strain, index) => (
                            <Badge key={index} colorScheme="green" variant="outline">
                              {strain}
                            </Badge>
                          ))}
                        </HStack>
                      </VStack>
                    )}
                    
                    {selectedConversation.effectsRequested && selectedConversation.effectsRequested.length > 0 && (
                      <VStack space={2}>
                        <Text fontSize="sm" color="gray.600">Effetti richiesti:</Text>
                        <HStack flexWrap="wrap" space={1}>
                          {selectedConversation.effectsRequested.map((effect, index) => (
                            <Badge key={index} colorScheme="blue" variant="outline">
                              {effect}
                            </Badge>
                          ))}
                        </HStack>
                      </VStack>
                    )}
                  </VStack>
                )}
              </VStack>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="ghost"
              onPress={() => setIsDetailModalOpen(false)}
            >
              Chiudi
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Box>
  );
}