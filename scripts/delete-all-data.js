/**
 * Script to delete all candidates and evaluations from the database
 * 
 * Usage:
 *   node scripts/delete-all-data.js
 * 
 * WARNING: This will permanently delete ALL data!
 */

const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function deleteAllData() {
  console.log('⚠️  WARNING: This will delete ALL candidates and evaluations!');
  console.log('⚠️  This action cannot be undone!');
  console.log('');  
  
  try {
    console.log(`Sending delete request to ${API_URL}/api/db/delete-all-data...`);
    
    const response = await fetch(`${API_URL}/api/db/delete-all-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        confirm: 'DELETE_ALL_DATA',
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Success! All data deleted.');
      console.log('');
      console.log('Deleted counts:');
      console.log(`  - Candidates: ${data.deletedCounts?.candidates || 0}`);
      console.log(`  - Evaluations: ${data.deletedCounts?.evaluations || 0}`);
      console.log(`  - Email Logs: ${data.deletedCounts?.emailLogs || 0}`);
      console.log(`  - WhatsApp Logs: ${data.deletedCounts?.whatsappLogs || 0}`);
      console.log(`  - Resumes: ${data.deletedCounts?.resumes || 0}`);
      console.log(`  - Candidate Stages: ${data.deletedCounts?.candidateStages || 0}`);
      console.log('');
      console.log('Verification:');
      console.log(`  - Candidates remaining: ${data.verification?.candidatesRemaining || 'unknown'}`);
      console.log(`  - Evaluations remaining: ${data.verification?.evaluationsRemaining || 'unknown'}`);
    } else {
      console.error('❌ Error:', data.error || 'Unknown error');
      if (data.partialResults) {
        console.error('Partial results:', JSON.stringify(data.partialResults, null, 2));
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to delete data:', error.message);
    console.error('');
    console.error('Make sure your Next.js server is running on', API_URL);
    process.exit(1);
  }
}

// Run the deletion
deleteAllData();

