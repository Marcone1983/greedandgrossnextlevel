import React, { useState, useEffect } from 'react';
import { Dimensions, SafeAreaView, StyleSheet } from 'react-native';
import {
  VStack,
  HStack,
  Text,
  IconButton,
  Icon,
  Box,
  Spinner,
  Button,
  useColorModeValue,
} from 'native-base';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { useDocumentCache } from '@/hooks/useDocumentCache';
import * as Haptics from 'expo-haptics';

interface DocumentViewerProps {
  documentType: 'privacy-policy' | 'terms-service' | 'disclaimer' | 'support-info';
  language: string;
  onClose: () => void;
}

export default function DocumentViewer({ documentType, language, onClose }: DocumentViewerProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [webViewRef, setWebViewRef] = useState<any>(null);

  const { document, loading, error, retryLoad } = useDocumentCache(documentType, language);

  const bgColor = useColorModeValue('white', colors.darkBackground);
  const headerBg = useColorModeValue('gray.50', colors.darkCard);

  const windowHeight = Dimensions.get('window').height;

  useEffect(() => {
    if (error) {
      setHasError(true);
      setIsLoading(false);
    }
  }, [error]);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleLoadError = () => {
    setIsLoading(false);
    setHasError(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const handleRetry = async () => {
    setHasError(false);
    setIsLoading(true);
    await retryLoad();
  };

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const getDocumentTitle = () => {
    switch (documentType) {
      case 'privacy-policy':
        return t('legal.privacyPolicy');
      case 'terms-service':
        return t('legal.termsOfService');
      case 'disclaimer':
        return t('legal.educationalDisclaimer');
      case 'support-info':
        return t('legal.supportContact');
      default:
        return t('legal.document');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <Box bg={headerBg} px={4} py={3} borderBottomWidth={1} borderBottomColor="gray.200">
        <HStack alignItems="center" justifyContent="space-between">
          <HStack alignItems="center" space={3} flex={1}>
            <IconButton
              icon={<Icon as={MaterialIcons} name="arrow-back" />}
              onPress={handleGoBack}
              size="sm"
              variant="ghost"
              colorScheme="gray"
            />
            <VStack flex={1}>
              <Text fontSize="lg" fontWeight="bold" numberOfLines={1}>
                {getDocumentTitle()}
              </Text>
              <Text fontSize="xs" color="gray.500">
                GREED & GROSS
              </Text>
            </VStack>
          </HStack>
        </HStack>
      </Box>

      {/* Content */}
      <Box flex={1} bg={bgColor}>
        {loading && (
          <VStack flex={1} alignItems="center" justifyContent="center" space={4}>
            <Spinner size="lg" color={colors.primary} />
            <Text color="gray.500">{t('legal.documentLoading')}</Text>
          </VStack>
        )}

        {hasError && (
          <VStack flex={1} alignItems="center" justifyContent="center" space={4} px={6}>
            <Icon as={MaterialIcons} name="error-outline" size="xl" color="red.500" />
            <Text fontSize="lg" fontWeight="medium" textAlign="center">
              {t('legal.documentError')}
            </Text>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              {t('errors.documentLoadError')}
            </Text>
            <Button
              bg={colors.primary}
              onPress={handleRetry}
              leftIcon={<Icon as={MaterialIcons} name="refresh" />}
            >
              {t('common.retry')}
            </Button>
            <Button variant="ghost" colorScheme="gray" onPress={handleGoBack}>
              {t('legal.goBack')}
            </Button>
          </VStack>
        )}

        {document && !loading && !hasError && (
          <WebView
            ref={setWebViewRef}
            source={{ html: document }}
            style={{ flex: 1 }}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleLoadError}
            showsVerticalScrollIndicator={true}
            showsHorizontalScrollIndicator={false}
            scalesPageToFit={true}
            startInLoadingState={true}
            renderLoading={() => (
              <VStack
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                alignItems="center"
                justifyContent="center"
                bg={bgColor}
              >
                <Spinner size="lg" color={colors.primary} />
              </VStack>
            )}
            injectedJavaScript={`
              // Add custom styling for better mobile viewing
              const meta = document.createElement('meta');
              meta.name = 'viewport';
              meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes';
              document.getElementsByTagName('head')[0].appendChild(meta);
              
              // Add custom CSS for better readability
              const style = document.createElement('style');
              style.innerHTML = \`
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  line-height: 1.6;
                  padding: 16px;
                  max-width: 100%;
                  overflow-x: hidden;
                }
                
                img {
                  max-width: 100%;
                  height: auto;
                }
                
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 16px 0;
                }
                
                table, th, td {
                  border: 1px solid #ddd;
                  padding: 8px;
                  text-align: left;
                }
                
                pre {
                  white-space: pre-wrap;
                  word-wrap: break-word;
                }
                
                a {
                  color: ${colors.primary};
                  text-decoration: none;
                }
                
                a:hover {
                  text-decoration: underline;
                }
              \`;
              document.head.appendChild(style);
              
              true;
            `}
          />
        )}

        {isLoading && document && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            alignItems="center"
            justifyContent="center"
            bg={`${bgColor}80`}
          >
            <Spinner size="lg" color={colors.primary} />
          </Box>
        )}
      </Box>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
