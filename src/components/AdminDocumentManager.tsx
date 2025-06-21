import { errorLogger } from '@/services/errorLogger';
import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  VStack,
  HStack,
  Text,
  ScrollView,
  Box,
  Button,
  Icon,
  Select,
  // Input,
  TextArea,
  Progress,
  useToast,
  useColorModeValue,
  Badge,
  // Divider,
  Modal,
  Alert as NBAlert,
} from 'native-base';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import storage from '@react-native-firebase/storage';
import { colors } from '@/constants/theme';
import { LANGUAGES, SupportedLanguage } from '@/i18n';
import { logAnalytics } from '@/services/firebase';
import * as Haptics from 'expo-haptics';

interface DocumentUploadProgress {
  [key: string]: {
    progress: number;
    uploading: boolean;
    error?: string;
  };
}

interface DocumentContent {
  type: 'privacy-policy' | 'terms-service' | 'disclaimer' | 'support-info';
  language: SupportedLanguage;
  content: string;
  lastModified?: string;
}

const DOCUMENT_TYPES = [
  { value: 'privacy-policy', label: 'Privacy Policy', icon: 'privacy-tip' },
  { value: 'terms-service', label: 'Terms of Service', icon: 'description' },
  { value: 'disclaimer', label: 'Educational Disclaimer', icon: 'school' },
  { value: 'support-info', label: 'Support Information', icon: 'support' },
] as const;

