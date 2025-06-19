# Smart Memory System - GREED & GROSS App

## Overview

The Smart Memory System is a comprehensive conversation intelligence platform that enhances user experience by learning from interactions, providing contextual AI responses, and maintaining conversation continuity across sessions.

## Architecture

### Core Components

1. **Memory Service** (`src/services/memoryService.ts`)
   - Central memory management system
   - Handles conversation storage, retrieval, and analysis
   - Encrypts sensitive data using AES encryption
   - Manages user privacy settings and GDPR compliance

2. **Memory Hook** (`src/hooks/useConversationMemory.ts`)
   - React hook for easy integration with components
   - Provides real-time memory state and operations
   - Handles automatic saving and context reconstruction

3. **Memory Indicator** (`src/components/MemoryIndicator.tsx`)
   - Visual indicator showing memory system status
   - Provides quick access to memory settings and statistics
   - Shows memory strength and conversation count

4. **Conversation History Screen** (`src/screens/ConversationHistoryScreen.tsx`)
   - Full conversation history viewer
   - Search and filter capabilities
   - Export and management functions

## Features

### 🧠 Smart Context Recognition
- Automatically extracts user preferences from conversations
- Identifies strain type preferences (sativa, indica, hybrid)
- Learns about effect preferences and use cases
- Tracks conversation patterns and user expertise level

### 💾 Conversation Storage
- Saves every user query and AI response
- Tracks strains mentioned in conversations
- Records session metadata and context
- Automatic cleanup of expired conversations

### 🔒 Privacy & Security
- End-to-end encryption for sensitive data
- GDPR compliant data handling
- User-controlled retention settings
- Data export functionality

### 🎯 Personalized AI Responses
- Provides conversation context to AI
- Generates personalized strain recommendations
- Adapts responses based on user expertise
- References previous conversations naturally

### 📊 Memory Analytics
- Tracks conversation patterns
- Identifies user preferences over time
- Provides memory strength indicators
- Monitors system usage statistics

## Implementation Details

### Data Models

```typescript
interface ConversationMemory {
  id: string;
  userId: string;
  sessionId: string;
  query: string;
  response: string;
  strainsMentioned: string[];
  effects: string[];
  preferences: UserPreferenceSignals;
  timestamp: Date;
  context: ConversationContext;
  encrypted: boolean;
}

interface UserMemoryProfile {
  userId: string;
  conversationCount: number;
  totalQueries: number;
  preferenceSignals: UserPreferenceSignals;
  contextSummary: string;
  lastInteraction: Date;
  privacySettings: MemoryPrivacySettings;
  learningInsights: string[];
}
```

### Firebase Collections

1. **user_conversations** - Individual conversation records
2. **user_memory_profiles** - User memory profiles and preferences
3. **analytics** - Memory system usage analytics

### Privacy Settings

```typescript
interface MemoryPrivacySettings {
  enableMemory: boolean;          // Master memory toggle
  encryptSensitive: boolean;      // Encrypt conversations
  retentionDays: number;          // Data retention period
  allowAnalytics: boolean;        // Usage analytics
  allowPersonalization: boolean;  // AI personalization
  gdprCompliant: boolean;         // GDPR compliance mode
}
```

## Integration Guide

### 1. Using the Memory Hook

```typescript
import { useConversationMemory } from '@/hooks/useConversationMemory';

function MyComponent() {
  const {
    saveConversation,
    getContextPrompt,
    getSuggestedPrompts,
    memoryEnabled,
    conversationCount,
  } = useConversationMemory();

  // Save a conversation
  await saveConversation(
    "What are good sativa strains?",
    "Here are some popular sativa strains...",
    ["Jack Herer", "Sour Diesel"]
  );

  // Get context for AI
  const context = getContextPrompt(); // "User prefers sativa strains, experienced grower..."
}
```

### 2. Adding Memory Indicator

```typescript
import MemoryIndicator from '@/components/MemoryIndicator';

function ChatScreen() {
  return (
    <View>
      {/* Your content */}
      <MemoryIndicator 
        position="top-right" 
        showDetails={true}
      />
    </View>
  );
}
```

### 3. Integrating with AI

```typescript
// In AI service
export async function performCrossBreeding(request: CrossRequest, contextPrompt?: string) {
  const messages = [
    {
      role: 'system',
      content: basePrompt + (contextPrompt ? `\n\nUser Context: ${contextPrompt}` : ''),
    },
    // ... other messages
  ];
}
```

## Privacy & GDPR Compliance

