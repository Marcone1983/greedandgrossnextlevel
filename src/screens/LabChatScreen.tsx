import { errorLogger } from '@/services/errorLogger';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  VStack,
  HStack,
  Input,
  IconButton,
  Icon,
  Text,
  Avatar,
  useToast,
  Badge,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Haptics } from '@/utils/expoCompat';
import LinearGradient from 'react-native-linear-gradient';

import { RootState } from '@/store';
import { colors, gradients } from '@/constants/theme';
import { CrossResult, ChatMessage } from '@/types';
import { setCrossResult, setCrossLoading } from '@/store/slices/strainSlice';
import { incrementDailyUsage } from '@/store/slices/authSlice';
import { performCrossBreeding } from '@/services/ai';
import { saveCrossResult } from '@/services/storage';
import ChatBubble from '@/components/ChatBubble';
import StrainSelector from '@/components/StrainSelector';
import MemoryIndicator from '@/components/MemoryIndicator';
import { useConversationMemory } from '@/hooks/useConversationMemory';

const AI_AVATAR = require('@assets/images/ai-scientist.png');

export default function LabChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showStrainSelector, setShowStrainSelector] = useState(false);
  const [selectedParents, setSelectedParents] = useState<{ parentA?: string; parentB?: string }>(
    {}
  );

  const flatListRef = useRef<any>(null);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const toast = useToast();

  const { user } = useSelector((state: RootState) => state.auth);
  const { isLoading } = useSelector((state: RootState) => state.strain);

  // Memory system integration
  const { saveConversation, getContextPrompt, getSuggestedPrompts, memoryEnabled, contextSummary } =
    useConversationMemory();

  useEffect(() => {
    const contextPrompt = memoryEnabled ? getContextPrompt() : '';
    const isReturningUser = contextSummary && contextSummary.length > 0;

    const welcomeMessage: ChatMessage = {
      id: '1',
      userId: 'ai',
      username: 'GREED & GROSS',
      content: `${isReturningUser ? 'Bentornato' : 'Benvenuto'} nel laboratorio genetico! Sono GREED & GROSS, il tuo esperto di breeding cannabis. 

${
  isReturningUser && contextPrompt
    ? `🧠 Ho memoria delle nostre conversazioni precedenti: ${contextPrompt}

`
    : ''
}Posso aiutarti a simulare incroci genetici, analizzare terpeni, prevedere fenotipi e molto altro. 

${user?.tier === 'free' ? '🔬 Hai 1 incrocio gratuito disponibile oggi.' : '🔬 Premium: Incroci illimitati disponibili!'}${memoryEnabled ? "\n\n💾 Sistema di memoria attivo - le nostre conversazioni vengono ricordate per un'esperienza personalizzata." : ''}`,
      timestamp: new Date(),
      type: 'ai',
    };
    setMessages([welcomeMessage]);
  }, [user, contextSummary, memoryEnabled]);

  const checkUsageLimit = () => {
    if (user?.tier === 'free' && user.stats.dailyCrossesUsed >= 1) {
      navigation.navigate('Paywall', { feature: 'unlimited_crosses' });
      return false;
    }
    return true;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !checkUsageLimit()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: user!.id,
      username: user!.username,
      content: inputText,
      timestamp: new Date(),
      type: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    dispatch(setCrossLoading(true));
    dispatch(incrementDailyUsage('crosses'));

    try {
      const contextPrompt = memoryEnabled ? getContextPrompt() : undefined;
      const result = await performCrossBreeding(
        {
          parentA: selectedParents.parentA || extractStrainFromText(inputText, 0),
          parentB: selectedParents.parentB || extractStrainFromText(inputText, 1),
          userId: user!.id,
        },
        contextPrompt
      );

      await saveCrossResult(result);
      dispatch(setCrossResult(result));

      const aiResponseContent = formatCrossResult(result);
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        userId: 'ai',
        username: 'GREED & GROSS',
        content: aiResponseContent,
        timestamp: new Date(),
        type: 'ai',
        attachments: [
          {
            type: 'strain',
            data: result.result,
          },
        ],
      };

      setMessages(prev => [...prev, aiResponse]);

      // Save conversation to memory system
      if (memoryEnabled) {
        try {
          const strainsMentioned = [
            selectedParents.parentA || extractStrainFromText(inputText, 0),
            selectedParents.parentB || extractStrainFromText(inputText, 1),
            result.result.name,
          ].filter(Boolean);

          await saveConversation(inputText, aiResponseContent, strainsMentioned);
        } catch (memoryError) {
          errorLogger.error(
            'Failed to save conversation to memory',
            memoryError,
            'LabChatScreen.sendMessage'
          );
          // Don't show error to user as this is a background operation
        }
      }
    } catch (error) {
      toast.show({
        description: "Errore durante l'incrocio",
        colorScheme: 'error',
      });
    } finally {
      dispatch(setCrossLoading(false));
    }
  };

  const extractStrainFromText = (text: string, index: number): string => {
    const strains = text.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) || [];
    return strains[index] || 'Unknown Strain';
  };

  const formatCrossResult = (result: CrossResult): string => {
    const { result: strain, prediction } = result;
    return `🧬 **Risultato Incrocio Genetico**

**Nome:** ${strain.name}
**Tipo:** ${strain.type}
**THC:** ${strain.thc}% | **CBD:** ${strain.cbd}%

**Profilo Terpenico:**
${strain.terpenes.map(t => `• ${t.name}: ${t.percentage}%`).join('\n')}

**Effetti Previsti:**
${strain.effects.join(', ')}

**Caratteristiche Genetiche:**
• Tempo di fioritura: ${strain.genetics.floweringTime} settimane
• Resa: ${strain.genetics.yield}
• Difficoltà: ${strain.genetics.difficulty}

**Confidence:** ${prediction.confidence}%
${result.cached ? '\n📌 Risultato dalla cache' : '\n✨ Nuovo incrocio calcolato'}`;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={styles.messageContainer}>
      {item.type === 'ai' && <Avatar source={AI_AVATAR} size="sm" style={styles.avatar} />}
      <ChatBubble
        message={item}
        isAI={item.type === 'ai'}
        onStrainPress={strain => {
          navigation.navigate('StrainLibrary', { selectedStrain: strain });
        }}
      />
    </View>
  );

  const suggestedPrompts = getSuggestedPrompts();

  const handleSuggestedPromptPress = (prompt: string) => {
    setInputText(prompt);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.dark} style={styles.headerGradient}>
        <HStack alignItems="center" justifyContent="space-between" px={4} py={2}>
          <HStack alignItems="center" space={2}>
            <Icon as={MaterialIcons} name="science" size={6} color={colors.primary} />
            <Text fontSize="lg" fontWeight="bold" color={colors.text}>
              Laboratorio AI
            </Text>
          </HStack>
          <HStack alignItems="center" space={2}>
            <Badge colorScheme="primary" variant="subtle">
              {user?.tier === 'free' ? `${1 - user.stats.dailyCrossesUsed}/1` : '∞'} Incroci
            </Badge>
            <TouchableOpacity
              onPress={() => navigation.navigate('ConversationHistory')}
              style={styles.historyButton}
            >
              <Icon as={MaterialIcons} name="history" size={5} color={colors.text} />
            </TouchableOpacity>
          </HStack>
        </HStack>
      </LinearGradient>

      <MemoryIndicator position="top-right" showDetails={true} />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text color={colors.textSecondary} fontSize="sm" mt={2}>
            Analizzando genetica...
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        {showStrainSelector && (
          <StrainSelector
            onSelect={(parentA, parentB) => {
              setSelectedParents({ parentA, parentB });
              setShowStrainSelector(false);
              setInputText(`Incrocia ${parentA} x ${parentB}`);
            }}
            onClose={() => setShowStrainSelector(false)}
          />
        )}

        <VStack style={styles.inputContainer}>
          {/* Suggested Prompts */}
          {memoryEnabled && suggestedPrompts.length > 0 && !inputText.trim() && (
            <VStack space={2} mb={3}>
              <Text fontSize="xs" color={colors.textSecondary} fontWeight="medium">
                💡 Suggerimenti basati sulla tua cronologia:
              </Text>
              <HStack flexWrap="wrap" space={2}>
                {suggestedPrompts.slice(0, 3).map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSuggestedPromptPress(prompt)}
                    style={styles.suggestedPrompt}
                  >
                    <Text fontSize="xs" color={colors.primary}>
                      {prompt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </HStack>
            </VStack>
          )}

          {selectedParents.parentA && selectedParents.parentB && (
            <HStack style={styles.selectedStrains} space={2}>
              <Badge colorScheme="primary">{selectedParents.parentA}</Badge>
              <Text color={colors.textSecondary}>x</Text>
              <Badge colorScheme="primary">{selectedParents.parentB}</Badge>
              <IconButton
                icon={<Icon as={MaterialIcons} name="close" />}
                size="xs"
                onPress={() => setSelectedParents({})}
              />
            </HStack>
          )}

          <HStack space={2} alignItems="center">
            <IconButton
              icon={<Icon as={MaterialIcons} name="add-circle" size={6} />}
              onPress={() => setShowStrainSelector(true)}
              _pressed={{ bg: 'gray.700' }}
            />

            <Input
              flex={1}
              placeholder="Chiedi un incrocio o analisi..."
              value={inputText}
              onChangeText={setInputText}
              size="md"
              bg="gray.800"
              borderColor={colors.border}
              _focus={{
                borderColor: colors.primary,
                bg: 'gray.700',
              }}
              style={styles.input}
              onSubmitEditing={handleSendMessage}
            />

            <IconButton
              icon={<Icon as={MaterialIcons} name="send" size={6} />}
              onPress={handleSendMessage}
              isDisabled={!inputText.trim() || isLoading}
              bg={colors.primary}
              _pressed={{ bg: colors.accent }}
              _disabled={{ opacity: 0.5 }}
            />
          </HStack>
        </VStack>
      </KeyboardAvoidingView>
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
  messagesList: {
    padding: 16,
    paddingBottom: 100,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-end',
  },
  avatar: {
    marginRight: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  selectedStrains: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Roboto',
    color: colors.text,
  },
  historyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestedPrompt: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 4,
  },
});
