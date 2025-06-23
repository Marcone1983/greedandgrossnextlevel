import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { VStack, HStack, Text, Icon, Badge, Button, Spinner, useToast } from 'native-base';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useSelector, useDispatch } from 'react-redux';

import { colors, gradients, shadows } from '@/constants/theme';
import { RootState } from '@/store';
import { updateUser } from '@/store/slices/authSlice';
import { purchaseSubscription, restorePurchases } from '@/services/initialization';

interface RouteParams {
  feature: string;
}

const FEATURES = {
  unlimited_crosses: {
    title: 'Incroci Illimitati',
    description: 'Simula tutti gli incroci che vuoi con il nostro AI',
    icon: 'science',
  },
  unlimited_chat: {
    title: 'Chat Illimitata',
    description: 'Partecipa alle conversazioni con la community senza limiti',
    icon: 'forum',
  },
  unlimited_strains: {
    title: 'Strain Library Illimitata',
    description: 'Salva tutte le strain che vuoi nella tua libreria',
    icon: 'cannabis',
  },
  export_pdf: {
    title: 'Export PDF',
    description: 'Esporta le tue strain in formato PDF professionale',
    icon: 'file-download',
  },
  cloud_backup: {
    title: 'Backup Cloud',
    description: 'Salva automaticamente i tuoi dati nel cloud',
    icon: 'cloud-upload',
  },
  premium_features: {
    title: 'Funzioni Premium',
    description: "Accedi a tutte le funzioni avanzate dell'app",
    icon: 'workspace-premium',
  },
};

