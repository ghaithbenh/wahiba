/**
 * Setup Validation Script
 * Run this to check if your backend is properly configured
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('\n=================================');
console.log('🔍 Backend Setup Validation');
console.log('=================================\n');

let allGood = true;

// Check 1: Node version
console.log('1. Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].slice(1));
if (majorVersion >= 16) {
  console.log(`   ✅ Node.js ${nodeVersion} (OK)\n`);
} else {
  console.log(`   ❌ Node.js ${nodeVersion} (Need v16 or higher)\n`);
  allGood = false;
}

// Check 2: Environment file
console.log('2. Checking environment configuration...');
if (fs.existsSync('.env')) {
  console.log('   ✅ .env file exists');
  
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'PORT'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length === 0) {
    console.log('   ✅ All required environment variables set\n');
  } else {
    console.log(`   ❌ Missing variables: ${missing.join(', ')}\n`);
    allGood = false;
  }
} else {
  console.log('   ❌ .env file not found. Copy env.example.txt to .env\n');
  allGood = false;
}

// Check 3: Dependencies
console.log('3. Checking dependencies...');
if (fs.existsSync('node_modules')) {
  console.log('   ✅ Dependencies installed\n');
} else {
  console.log('   ❌ Dependencies not installed. Run: npm install\n');
  allGood = false;
}

// Check 4: Upload directories
console.log('4. Checking upload directories...');
const uploadDir = process.env.UPLOAD_PATH || './uploads';
const requiredDirs = [
  uploadDir,
  `${uploadDir}/dresses`,
  `${uploadDir}/banners`,
  `${uploadDir}/about-us`
];

let dirsCreated = 0;
requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    dirsCreated++;
  }
});

if (dirsCreated > 0) {
  console.log(`   ✅ Created ${dirsCreated} upload directories\n`);
} else {
  console.log('   ✅ All upload directories exist\n');
}

// Check 5: Database connection (async)
console.log('5. Testing database connection...');
(async () => {
  try {
    const { testConnection } = require('./config/database');
    const connected = await testConnection();
    
    if (connected) {
      console.log('   ✅ Database connection successful\n');
    } else {
      console.log('   ❌ Database connection failed\n');
      console.log('   💡 Make sure MySQL is running and credentials are correct\n');
      allGood = false;
    }
    
    // Final summary
    console.log('=================================');
    if (allGood) {
      console.log('✅ Setup Complete!');
      console.log('\nYou can now start the server with:');
      console.log('   npm run dev (development)');
      console.log('   npm start (production)');
    } else {
      console.log('❌ Setup Incomplete');
      console.log('\nPlease fix the issues above and run this script again.');
    }
    console.log('=================================\n');
    
    process.exit(allGood ? 0 : 1);
  } catch (error) {
    console.log('   ❌ Error testing database:', error.message, '\n');
    console.log('=================================');
    console.log('❌ Setup Incomplete');
    console.log('=================================\n');
    process.exit(1);
  }
})();




