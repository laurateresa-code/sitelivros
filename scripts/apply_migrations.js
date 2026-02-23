import fs from 'fs';
import path from 'path';
import pg from 'pg';
import readline from 'readline';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const migrationFile = path.join(__dirname, '..', '_pending_migrations.sql');

if (!fs.existsSync(migrationFile)) {
  console.error('Migration file not found:', migrationFile);
  process.exit(1);
}

console.log('\n=============================================');
console.log('   AUTOMATIC MIGRATION TOOL FOR SUPABASE');
console.log('=============================================\n');
console.log('This script will apply all pending SQL changes to your database.');
console.log('You need your Connection String (URI) from Supabase.');
console.log('It looks like: postgres://postgres.[project-id]:[password]@aws-0-region.pooler.supabase.com:6543/postgres');
console.log('⚠️  IMPORTANT: Replace [YOUR-PASSWORD] with your actual database password!');
console.log('\nFind it at: https://supabase.com/dashboard/project/_/settings/database\n');

rl.question('Paste your Connection String here: ', async (connectionString) => {
  if (!connectionString || connectionString.trim() === '') {
    console.error('No connection string provided. Aborting.');
    process.exit(1);
  }

  // Remove quotes if user pasted them
  connectionString = connectionString.trim().replace(/^['"]|['"]$/g, '');

  if (connectionString.startsWith('https://') || connectionString.startsWith('http://')) {
    console.error('\n❌ Error: You pasted the Project URL/API URL.');
    console.error('👉 You need the "Transaction Pooler Connection String" (URI).');
    console.error('   It starts with: postgres://');
    console.error('   Find it here: https://supabase.com/dashboard/project/_/settings/database');
    console.error('   (Look for "Connection String" > "URI" > "Transaction Pooler")\n');
    rl.close();
    process.exit(1);
  }

  console.log('\nConnecting to database...');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase transaction poolers
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully.');

    const sql = fs.readFileSync(migrationFile, 'utf8');
    console.log('📄 Reading migration file...');
    console.log('🚀 Executing SQL...');
    
    await client.query(sql);
    
    console.log('\n✅ ALL MIGRATIONS EXECUTED SUCCESSFULLY!');
    console.log('You can now use the features in the app.\n');
  } catch (err) {
    console.error('\n❌ Error executing migration:', err.message);
    if (err.message.includes('password authentication failed')) {
      console.error('Hint: Check if your password is correct.');
    }
  } finally {
    await client.end();
    rl.close();
    process.exit(0);
  }
});