export default function PaywallScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state: RootState) => state.auth);
  const { feature } = route.params as RouteParams;

  const featureData = FEATURES[feature as keyof typeof FEATURES] || FEATURES.premium_features;

  const plans = {
    monthly: {
      id: 'greed_gross_monthly',
      price: '€9.99',
      period: 'mese',
      savings: null,
    },
    yearly: {
      id: 'greed_gross_yearly',
      price: '€99.99',
      period: 'anno',
      savings: '17%',
    },
  };

  const premiumFeatures = [
    {
      icon: 'science',
      title: 'Incroci AI Illimitati',
      description: 'Simula tutti gli incroci che vuoi',
    },
    {
      icon: 'forum',
      title: 'Chat Community Illimitata',
      description: 'Partecipa senza limiti alle discussioni',
    },
    {
      icon: 'cannabis',
      title: 'Strain Library Illimitata',
      description: 'Salva migliaia di strain personalizzate',
    },
    {
      icon: 'file-download',
      title: 'Export PDF Professionale',
      description: 'Documenti dettagliati delle tue strain',
    },
    {
      icon: 'cloud-upload',
      title: 'Backup Cloud Automatico',
      description: 'Sincronizzazione su tutti i dispositivi',
    },
    {
      icon: 'notifications',
      title: 'Notifiche Personalizzate',
      description: 'Avvisi per strain trending e novità',
    },
    {
      icon: 'priority-high',
      title: 'Supporto Prioritario',
      description: 'Assistenza dedicata e veloce',
    },
    {
      icon: 'analytics',
      title: 'Analytics Avanzate',
      description: 'Statistiche dettagliate sui tuoi incroci',
    },
  ];

  const handlePurchase = async () => {
    if (user?.tier === 'admin') {
      // Admin bypass
      dispatch(updateUser({ tier: 'premium' }));
      toast.show({
        description: 'Accesso Premium attivato (Admin)',
        colorScheme: 'success',
      });
      navigation.goBack();
      return;
    }

    setIsLoading(true);
    ReactNativeHapticFeedback.trigger('impactMedium', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false
    });

    try {
      const success = await purchaseSubscription(plans[selectedPlan].id);

      if (success) {
        dispatch(updateUser({ tier: 'premium' }));
        toast.show({
          description: 'Abbonamento Premium attivato!',
          colorScheme: 'success',
        });
        navigation.goBack();
      }
    } catch (error: any) {
      toast.show({
        description: error.message || "Errore durante l'acquisto",
        colorScheme: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);

    try {
      const restored = await restorePurchases();

      if (restored) {
        dispatch(updateUser({ tier: 'premium' }));
        toast.show({
          description: 'Abbonamento ripristinato!',
          colorScheme: 'success',
        });
        navigation.goBack();
      } else {
        toast.show({
          description: 'Nessun abbonamento trovato',
          colorScheme: 'info',
        });
      }
    } catch (error: any) {
      toast.show({
        description: error.message || 'Errore durante il ripristino',
        colorScheme: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const PlanCard = ({ plan, isSelected, onSelect }: any) => (
    <TouchableOpacity
      onPress={onSelect}
      style={[styles.planCard, isSelected && styles.selectedPlan, shadows.md]}
    >
      <LinearGradient
        colors={isSelected ? gradients.primary : [colors.surface, colors.surface]}
        style={styles.planGradient}
      >
        <VStack space={2}>
          <HStack alignItems="center" justifyContent="space-between">
            <VStack>
              <Text fontSize="xl" fontWeight="bold" color={isSelected ? 'white' : colors.text}>
                {plan.price}
              </Text>
              <Text fontSize="sm" color={isSelected ? 'white' : colors.textSecondary}>
                per {plan.period}
              </Text>
            </VStack>
            {plan.savings && (
              <Badge colorScheme="warning" variant="solid">
                Risparmia {plan.savings}
              </Badge>
            )}
          </HStack>
          {isSelected && (
            <HStack alignItems="center" space={2}>
              <Icon as={MaterialIcons} name="check-circle" color="white" />
              <Text color="white" fontSize="sm">
                Piano selezionato
              </Text>
            </HStack>
          )}
        </VStack>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient colors={gradients.dark} style={styles.header}>
            <HStack alignItems="center" justifyContent="space-between">
              <HStack alignItems="center" space={3}>
                <Icon
                  as={MaterialCommunityIcons}
                  name={featureData.icon}
                  size={8}
                  color={colors.secondary}
                />
                <VStack>
                  <Text fontSize="xl" fontWeight="bold" color={colors.text}>
                    {featureData.title}
                  </Text>
                  <Text fontSize="sm" color={colors.textSecondary}>
                    Passa a Premium per accedere
                  </Text>
                </VStack>
              </HStack>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Icon as={MaterialIcons} name="close" size={6} color={colors.text} />
              </TouchableOpacity>
            </HStack>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Feature Highlight */}
            <VStack style={styles.featureHighlight} space={3}>
              <Text fontSize="lg" color={colors.text} textAlign="center">
                {featureData.description}
              </Text>
              <Text fontSize="md" color={colors.secondary} textAlign="center" fontWeight="bold">
                Sblocca questa funzione con Premium!
              </Text>
            </VStack>

            {/* Plans */}
            <VStack space={3} mb={6}>
              <Text fontSize="xl" fontWeight="bold" color={colors.text} textAlign="center">
                Scegli il tuo piano
              </Text>
              <HStack space={3}>
                <PlanCard
                  plan={plans.monthly}
                  isSelected={selectedPlan === 'monthly'}
                  onSelect={() => setSelectedPlan('monthly')}
                />
                <PlanCard
                  plan={plans.yearly}
                  isSelected={selectedPlan === 'yearly'}
                  onSelect={() => setSelectedPlan('yearly')}
                />
              </HStack>
            </VStack>

            {/* Features List */}
            <VStack space={4} mb={6}>
              <Text fontSize="lg" fontWeight="bold" color={colors.text}>
                Tutto incluso in Premium:
              </Text>
              {premiumFeatures.map((feature, index) => (
                <HStack key={index} alignItems="flex-start" space={3}>
                  <Icon
                    as={MaterialIcons}
                    name={feature.icon}
                    size={6}
                    color={colors.primary}
                    mt={1}
                  />
                  <VStack flex={1}>
                    <Text fontSize="md" fontWeight="bold" color={colors.text}>
                      {feature.title}
                    </Text>
                    <Text fontSize="sm" color={colors.textSecondary}>
                      {feature.description}
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>

            {/* CTA Buttons */}
            <VStack space={3} mb={8}>
              <Button
                size="lg"
                onPress={handlePurchase}
                isLoading={isLoading}
                isLoadingText="Elaborazione..."
                _loading={{ bg: colors.primary }}
                leftIcon={<Icon as={MaterialIcons} name="workspace-premium" color="white" />}
              >
                <LinearGradient colors={gradients.primary} style={styles.buttonGradient}>
                  <Text color="white" fontWeight="bold" fontSize="lg">
                    Inizia Premium - {plans[selectedPlan].price}
                  </Text>
                </LinearGradient>
              </Button>

              <Button
                variant="outline"
                size="md"
                onPress={handleRestore}
                isLoading={isLoading}
                borderColor={colors.border}
                _text={{ color: colors.textSecondary }}
              >
                Ripristina Acquisti
              </Button>
            </VStack>

            {/* Legal */}
            <VStack space={2} alignItems="center" mb={4}>
              <Text fontSize="xs" color={colors.textSecondary} textAlign="center">
                Abbonamento con rinnovo automatico. Annulla quando vuoi.
              </Text>
              <HStack space={4}>
                <TouchableOpacity>
                  <Text fontSize="xs" color={colors.primary}>
                    Termini di Servizio
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text fontSize="xs" color={colors.primary}>
                    Privacy Policy
                  </Text>
                </TouchableOpacity>
              </HStack>
            </VStack>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    padding: 20,
  },
  featureHighlight: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  planCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  planGradient: {
    padding: 16,
  },
  selectedPlan: {
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  buttonGradient: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
});
