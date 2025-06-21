#!/usr/bin/env node

/**
 * Memory System Setup Script for GREED & GROSS App
 *
 * This script helps set up the memory system by:
 * 1. Creating necessary Firebase collections
 * 2. Setting up indexes for optimal performance
 * 3. Initializing default privacy settings
 * 4. Creating test data for development
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'firebase-config.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
} catch (_error) {
  console.error('❌ Error initializing Firebase Admin SDK:');
  console.error('Make sure firebase-config.json exists in the project root');
  process.exit(1);
}

const db = admin.firestore();

async function setupMemorySystem() {
  console.log('🚀 Setting up Memory System for GREED & GROSS...\n');

  try {
    // 1. Create indexes for optimal performance
    console.log('📊 Setting up Firestore indexes...');
    await setupFirestoreIndexes();

    // 2. Create sample memory profiles for testing
    console.log('👤 Creating sample memory profiles...');
    await createSampleMemoryProfiles();

    // 3. Create sample conversations for testing
    console.log('💬 Creating sample conversations...');
    await createSampleConversations();

    // 4. Set up security rules (display only)
    console.log('🔒 Security rules setup...');
    displaySecurityRules();

    console.log('\n✅ Memory System setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Deploy the security rules to Firebase');
    console.log('2. Install the required npm packages:');
    console.log('   npm install crypto-js date-fns @types/crypto-js');
    console.log('3. Test the memory system in your app');
    console.log('4. Configure environment variables if needed');
  } catch (error) {
    console.error('❌ Error setting up memory system:', error);
    process.exit(1);
  }
}

async function setupFirestoreIndexes() {
  // Note: Indexes are typically created automatically when queries are run
  // or can be managed through the Firebase Console

  console.log('   • user_conversations collection');
  console.log('     - userId (ascending) + timestamp (descending)');
  console.log('     - userId (ascending) + encrypted (ascending)');

  console.log('   • user_memory_profiles collection');
  console.log('     - userId (ascending)');
  console.log('     - lastInteraction (descending)');

  console.log('   ✓ Index configuration documented');
}

async function createSampleMemoryProfiles() {
  const sampleProfiles = [
    {
      userId: 'demo_user_1',
      conversationCount: 15,
      totalQueries: 45,
      preferenceSignals: {
        preferredType: 'sativa',
        thcPreference: 'high',
        effectsPreferred: ['energetic', 'creative', 'focused'],
        flavorsPreferred: ['citrus', 'pine'],
        experienceLevel: 'intermediate',
        useCase: 'recreational',
        timeOfUse: 'morning',
      },
      contextSummary: 'Experienced sativa grower interested in high-THC strains for creative work',
      lastInteraction: admin.firestore.Timestamp.now(),
      privacySettings: {
        enableMemory: true,
        encryptSensitive: true,
        retentionDays: 365,
        allowAnalytics: true,
        allowPersonalization: true,
        gdprCompliant: true,
      },
      learningInsights: [
        'Prefers morning consumption',
        'Interested in breeding projects',
        'Values terpene profiles',
      ],
    },
    {
      userId: 'demo_user_2',
      conversationCount: 3,
      totalQueries: 8,
      preferenceSignals: {
        preferredType: 'indica',
        thcPreference: 'medium',
        effectsPreferred: ['relaxed', 'sleepy'],
        flavorsPreferred: ['earthy', 'sweet'],
        experienceLevel: 'beginner',
        useCase: 'medical',
        timeOfUse: 'evening',
      },
      contextSummary: 'New user interested in medical cannabis for sleep issues',
      lastInteraction: admin.firestore.Timestamp.now(),
      privacySettings: {
        enableMemory: true,
        encryptSensitive: true,
        retentionDays: 180,
        allowAnalytics: false,
        allowPersonalization: true,
        gdprCompliant: true,
      },
      learningInsights: ['Medical use focus', 'Sleep-related queries', 'Beginner level questions'],
    },
  ];

  const batch = db.batch();

  for (const profile of sampleProfiles) {
    const docRef = db.collection('user_memory_profiles').doc(profile.userId);
    batch.set(docRef, profile);
  }

  await batch.commit();
  console.log(`   ✓ Created ${sampleProfiles.length} sample memory profiles`);
}

async function createSampleConversations() {
  const sampleConversations = [
    {
      id: 'conv_demo_1',
      userId: 'demo_user_1',
      sessionId: 'session_demo_1',
      query: 'What are the best sativa strains for creativity?',
      response:
        'For creativity, I recommend Jack Herer, Sour Diesel, and Green Crack. These sativas are known for their uplifting and focus-enhancing effects.',
      strainsMentioned: ['Jack Herer', 'Sour Diesel', 'Green Crack'],
      effects: ['creative', 'uplifting', 'focused'],
      preferences: {
        preferredType: 'sativa',
        effectsPreferred: ['creative', 'focused'],
        useCase: 'recreational',
        timeOfUse: 'morning',
      },
      timestamp: admin.firestore.Timestamp.now(),
      context: {
        sessionLength: 15,
        messageCount: 1,
        topicsDiscussed: ['strains', 'effects'],
        questionsAsked: ['creativity strains'],
        crossesPerformed: 0,
      },
      encrypted: false,
    },
    {
      id: 'conv_demo_2',
      userId: 'demo_user_1',
      sessionId: 'session_demo_1',
      query: 'Can you simulate crossing Jack Herer with Sour Diesel?',
      response:
        'Crossing Jack Herer x Sour Diesel would likely produce a balanced sativa-dominant hybrid with high energy and creative effects. Expected THC: 22-26%, with prominent limonene and pinene terpenes.',
      strainsMentioned: ['Jack Herer', 'Sour Diesel', 'Jack Diesel (hybrid)'],
      effects: ['energetic', 'creative', 'uplifting'],
      preferences: {
        preferredType: 'sativa',
        effectsPreferred: ['energetic', 'creative'],
      },
      timestamp: admin.firestore.Timestamp.fromMillis(Date.now() - 300000), // 5 minutes ago
      context: {
        sessionLength: 20,
        messageCount: 2,
        topicsDiscussed: ['strains', 'breeding', 'genetics'],
        questionsAsked: ['creativity strains', 'breeding simulation'],
        crossesPerformed: 1,
        lastStrainInteraction: 'Jack Diesel',
      },
      encrypted: false,
    },
    {
      id: 'conv_demo_3',
      userId: 'demo_user_2',
      sessionId: 'session_demo_2',
      query: 'I need help finding strains for sleep problems',
      response:
        'For sleep issues, I recommend indica strains like Northern Lights, Granddaddy Purple, and Bubba Kush. These have high myrcene content which promotes relaxation and sedation.',
      strainsMentioned: ['Northern Lights', 'Granddaddy Purple', 'Bubba Kush'],
      effects: ['relaxed', 'sleepy', 'sedating'],
      preferences: {
        preferredType: 'indica',
        effectsPreferred: ['relaxed', 'sleepy'],
        useCase: 'medical',
        timeOfUse: 'evening',
      },
      timestamp: admin.firestore.Timestamp.fromMillis(Date.now() - 86400000), // 1 day ago
      context: {
        sessionLength: 10,
        messageCount: 1,
        topicsDiscussed: ['medical', 'sleep', 'indica'],
        questionsAsked: ['sleep strains'],
        crossesPerformed: 0,
      },
      encrypted: false,
    },
  ];

  const batch = db.batch();

  for (const conversation of sampleConversations) {
    const docRef = db.collection('user_conversations').doc(conversation.id);
    batch.set(docRef, conversation);
  }

  await batch.commit();
  console.log(`   ✓ Created ${sampleConversations.length} sample conversations`);
}

function displaySecurityRules() {
  console.log('   📋 Copy these rules to Firebase Console > Firestore > Rules:');
  console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User conversations - only accessible by the conversation owner
    match /user_conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // User memory profiles - only accessible by the profile owner
    match /user_memory_profiles/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // Analytics (if needed) - read-only for users, write for authenticated users
    match /analytics/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Admin access for memory management (if needed)
    match /memory_admin/{document} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tier == 'admin';
    }
  }
}
  `);
}

// Run the setup
setupMemorySystem().then(() => {
  console.log('\n🎉 Memory System is ready!');
  process.exit(0);
});
