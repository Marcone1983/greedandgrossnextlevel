#!/bin/bash

# Deploy Firebase Rules and Configuration

echo "🔥 Deploying Firebase rules..."

# Install Firebase CLI if not present
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Deploy Firestore rules
echo "📝 Deploying Firestore rules..."
firebase deploy --only firestore:rules

# Deploy Storage rules  
echo "📁 Deploying Storage rules..."
firebase deploy --only storage

# Deploy Firestore data (if needed)
echo "💾 Importing initial data..."
firebase firestore:delete --all-collections --force
cat firebase-config.json | firebase firestore:import /

echo "✅ Firebase deployment completed!"
echo "🎉 All rules and initial data have been deployed!"