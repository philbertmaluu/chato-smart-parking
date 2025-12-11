const fs = require('fs');
const path = require('path');

// Check if vcredist_x64.exe exists in resources folder
const vcredistPath = path.join(__dirname, '..', 'resources', 'vcredist_x64.exe');
const configPath = path.join(__dirname, '..', 'tauri.conf.json');

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  if (fs.existsSync(vcredistPath)) {
    console.log('✓ VC++ Redistributable found in resources folder');
    // Ensure it's in the resources array
    if (!config.bundle.resources) {
      config.bundle.resources = [];
    }
    if (!config.bundle.resources.includes('resources/vcredist_x64.exe')) {
      config.bundle.resources.push('resources/vcredist_x64.exe');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
      console.log('✓ Added vcredist_x64.exe to bundle resources');
    }
  } else {
    console.log('⚠ VC++ Redistributable not found in resources folder');
    console.log('  The installer will still work, but VC++ will need to be installed manually if missing.');
    // Remove from resources array if it doesn't exist
    if (config.bundle.resources) {
      config.bundle.resources = config.bundle.resources.filter(
        r => r !== 'resources/vcredist_x64.exe'
      );
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
      console.log('  Removed from bundle resources (file not found)');
    }
  }
} catch (error) {
  console.error('Error checking VC++ Redistributable:', error.message);
  process.exit(1);
}

