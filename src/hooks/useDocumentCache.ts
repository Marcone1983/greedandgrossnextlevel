import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import storage from '@react-native-firebase/storage';

interface DocumentCacheState {
  document: string | null;
  loading: boolean;
  error: Error | null;
  retryLoad: () => Promise<void>;
}

type DocumentType = 'privacy-policy' | 'terms-service' | 'disclaimer' | 'support-info';

const CACHE_PREFIX = '@greedgross:documents:';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CachedDocument {
  content: string;
  timestamp: number;
  language: string;
}

export function useDocumentCache(documentType: DocumentType, language: string): DocumentCacheState {
  const [document, setDocument] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getCacheKey = (type: DocumentType, lang: string) => 
    `${CACHE_PREFIX}${type}:${lang}`;

  const getFromCache = async (type: DocumentType, lang: string): Promise<string | null> => {
    try {
      const cacheKey = getCacheKey(type, lang);
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const parsedCache: CachedDocument = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - parsedCache.timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      
      // Check if language matches
      if (parsedCache.language !== lang) {
        return null;
      }
      
      return parsedCache.content;
    } catch (error) {
      console.warn('Error reading from document cache:', error);
      return null;
    }
  };

  const saveToCache = async (
    type: DocumentType, 
    lang: string, 
    content: string
  ): Promise<void> => {
    try {
      const cacheKey = getCacheKey(type, lang);
      const cacheData: CachedDocument = {
        content,
        timestamp: Date.now(),
        language: lang,
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error saving to document cache:', error);
    }
  };

  const downloadFromFirebase = async (
    type: DocumentType, 
    lang: string
  ): Promise<string> => {
    try {
      // Try to get document in requested language
      let path = `legal/${lang}/${type}.html`;
      let ref = storage().ref(path);
      
      try {
        const url = await ref.getDownloadURL();
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.text();
      } catch (primaryError) {
        // If requested language fails, try English fallback
        if (lang !== 'en') {
          console.warn(`Document not found in ${lang}, trying English fallback`);
          path = `legal/en/${type}.html`;
          ref = storage().ref(path);
          
          const fallbackUrl = await ref.getDownloadURL();
          const fallbackResponse = await fetch(fallbackUrl);
          
          if (!fallbackResponse.ok) {
            throw new Error(`HTTP ${fallbackResponse.status}: ${fallbackResponse.statusText}`);
          }
          
          return await fallbackResponse.text();
        }
        
        throw primaryError;
      }
    } catch (error) {
      console.error('Error downloading document from Firebase:', error);
      throw new Error(`Failed to download document: ${error.message}`);
    }
  };

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get from cache first
      const cachedDocument = await getFromCache(documentType, language);
      if (cachedDocument) {
        setDocument(cachedDocument);
        setLoading(false);
        return;
      }
      
      // Download from Firebase
      const downloadedDocument = await downloadFromFirebase(documentType, language);
      
      // Save to cache
      await saveToCache(documentType, language, downloadedDocument);
      
      setDocument(downloadedDocument);
    } catch (err) {
      console.error('Error loading document:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // Try to get any cached version as fallback
      try {
        const fallbackCache = await getFromCache(documentType, 'en');
        if (fallbackCache) {
          setDocument(fallbackCache);
          return;
        }
      } catch (fallbackError) {
        console.warn('Fallback cache failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const retryLoad = async () => {
    await loadDocument();
  };

  useEffect(() => {
    loadDocument();
  }, [documentType, language]);

  return {
    document,
    loading,
    error,
    retryLoad,
  };
}