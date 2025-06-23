import React from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { VStack, HStack, Text, Badge, Icon, Progress } from 'native-base';
import { MaterialIcons, MaterialCommunityIcons } from 'react-native-vector-icons';
import LinearGradient from 'react-native-linear-gradient';
import { Strain } from '@/types';
import { colors, gradients, shadows } from '@/constants/theme';
import { getStrainTypeColor, formatTHCCBD } from '@/utils/helpers';

interface StrainCardProps {
  strain: Strain;
  onPress?: () => void;
  compact?: boolean;
}

export default function StrainCard({ strain, onPress, compact = false }: StrainCardProps) {
  const typeColor = getStrainTypeColor(strain.type);

  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={[colors.surface, colors.background]}
          style={[styles.compactCard, shadows.sm]}
        >
          <HStack alignItems="center" justifyContent="space-between">
            <VStack flex={1}>
              <Text fontSize="md" fontWeight="bold" color={colors.text}>
                {strain.name}
              </Text>
              <HStack space={2} alignItems="center">
                <Badge colorScheme="primary" variant="subtle" size="sm">
                  {strain.type}
                </Badge>
                <Text fontSize="xs" color={colors.textSecondary}>
                  {formatTHCCBD(strain.thc, strain.cbd)}
                </Text>
              </HStack>
            </VStack>
            <Icon as={MaterialCommunityIcons} name="cannabis" size={6} color={typeColor} />
          </HStack>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.card, shadows.md]}>
        <ImageBackground
          source={require('@assets/images/strain-pattern.png')}
          style={styles.cardBackground}
          imageStyle={styles.backgroundImage}
        >
          <LinearGradient
            colors={['rgba(22, 27, 34, 0.9)', 'rgba(13, 17, 23, 0.95)']}
            style={styles.gradient}
          >
            <VStack space={3}>
              {/* Header */}
              <HStack alignItems="center" justifyContent="space-between">
                <VStack flex={1}>
                  <Text fontSize="xl" fontWeight="bold" color={colors.text}>
                    {strain.name}
                  </Text>
                  <Text fontSize="sm" color={colors.textSecondary}>
                    {strain.parentA} x {strain.parentB}
                  </Text>
                </VStack>
                <View style={[styles.typeIndicator, { backgroundColor: typeColor }]}>
                  <Icon as={MaterialCommunityIcons} name="cannabis" size={8} color="white" />
                </View>
              </HStack>

              {/* Stats */}
              <HStack space={4}>
                <VStack flex={1}>
                  <Text fontSize="xs" color={colors.textSecondary}>
                    THC
                  </Text>
                  <Progress
                    value={strain.thc}
                    max={30}
                    size="sm"
                    colorScheme="warning"
                    bg="gray.700"
                  />
                  <Text fontSize="xs" color={colors.text}>
                    {strain.thc}%
                  </Text>
                </VStack>
                <VStack flex={1}>
                  <Text fontSize="xs" color={colors.textSecondary}>
                    CBD
                  </Text>
                  <Progress
                    value={strain.cbd}
                    max={10}
                    size="sm"
                    colorScheme="info"
                    bg="gray.700"
                  />
                  <Text fontSize="xs" color={colors.text}>
                    {strain.cbd}%
                  </Text>
                </VStack>
              </HStack>

              {/* Terpenes */}
              <VStack>
                <Text fontSize="sm" color={colors.textSecondary} mb={1}>
                  Terpeni Principali
                </Text>
                <HStack space={2} flexWrap="wrap">
                  {strain.terpenes.slice(0, 3).map((terpene, index) => (
                    <Badge key={index} colorScheme="success" variant="outline" size="sm">
                      {terpene.name}
                    </Badge>
                  ))}
                </HStack>
              </VStack>

              {/* Effects */}
              <HStack space={2} flexWrap="wrap">
                {strain.effects.slice(0, 3).map((effect, index) => (
                  <HStack key={index} alignItems="center" space={1}>
                    <Icon as={MaterialIcons} name="lens" size={2} color={colors.accent} />
                    <Text fontSize="xs" color={colors.text}>
                      {effect}
                    </Text>
                  </HStack>
                ))}
              </HStack>

              {/* Footer */}
              <HStack alignItems="center" justifyContent="space-between">
                <HStack space={2} alignItems="center">
                  <Icon as={MaterialIcons} name="timer" size={4} color={colors.textSecondary} />
                  <Text fontSize="xs" color={colors.textSecondary}>
                    {strain.genetics.floweringTime} settimane
                  </Text>
                </HStack>
                <Badge
                  colorScheme={
                    strain.genetics.difficulty === 'easy'
                      ? 'success'
                      : strain.genetics.difficulty === 'medium'
                        ? 'warning'
                        : 'error'
                  }
                  size="sm"
                >
                  {strain.genetics.difficulty}
                </Badge>
              </HStack>
            </VStack>
          </LinearGradient>
        </ImageBackground>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardBackground: {
    width: '100%',
  },
  backgroundImage: {
    opacity: 0.1,
  },
  gradient: {
    padding: 16,
  },
  compactCard: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  typeIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
