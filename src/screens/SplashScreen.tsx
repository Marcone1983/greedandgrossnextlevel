import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Progress } from 'native-base';
// import LottieView from 'lottie-react-native'; // Removed - animation file missing
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors, gradients } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const progress = useRef(0);
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 3000, easing: Easing.linear }), -1);

    scale.value = withSequence(
      withTiming(1, { duration: 500 }),
      withTiming(0.95, { duration: 500 }),
      withTiming(1, { duration: 500 })
    );

    const interval = setInterval(() => {
      progress.current += 0.02;
      setLoadingProgress(progress.current);
      if (progress.current >= 1) {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const animatedDNAStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <LinearGradient colors={gradients.dark} style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, animatedDNAStyle]}>
          <View style={styles.lottie}>
            <Text style={styles.dnaText}>🧬</Text>
          </View>
        </Animated.View>

        <Text style={styles.title}>GREED & GROSS</Text>
        <Text style={styles.subtitle}>Cannabis Breeding Simulator</Text>

        <View style={styles.progressContainer}>
          <Progress
            value={loadingProgress * 100}
            size="sm"
            colorScheme="primary"
            bg="gray.800"
            _filledTrack={{
              bg: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
            }}
          />
          <Text style={styles.progressText}>{Math.round(loadingProgress * 100)}%</Text>
        </View>

        <Text style={styles.loadingText}>Inizializzazione laboratorio genetico...</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>v1.0.0</Text>
        <Text style={styles.copyright}>© 2024 GREED & GROSS</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  lottie: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dnaText: {
    fontSize: 100,
    textAlign: 'center',
  },
  title: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 36,
    color: colors.primary,
    marginBottom: 10,
    textShadowColor: colors.secondary,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'Orbitron',
    fontSize: 18,
    color: colors.secondary,
    marginBottom: 40,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginTop: 10,
  },
  loadingText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  version: {
    fontFamily: 'Roboto',
    fontSize: 12,
    color: colors.textSecondary,
  },
  copyright: {
    fontFamily: 'Roboto',
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 5,
  },
});