### Data Protection
- All sensitive conversations are encrypted using AES-256
- User controls all privacy settings
- Automatic data expiration based on retention settings
- No data sharing with third parties

### User Rights
- **Right to Access**: Export all personal data
- **Right to Erasure**: Delete all memory data
- **Right to Portability**: Download data in JSON format
- **Right to Rectification**: Modify privacy settings
- **Data Minimization**: Only stores necessary conversation data

### Consent Management
- Explicit opt-in for memory system
- Granular privacy controls
- Clear data usage descriptions
- Easy opt-out mechanisms

## Memory Indicators

### Visual States
- **Gray**: Memory disabled
- **Blue**: Memory ready (no conversations)
- **Green**: Learning mode (1-5 conversations)
- **Purple**: Active memory (5+ conversations)

### Information Displayed
- Conversation count
- Memory status (disabled/ready/learning/active)
- Last interaction time
- Memory strength percentage

## Context Analysis

### Preference Extraction
The system automatically extracts:
- **Strain Types**: Sativa, Indica, Hybrid preferences
- **Effects**: Relaxing, Energizing, Creative, etc.
- **Use Cases**: Medical, Recreational, Both
- **Experience Level**: Beginner, Intermediate, Expert
- **Time Preferences**: Morning, Evening, Night use

### Pattern Recognition
- Conversation frequency and length
- Topics of interest (breeding, effects, cultivation)
- Question patterns and complexity
- Strain interaction history

## Performance Considerations

### Caching Strategy
- Context summaries cached in memory
- Firebase queries optimized with indexes
- Automatic cache invalidation on updates
- Pagination for large conversation histories

### Data Efficiency
- Conversation compression for storage
- Selective field encryption
- Automatic cleanup of expired data
- Optimized Firebase reads/writes

## Development Setup

### Required Dependencies
```json
{
  "crypto-js": "^4.2.0",
  "date-fns": "^2.30.0",
  "@react-native-async-storage/async-storage": "1.18.2"
}
```

### Firebase Rules
```javascript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /user_conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /user_memory_profiles/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

### Environment Variables
```
# Required for encryption
MEMORY_ENCRYPTION_KEY=your_secure_encryption_key_here
```

## Testing

### Unit Tests
- Memory service operations
- Privacy setting updates
- Context reconstruction
- Data encryption/decryption

### Integration Tests
- Conversation saving flow
- Memory indicator updates
- Settings screen integration
- Firebase data persistence

### User Acceptance Tests
- Memory enable/disable flow
- Conversation history viewing
- Data export functionality
- Privacy setting changes

## Monitoring & Analytics

### Key Metrics
- Memory adoption rate
- Conversation count per user
- Context reconstruction accuracy
- Privacy setting preferences
- Export/deletion requests

### Performance Metrics
- Save operation latency
- Context reconstruction time
- Memory indicator render time
- Firebase query performance

## Future Enhancements

### Planned Features
1. **Advanced ML Insights**: Deeper preference learning
2. **Collaborative Filtering**: Learn from similar users
3. **Memory Sharing**: Optional community insights
4. **Smart Suggestions**: Proactive conversation starters
5. **Voice Integration**: Speech-to-text memory capture

### Technical Improvements
1. **Offline Support**: Local memory caching
2. **Real-time Sync**: Multi-device synchronization
3. **Advanced Encryption**: Zero-knowledge architecture
4. **Performance Optimization**: Memory usage reduction

## Support & Troubleshooting

### Common Issues
1. **Memory not saving**: Check Firebase permissions
2. **Slow context loading**: Verify network connection
3. **Encryption errors**: Validate encryption key
4. **Missing conversations**: Check retention settings

### Debug Mode
Enable debug logging:
```typescript
// In memoryService.ts
const DEBUG_MODE = __DEV__;
if (DEBUG_MODE) {
  console.log('Memory operation:', operation, data);
}
```

### Performance Monitoring
```typescript
// Add performance tracking
const startTime = Date.now();
await saveConversation(query, response);
const endTime = Date.now();
console.log(`Save took ${endTime - startTime}ms`);
```

## Conclusion

The Smart Memory System transforms the GREED & GROSS app from a simple chat interface into an intelligent, personalized breeding assistant that learns and adapts to each user's unique preferences and expertise level. With robust privacy controls and GDPR compliance, users can confidently engage with the system knowing their data is secure and under their control.

The system's modular architecture makes it easy to extend and customize, while the comprehensive analytics provide valuable insights into user behavior and system performance. As users interact more with the app, the memory system becomes increasingly valuable, creating a positive feedback loop that encourages continued engagement.