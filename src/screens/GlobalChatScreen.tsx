import { errorLogger } from '@/services/errorLogger';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TouchableOpacity,
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
  Center,
  Spinner,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import io from 'socket.io-client';

import { RootState } from '@/store';
import { colors, gradients } from '@/constants/theme';
import { ChatMessage } from '@/types';
import { addMessage, setConnected, setOnlineUsers } from '@/store/slices/chatSlice';
import { incrementDailyUsage } from '@/store/slices/authSlice';
const WEBSOCKET_URL = 'wss://api.greedandgross.com/ws';
import ChatBubble from '@/components/ChatBubble';

export default function GlobalChatScreen() {
  const [message, setMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const socketRef = useRef<any>(null);
  const flatListRef = useRef<any>(null);

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const toast = useToast();

  const { user } = useSelector((state: RootState) => state.auth);
  const { globalMessages, isConnected, onlineUsers } = useSelector(
    (state: RootState) => state.chat
  );

  useEffect(() => {
    connectToChat();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const connectToChat = () => {
    try {
      socketRef.current = io(WEBSOCKET_URL || 'wss://ws.greedandgross.com', {
        transports: ['websocket'],
        timeout: 5000,
      });

      socketRef.current.on('connect', () => {
        setIsConnecting(false);
        dispatch(setConnected(true));

        // Join with user info
        socketRef.current.emit('join', {
          userId: user?.id,
          username: user?.username,
          tier: user?.tier,
        });
      });

      socketRef.current.on('disconnect', () => {
        dispatch(setConnected(false));
      });

      socketRef.current.on('message', (data: ChatMessage) => {
        dispatch(addMessage(data));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      });

      socketRef.current.on('online_count', (count: number) => {
        dispatch(setOnlineUsers(count));
      });

      socketRef.current.on('user_joined', (username: string) => {
        toast.show({
          description: `${username} si è unito alla chat`,
          colorScheme: 'info',
          duration: 2000,
        });
      });

      socketRef.current.on('error', (error: any) => {
        errorLogger.error('Socket error', error, 'GlobalChatScreen.socket');
        toast.show({
          description: 'Errore di connessione',
          colorScheme: 'error',
        });
      });
    } catch (error) {
      setIsConnecting(false);
      toast.show({
        description: 'Impossibile connettersi alla chat',
        colorScheme: 'error',
      });
    }
  };

  const checkMessageLimit = () => {
    if (user?.tier === 'free' && user.stats.dailyMessagesUsed >= 5) {
      navigation.navigate('Paywall', { feature: 'unlimited_chat' });
      return false;
    }
    return true;
  };

  const sendMessage = () => {
    if (!message.trim() || !isConnected || !checkMessageLimit()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: user!.id,
      username: user!.username,
      content: message,
      timestamp: new Date(),
      type: 'user',
    };

    socketRef.current?.emit('message', newMessage);
    dispatch(incrementDailyUsage('messages'));
    setMessage('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={styles.messageContainer}>
      {item.userId !== user?.id && (
        <Avatar bg={colors.primary} size="sm" style={styles.avatar}>
          {item.username.charAt(0).toUpperCase()}
        </Avatar>
      )}
      <VStack flex={1} ml={item.userId !== user?.id ? 2 : 0}>
        {item.userId !== user?.id && (
          <HStack alignItems="center" space={2} mb={1}>
            <Text fontSize="xs" color={colors.textSecondary}>
              {item.username}
            </Text>
            {item.type === 'system' && (
              <Badge colorScheme="info" size="xs">
                Sistema
              </Badge>
            )}
          </HStack>
        )}
        <ChatBubble message={item} isAI={false} />
      </VStack>
    </View>
  );

  if (isConnecting) {
    return (
      <View style={styles.container}>
        <Center flex={1}>
          <Spinner size="lg" color={colors.primary} />
          <Text color={colors.textSecondary} mt={4}>
            Connessione alla community...
          </Text>
        </Center>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.dark} style={styles.headerGradient}>
        <HStack alignItems="center" justifyContent="space-between" px={4} py={2}>
          <HStack alignItems="center" space={2}>
            <Icon as={MaterialIcons} name="forum" size={6} color={colors.primary} />
            <VStack>
              <Text fontSize="lg" fontWeight="bold" color={colors.text}>
                Chat Globale
              </Text>
              <Text fontSize="xs" color={colors.textSecondary}>
                {onlineUsers} breeder online
              </Text>
            </VStack>
          </HStack>
          <HStack space={2}>
            <Badge colorScheme={isConnected ? 'success' : 'error'} variant="subtle" size="sm">
              {isConnected ? 'Online' : 'Offline'}
            </Badge>
            <Badge colorScheme="primary" variant="subtle">
              {user?.tier === 'free' ? `${5 - user.stats.dailyMessagesUsed}/5` : '∞'} Messaggi
            </Badge>
          </HStack>
        </HStack>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={globalMessages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <Center flex={1} py={10}>
            <Icon
              as={MaterialIcons}
              name="chat-bubble-outline"
              size={16}
              color={colors.textSecondary}
              mb={4}
            />
            <Text color={colors.textSecondary} textAlign="center">
              Nessun messaggio ancora.{'\n'}
              Inizia la conversazione!
            </Text>
          </Center>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <VStack style={styles.inputContainer}>
          {!isConnected && (
            <HStack bg="warning.100" p={2} borderRadius={8} alignItems="center" space={2} mb={2}>
              <Icon as={MaterialIcons} name="warning" color="warning.600" />
              <Text color="warning.600" fontSize="sm">
                Connessione persa. Riconnessione in corso...
              </Text>
            </HStack>
          )}

          <HStack space={2} alignItems="center">
            <Input
              flex={1}
              placeholder="Scrivi alla community..."
              value={message}
              onChangeText={setMessage}
              size="md"
              bg="gray.800"
              borderColor={colors.border}
              _focus={{
                borderColor: colors.primary,
                bg: 'gray.700',
              }}
              style={styles.input}
              onSubmitEditing={sendMessage}
              maxLength={user?.tier === 'free' ? 500 : 5000}
            />

            <IconButton
              icon={<Icon as={MaterialIcons} name="send" size={6} />}
              onPress={sendMessage}
              isDisabled={!message.trim() || !isConnected}
              bg={colors.primary}
              _pressed={{ bg: colors.accent }}
              _disabled={{ opacity: 0.5 }}
            />
          </HStack>

          <Text fontSize="xs" color={colors.textSecondary} textAlign="right" mt={1}>
            {message.length}/{user?.tier === 'free' ? 500 : 5000} caratteri
          </Text>
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
    paddingBottom: 150,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-start',
  },
  avatar: {
    borderWidth: 2,
    borderColor: colors.primary,
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
  input: {
    fontFamily: 'Roboto',
    color: colors.text,
  },
});
