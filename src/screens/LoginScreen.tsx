import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ImageBackground,
} from 'react-native';
import {
  VStack,
  Input,
  Button,
  Text,
  Heading,
  useToast,
  Icon,
  HStack,
  Divider,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { colors, gradients } from '@/constants/theme';
import { loginSuccess } from '@/store/slices/authSlice';
import { generateAnonymousUser } from '@/utils/userUtils';
import { saveUser } from '@/services/storage';
import { validateUsername } from '@/utils/validation';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const toast = useToast();

  const handleLogin = async () => {
    if (!validateUsername(username)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        description: 'Username deve essere 3-20 caratteri alfanumerici',
        colorScheme: 'error',
        placement: 'top',
      });
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const user = generateAnonymousUser(username);
      await saveUser(user);
      dispatch(loginSuccess(user));
      
      toast.show({
        description: `Benvenuto ${username}!`,
        colorScheme: 'success',
        placement: 'top',
      });
    } catch (error) {
      toast.show({
        description: 'Errore durante il login',
        colorScheme: 'error',
        placement: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const guestUser = generateAnonymousUser(`Guest${Date.now()}`);
    await saveUser(guestUser);
    dispatch(loginSuccess(guestUser));
  };

  return (
    <ImageBackground
      source={require('@assets/images/lab-background.jpg')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <LinearGradient
        colors={['rgba(13, 17, 23, 0.9)', 'rgba(13, 17, 23, 0.95)']}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={styles.content}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <VStack space={8} alignItems="center" style={styles.form}>
              <View style={styles.logoContainer}>
                <Icon
                  as={MaterialIcons}
                  name="eco"
                  size={80}
                  color={colors.primary}
                />
                <View style={styles.glowEffect} />
              </View>

              <VStack space={2} alignItems="center">
                <Heading size="2xl" style={styles.title}>
                  GREED & GROSS
                </Heading>
                <Text style={styles.subtitle}>
                  Cannabis Breeding Simulator
                </Text>
              </VStack>

              <VStack space={4} width="100%" maxWidth={300}>
                <Input
                  placeholder="Scegli il tuo username"
                  value={username}
                  onChangeText={setUsername}
                  size="lg"
                  variant="filled"
                  bg="gray.800"
                  borderColor={colors.border}
                  _focus={{
                    borderColor: colors.primary,
                    bg: 'gray.700',
                  }}
                  InputLeftElement={
                    <Icon
                      as={MaterialIcons}
                      name="person"
                      size={5}
                      color={colors.textSecondary}
                      ml={3}
                    />
                  }
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Button
                  size="lg"
                  onPress={handleLogin}
                  isLoading={isLoading}
                  isLoadingText="Accesso..."
                  bg={colors.primary}
                  _pressed={{
                    bg: colors.accent,
                  }}
                  _text={{
                    fontFamily: 'Roboto-Bold',
                  }}
                  leftIcon={
                    <Icon
                      as={MaterialIcons}
                      name="login"
                      size={5}
                      color="white"
                    />
                  }
                >
                  Accedi
                </Button>

                <HStack alignItems="center" space={2}>
                  <Divider flex={1} bg="gray.600" />
                  <Text color="gray.400" fontSize="sm">
                    oppure
                  </Text>
                  <Divider flex={1} bg="gray.600" />
                </HStack>

                <Button
                  size="lg"
                  variant="outline"
                  borderColor={colors.secondary}
                  onPress={handleGuestMode}
                  isLoading={isLoading}
                  _text={{
                    color: colors.secondary,
                    fontFamily: 'Roboto',
                  }}
                  _pressed={{
                    bg: 'rgba(255, 215, 0, 0.1)',
                  }}
                  leftIcon={
                    <Icon
                      as={MaterialIcons}
                      name="visibility"
                      size={5}
                      color={colors.secondary}
                    />
                  }
                >
                  Modalità Ospite
                </Button>
              </VStack>

              <VStack space={2} alignItems="center" mt={4}>
                <Text fontSize="xs" color="gray.400" textAlign="center">
                  Nessuna email richiesta. Solo per scopi educativi.
                </Text>
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  18+ • Simulatore genetico professionale
                </Text>
              </VStack>
            </VStack>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.3,
  },
  overlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  glowEffect: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    opacity: 0.2,
    top: -20,
    left: -20,
  },
  title: {
    fontFamily: 'Orbitron-Bold',
    color: colors.text,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'Orbitron',
    color: colors.secondary,
    fontSize: 16,
  },
  input: {
    fontFamily: 'Roboto',
    color: colors.text,
  },
});