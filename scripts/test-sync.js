#!/usr/bin/env node

/**
 * Test script to validate the sync functionality
 */

require('dotenv').config();

const { main } = require('./sync-data.js');

async function testSync() {
  console.log('🧪 Testing sync functionality...');
  
  // Check environment variables
  if (!process.env.MONGODB_URI) {
    console.log('⚠️  MONGODB_URI not set - using default localhost connection');
    process.env.MONGODB_URI = 'mongodb://localhost:27017/mirrorship';
  }
  
  if (!process.env.API_BASE_URL) {
    console.log('⚠️  API_BASE_URL not set - using default localhost');
    process.env.API_BASE_URL = 'http://localhost:3000';
  }
  
  try {
    await main();
    console.log('✅ Sync test completed successfully!');
  } catch (error) {
    console.error('❌ Sync test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testSync();
}