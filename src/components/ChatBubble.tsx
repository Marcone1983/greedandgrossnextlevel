import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, HStack, VStack, Badge } from 'native-base';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatMessage, Strain } from '@/types';
import { colors, gradients } from '@/constants/theme';
import { formatDate } from '@/utils/helpers';
import StrainCard from './StrainCard';

interface ChatBubbleProps {
  message: ChatMessage;
  isAI: boolean;
  onStrainPress?: (strain: Strain) => void;
}

export default function ChatBubble({ message, isAI, onStrainPress }: ChatBubbleProps) {
  const renderContent = () => {
    if (message.attachments && message.attachments.length > 0) {
      return (
        <VStack space={2}>
          <Text style={styles.messageText}>{message.content}</Text>
          {message.attachments.map((attachment, index) => {
            if (attachment.type === 'strain' && attachment.data) {
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => onStrainPress?.(attachment.data)}
                  activeOpacity={0.8}
                >
                  <StrainCard strain={attachment.data} compact />
                </TouchableOpacity>
              );
            }
            return null;
          })}
        </VStack>
      );
    }

    // Parse markdown-style bold text
    const parts = message.content.split(/(\*\*[^*]+\*\*)/g);
    return (
      <Text style={styles.messageText}>
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <Text key={index} style={styles.boldText}>
                {part.slice(2, -2)}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  return (
    <View style={[styles.container, isAI ? styles.aiContainer : styles.userContainer]}>
      {isAI ? (
        <LinearGradient
          colors={gradients.primary}
          style={styles.bubble}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {renderContent()}
          <HStack alignItems="center" justifyContent="space-between" mt={2}>
            <Badge colorScheme="success" variant="subtle" size="sm">
              AI Expert
            </Badge>
            <Text style={styles.timestamp}>{formatDate(message.timestamp)}</Text>
          </HStack>
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, styles.userBubble]}>
          {renderContent()}
          <Text style={[styles.timestamp, styles.userTimestamp]}>
            {formatDate(message.timestamp)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    marginVertical: 4,
  },
  aiContainer: {
    alignSelf: 'flex-start',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Roboto',
  },
  boldText: {
    fontFamily: 'Roboto-Bold',
    color: colors.secondary,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  userTimestamp: {
    textAlign: 'right',
  },
});