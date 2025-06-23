import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Animated, Dimensions, StyleSheet, StatusBar, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '@/constants/theme';
import { Haptics } from '@/utils/expoCompat';

interface AnimatedSplashScreenProps {
  onFinish: () => void;
}

const { width, height } = Dimensions.get('window');

export default function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(50)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  const [loadingText, setLoadingText] = useState('Initializing...');
  const [progress, setProgress] = useState(0);

  const startAnimation = useCallback(() => {
    // Step 1: Logo entrance (scale + rotate + fade in)
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Haptic feedback when logo appears
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Step 2: Text slide up
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(textSlide, {
            toValue: 0,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }, 300);

      // Step 3: Progress bar appearance
      setTimeout(() => {
        Animated.timing(progressOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();

        // Start loading simulation
        simulateLoading();
      }, 800);

      // Step 4: Particle effects
      setTimeout(() => {
        startParticleAnimation();
      }, 1000);
    });
  }, []);

  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  const simulateLoading = () => {
    const loadingSteps = [
      { text: 'Loading genetics database...', duration: 800 },
      { text: 'Initializing breeding algorithms...', duration: 700 },
      { text: 'Setting up AI neural networks...', duration: 900 },
      { text: 'Connecting to strain library...', duration: 600 },
      { text: 'Preparing simulation environment...', duration: 500 },
      { text: 'Ready to grow!', duration: 400 },
    ];

    let currentStep = 0;
    const totalDuration = loadingSteps.reduce((sum, step) => sum + step.duration, 0);
    let accumulatedTime = 0;

    const progressInterval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setLoadingText(step.text);

        accumulatedTime += step.duration;
        const newProgress = (accumulatedTime / totalDuration) * 100;
        setProgress(newProgress);

        // Animate progress bar
        Animated.timing(progressWidth, {
          toValue: newProgress,
          duration: step.duration,
          useNativeDriver: false,
        }).start();

        // Haptic feedback for each step
        if (currentStep < loadingSteps.length - 1) {
          setTimeout(() => {
            Haptics.selectionAsync();
          }, step.duration / 2);
        }

        currentStep++;
      } else {
        clearInterval(progressInterval);
        // Final haptic and finish
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          finishSplash();
        }, 500);
      }
    }, 100);
  };

  const startParticleAnimation = () => {
    particleAnims.forEach((particle, index) => {
      const randomDelay = Math.random() * 2000;
      const randomX = (Math.random() - 0.5) * width;
      const randomY = (Math.random() - 0.5) * height * 0.3;

      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(particle.opacity, {
                toValue: 0.6,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(particle.x, {
                toValue: randomX,
                duration: 3000,
                useNativeDriver: true,
              }),
              Animated.timing(particle.y, {
                toValue: randomY,
                duration: 3000,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
              }),
            ]),
          ])
        ).start();
      }, randomDelay);
    });
  };

  const finishSplash = () => {
    // Exit animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(progressOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  };

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Gradient Background */}
      <LinearGradient
        colors={[colors.darkGreen, colors.background, colors.primary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated Particles */}
      {particleAnims.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }, { rotate: logoRotateInterpolate }],
              opacity: logoOpacity,
            },
          ]}
        >
          <Image source={require('@/assets/logoGG.png')} style={styles.logo} resizeMode="contain" />

          {/* Glowing effect */}
          <View style={styles.glowEffect} />
        </Animated.View>

        {/* App Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              transform: [{ translateY: textSlide }],
              opacity: textOpacity,
            },
          ]}
        >
          <Text style={styles.title}>GREED & GROSS</Text>
          <Text style={styles.subtitle}>Cannabis Breeding Simulator</Text>
        </Animated.View>

        {/* Loading Section */}
        <Animated.View style={[styles.loadingContainer, { opacity: progressOpacity }]}>
          <Text style={styles.loadingText}>{loadingText}</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressWidth.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        </Animated.View>
      </View>

      {/* Version Info */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>v1.0.0</Text>
        <Text style={styles.copyrightText}>© 2024 Greed & Gross Team</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 25,
  },
  glowEffect: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary,
    opacity: 0.3,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.secondary,
    textAlign: 'center',
    textShadowColor: colors.darkGreen,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '80%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 2,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontWeight: '600',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.secondary,
    top: height / 2,
    left: width / 2,
  },
  versionContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.7,
  },
  copyrightText: {
    fontSize: 10,
    color: colors.textSecondary,
    opacity: 0.5,
    marginTop: 4,
  },
});
