const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json'); // You need to add this
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com"
});

const db = admin.firestore();

async function importData() {
  try {
    console.log('🚀 Starting Firebase data import...');
    
    // Load the data file
    const dataPath = path.join(__dirname, '../firebase-config.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Import Users
    console.log('👥 Importing users...');
    const usersCollection = db.collection('users');
    for (const [userId, userData] of Object.entries(data.users)) {
      await usersCollection.doc(userId).set({
        ...userData,
        joinDate: admin.firestore.Timestamp.fromDate(new Date(userData.joinDate)),
        lastActive: admin.firestore.Timestamp.fromDate(new Date(userData.lastActive))
      });
      console.log(`  ✅ Imported user: ${userData.username}`);
    }
    
    // Import Strains
    console.log('🌿 Importing strains...');
    const strainsCollection = db.collection('strains');
    for (const [strainId, strainData] of Object.entries(data.strains)) {
      await strainsCollection.doc(strainId).set({
        ...strainData,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(strainData.createdAt))
      });
      console.log(`  ✅ Imported strain: ${strainData.name}`);
    }
    
    // Import Crosses Cache
    console.log('🧬 Importing crosses cache...');
    const crossesCacheCollection = db.collection('crosses_cache');
    for (const [cacheId, cacheData] of Object.entries(data.crosses_cache)) {
      await crossesCacheCollection.doc(cacheId).set({
        ...cacheData,
        timestamp: admin.firestore.Timestamp.fromDate(new Date(cacheData.timestamp)),
        strain: {
          ...cacheData.strain,
          createdAt: admin.firestore.Timestamp.fromDate(new Date(cacheData.strain.createdAt))
        }
      });
      console.log(`  ✅ Imported cache: ${cacheId}`);
    }
    
    // Import Chat Messages
    console.log('💬 Importing chat messages...');
    const chatsCollection = db.collection('chats');
    for (const [messageId, messageData] of Object.entries(data.chats)) {
      await chatsCollection.doc(messageId).set({
        ...messageData,
        timestamp: admin.firestore.Timestamp.fromDate(new Date(messageData.timestamp))
      });
      console.log(`  ✅ Imported message: ${messageId}`);
    }
    
    // Import Analytics
    console.log('📊 Importing analytics...');
    const analyticsCollection = db.collection('analytics');
    for (const [eventId, eventData] of Object.entries(data.analytics)) {
      await analyticsCollection.doc(eventId).set({
        ...eventData,
        timestamp: admin.firestore.Timestamp.fromDate(new Date(eventData.timestamp))
      });
      console.log(`  ✅ Imported analytics: ${eventData.event}`);
    }
    
    // Import Popular Strains
    console.log('🔥 Importing popular strains...');
    const popularStrainsDoc = db.collection('system').doc('popular_strains');
    await popularStrainsDoc.set(data.popular_strains_global);
    console.log('  ✅ Imported popular strains data');
    
    // Import Terpene Profiles
    console.log('🧪 Importing terpene profiles...');
    const terpeneProfilesCollection = db.collection('terpene_profiles');
    for (const [terpeneId, terpeneData] of Object.entries(data.terpene_profiles)) {
      await terpeneProfilesCollection.doc(terpeneId).set(terpeneData);
      console.log(`  ✅ Imported terpene: ${terpeneData.name}`);
    }
    
    // Import Breeding Tips
    console.log('💡 Importing breeding tips...');
    const breedingTipsCollection = db.collection('breeding_tips');
    for (const [tipId, tipData] of Object.entries(data.breeding_tips)) {
      await breedingTipsCollection.doc(tipId).set(tipData);
      console.log(`  ✅ Imported tip: ${tipData.title}`);
    }
    
    // Import System Stats
    console.log('📈 Importing system stats...');
    const systemStatsDoc = db.collection('system').doc('stats');
    await systemStatsDoc.set({
      ...data.system_stats,
      last_updated: admin.firestore.Timestamp.fromDate(new Date(data.system_stats.last_updated))
    });
    console.log('  ✅ Imported system stats');
    
    console.log('');
    console.log('🎉 Firebase data import completed successfully!');
    console.log('');
    console.log('📊 Import Summary:');
    console.log(`  👥 Users: ${Object.keys(data.users).length}`);
    console.log(`  🌿 Strains: ${Object.keys(data.strains).length}`);
    console.log(`  🧬 Cached Crosses: ${Object.keys(data.crosses_cache).length}`);
    console.log(`  💬 Chat Messages: ${Object.keys(data.chats).length}`);
    console.log(`  📊 Analytics Events: ${Object.keys(data.analytics).length}`);
    console.log(`  🔥 Popular Strains: ${Object.keys(data.popular_strains_global).length}`);
    console.log(`  🧪 Terpene Profiles: ${Object.keys(data.terpene_profiles).length}`);
    console.log(`  💡 Breeding Tips: ${Object.keys(data.breeding_tips).length}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error importing data:', error);
  } finally {
    process.exit();
  }
}

// Run the import
importData();

module.exports = { importData };