export default function AdminDocumentManager() {
  const { t: _t } = useTranslation();
  const toast = useToast();

  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('privacy-policy');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [documentContent, setDocumentContent] = useState('');
  const [uploadProgress, setUploadProgress] = useState<DocumentUploadProgress>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [_loadedDocuments, _setLoadedDocuments] = useState<DocumentContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const bgColor = useColorModeValue('white', colors.darkCard);
  const borderColor = useColorModeValue('gray.200', colors.darkBorder);
  const textAreaBgColor = useColorModeValue('white', colors.darkCard);

  const loadExistingDocument = async () => {
    try {
      setIsLoading(true);
      const path = `legal/${selectedLanguage}/${selectedDocumentType}.html`;
      const ref = storage().ref(path);

      try {
        const url = await ref.getDownloadURL();
        const response = await fetch(url);

        if (response.ok) {
          const content = await response.text();
          setDocumentContent(content);
        } else {
          setDocumentContent('');
        }
      } catch (error) {
        // Document doesn't exist yet
        setDocumentContent('');
      }
    } catch (error) {
      errorLogger.error('Error loading document', error, 'AdminDocumentManager.loadDocument');
      setDocumentContent('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExistingDocument();
    logAnalytics('admin_document_manager_opened');
  }, [selectedDocumentType, selectedLanguage]);

  const generateDefaultContent = () => {
    const documentName = DOCUMENT_TYPES.find(doc => doc.value === selectedDocumentType)?.label;
    const languageName = LANGUAGES[selectedLanguage].nativeName;

    const defaultContent = `<!DOCTYPE html>
<html lang="${selectedLanguage}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${documentName} - GREED & GROSS</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: ${colors.primary};
            border-bottom: 2px solid ${colors.primary};
            padding-bottom: 10px;
        }
        h2 {
            color: #333;
            margin-top: 30px;
        }
        .last-updated {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
            font-size: 14px;
            color: #666;
        }
        .contact-info {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${documentName}</h1>
        
        <div class="last-updated">
            <strong>Language:</strong> ${languageName}<br>
            <strong>Last Updated:</strong> ${new Date().toLocaleDateString()}<br>
            <strong>Effective Date:</strong> ${new Date().toLocaleDateString()}
        </div>

        <h2>1. Introduction</h2>
        <p>Welcome to GREED & GROSS, a cannabis breeding simulation application. This document outlines [document purpose].</p>

        <h2>2. Application Scope</h2>
        <p>GREED & GROSS is designed for educational and entertainment purposes only. We provide a simulation environment for learning about cannabis genetics and breeding principles.</p>

        <h2>3. Educational Disclaimer</h2>
        <p><strong>IMPORTANT:</strong> This application is for educational and simulation purposes only. We do not encourage, promote, or provide guidance for actual cannabis cultivation, especially in jurisdictions where it may be illegal.</p>

        <h2>4. User Responsibilities</h2>
        <ul>
            <li>Users must comply with all applicable local, state, and federal laws</li>
            <li>Users are responsible for understanding the legal status of cannabis in their jurisdiction</li>
            <li>The application should not be used as guidance for real-world cultivation</li>
        </ul>

        <h2>5. Contact Information</h2>
        <div class="contact-info">
            <strong>GREED & GROSS Support Team</strong><br>
            Email: support@greedandgross.com<br>
            Website: https://greedandgross.com
        </div>

        <p><em>This document was generated on ${new Date().toLocaleDateString()} and may be updated from time to time. Please check back regularly for the most current version.</em></p>
    </div>
</body>
</html>`;

    setDocumentContent(defaultContent);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const validateContent = (content: string): boolean => {
    if (!content.trim()) {
      toast.show({
        title: 'Validation Error',
        description: 'Document content cannot be empty',
        colorScheme: 'error',
      });
      return false;
    }

    if (!content.includes('<!DOCTYPE html>')) {
      toast.show({
        title: 'Validation Warning',
        description: 'Document should include HTML DOCTYPE declaration',
        colorScheme: 'warning',
      });
    }

    return true;
  };

  const uploadDocument = async () => {
    if (!validateContent(documentContent)) {
      return;
    }

    const progressKey = `${selectedDocumentType}-${selectedLanguage}`;

    try {
      setUploadProgress(prev => ({
        ...prev,
        [progressKey]: { progress: 0, uploading: true },
      }));

      const path = `legal/${selectedLanguage}/${selectedDocumentType}.html`;
      const ref = storage().ref(path);

      // Create upload task
      const uploadTask = ref.putString(documentContent, 'raw', {
        contentType: 'text/html',
        customMetadata: {
          lastModified: new Date().toISOString(),
          documentType: selectedDocumentType,
          language: selectedLanguage,
          uploadedBy: 'admin',
        },
      });

      // Monitor progress
      uploadTask.on(
        'state_changed',
        snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({
            ...prev,
            [progressKey]: { ...prev[progressKey], progress },
          }));
        },
        error => {
          errorLogger.error('Upload error', error, 'AdminDocumentManager.uploadDocument');
          setUploadProgress(prev => ({
            ...prev,
            [progressKey]: {
              progress: 0,
              uploading: false,
              error: error instanceof Error ? error.message : 'Upload failed',
            },
          }));

          toast.show({
            title: 'Upload Failed',
            description: error instanceof Error ? error.message : 'Upload failed',
            colorScheme: 'error',
          });
        },
        () => {
          setUploadProgress(prev => ({
            ...prev,
            [progressKey]: { progress: 100, uploading: false },
          }));

          toast.show({
            title: 'Upload Successful',
            description: `${DOCUMENT_TYPES.find(d => d.value === selectedDocumentType)?.label} (${LANGUAGES[selectedLanguage].nativeName}) uploaded successfully`,
            colorScheme: 'success',
          });

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          logAnalytics('admin_document_uploaded', {
            document_type: selectedDocumentType,
            language: selectedLanguage,
            content_length: documentContent.length,
          });
        }
      );
    } catch (error) {
      errorLogger.error('Upload error', error, 'AdminDocumentManager.uploadDocument');
      setUploadProgress(prev => ({
        ...prev,
        [progressKey]: {
          progress: 0,
          uploading: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        },
      }));

      toast.show({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Upload failed',
        colorScheme: 'error',
      });
    }
  };

  const previewDocument = () => {
    if (!documentContent.trim()) {
      toast.show({
        title: 'No Content',
        description: 'Add some content to preview the document',
        colorScheme: 'warning',
      });
      return;
    }

    setIsPreviewOpen(true);
    logAnalytics('admin_document_preview_opened', {
      document_type: selectedDocumentType,
      language: selectedLanguage,
    });
  };

  const getCurrentProgress = () => {
    const progressKey = `${selectedDocumentType}-${selectedLanguage}`;
    return uploadProgress[progressKey];
  };

  const currentProgress = getCurrentProgress();

  return (
    <Box flex={1} bg={useColorModeValue('gray.50', colors.darkBackground)}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space={6} p={4}>
          {/* Header */}
          <VStack space={2}>
            <HStack alignItems="center" space={3}>
              <Icon
                as={MaterialCommunityIcons}
                name="file-document-edit"
                size="lg"
                color={colors.primary}
              />
              <Text fontSize="xl" fontWeight="bold">
                Legal Documents Management
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              Create and manage legal documents for all supported languages
            </Text>
          </VStack>

          {/* Document Selection */}
          <Box bg={bgColor} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
            <VStack space={4}>
              <Text fontSize="md" fontWeight="semibold">
                Document Selection
              </Text>

              <HStack space={4}>
                <VStack flex={1}>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Document Type
                  </Text>
                  <Select
                    selectedValue={selectedDocumentType}
                    onValueChange={setSelectedDocumentType}
                    placeholder="Select document type"
                    bg={useColorModeValue('white', colors.darkCard)}
                  >
                    {DOCUMENT_TYPES.map(doc => (
                      <Select.Item key={doc.value} label={doc.label} value={doc.value} />
                    ))}
                  </Select>
                </VStack>

                <VStack flex={1}>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Language
                  </Text>
                  <Select
                    selectedValue={selectedLanguage}
                    onValueChange={value => setSelectedLanguage(value as SupportedLanguage)}
                    placeholder="Select language"
                    bg={useColorModeValue('white', colors.darkCard)}
                  >
                    {Object.entries(LANGUAGES).map(([code, lang]) => (
                      <Select.Item
                        key={code}
                        label={`${lang.flag} ${lang.nativeName}`}
                        value={code}
                      />
                    ))}
                  </Select>
                </VStack>
              </HStack>
            </VStack>
          </Box>

          {/* Content Editor */}
          <Box bg={bgColor} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
            <VStack space={4}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="md" fontWeight="semibold">
                  Document Content
                </Text>
                <HStack space={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                    onPress={generateDefaultContent}
                    leftIcon={<Icon as={MaterialIcons} name="auto-awesome" />}
                  >
                    Generate Template
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="purple"
                    onPress={previewDocument}
                    leftIcon={<Icon as={MaterialIcons} name="preview" />}
                  >
                    Preview
                  </Button>
                </HStack>
              </HStack>

              {isLoading ? (
                <Box p={8} alignItems="center">
                  <Text color="gray.500">Loading existing document...</Text>
                </Box>
              ) : (
                <TextArea
                  value={documentContent}
                  onChangeText={setDocumentContent}
                  placeholder="Enter HTML content for the document..."
                  h={300}
                  bg={textAreaBgColor}
                  fontSize="sm"
                  fontFamily="monospace"
                  isReadOnly={false}
                  autoCompleteType="off"
                />
              )}

              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="xs" color="gray.500">
                  {documentContent.length} characters
                </Text>
                <Badge colorScheme={documentContent.length > 0 ? 'green' : 'gray'}>
                  {documentContent.length > 0 ? 'Has Content' : 'Empty'}
                </Badge>
              </HStack>
            </VStack>
          </Box>

          {/* Upload Section */}
          <Box bg={bgColor} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
            <VStack space={4}>
              <Text fontSize="md" fontWeight="semibold">
                Upload Document
              </Text>

              {currentProgress?.uploading && (
                <VStack space={2}>
                  <Text fontSize="sm" color="gray.600">
                    Uploading... {Math.round(currentProgress.progress)}%
                  </Text>
                  <Progress value={currentProgress.progress} colorScheme="primary" size="sm" />
                </VStack>
              )}

              {currentProgress?.error && (
                <NBAlert status="error">
                  <NBAlert.Icon />
                  <Text fontSize="sm">{currentProgress.error}</Text>
                </NBAlert>
              )}

              <Button
                bg={colors.primary}
                onPress={uploadDocument}
                isLoading={currentProgress?.uploading}
                isDisabled={!documentContent.trim() || currentProgress?.uploading}
                leftIcon={<Icon as={MaterialIcons} name="cloud-upload" />}
              >
                Upload to Firebase Storage
              </Button>
            </VStack>
          </Box>

          {/* Info Section */}
          <Box bg="blue.50" p={4} borderRadius="lg" borderLeftWidth={4} borderLeftColor="blue.500">
            <VStack space={2}>
              <HStack alignItems="center" space={2}>
                <Icon as={MaterialIcons} name="info" color="blue.500" />
                <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                  Document Management Tips
                </Text>
              </HStack>
              <VStack space={1}>
                <Text fontSize="xs" color="blue.600">
                  • Documents are stored in Firebase Storage at: legal/[language]/[type].html
                </Text>
                <Text fontSize="xs" color="blue.600">
                  • Use valid HTML structure for proper mobile rendering
                </Text>
                <Text fontSize="xs" color="blue.600">
                  • Template generator creates a responsive starting point
                </Text>
                <Text fontSize="xs" color="blue.600">
                  • Preview function shows how users will see the document
                </Text>
              </VStack>
            </VStack>
          </Box>

          <Box h={10} />
        </VStack>
      </ScrollView>

      {/* Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} size="full">
        <Modal.Content maxW="95%" maxH="95%">
          <Modal.CloseButton />
          <Modal.Header>
            <Text fontSize="lg" fontWeight="bold">
              Document Preview - {DOCUMENT_TYPES.find(d => d.value === selectedDocumentType)?.label}
            </Text>
          </Modal.Header>
          <Modal.Body>
            <Box bg="white" flex={1} borderRadius="md" borderWidth={1} borderColor="gray.200" p={4}>
              <Text fontSize="xs" color="gray.500" mb={4}>
                Language: {LANGUAGES[selectedLanguage].nativeName} | Platform:{' '}
                {Platform.OS === 'ios' ? 'iOS' : 'Android'}
              </Text>
              <ScrollView showsVerticalScrollIndicator={true}>
                <Text fontSize="xs" fontFamily="monospace">
                  {documentContent || 'No content to preview'}
                </Text>
              </ScrollView>
            </Box>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onPress={() => setIsPreviewOpen(false)}>
              Close Preview
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Box>
  );
}
