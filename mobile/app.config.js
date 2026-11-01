// Dynamic config: keeps app.json as the source of truth and only resolves the
// Firebase config file. EAS Build supplies it through the file-type environment
// variable GOOGLE_SERVICES_JSON because the file itself is not committed; a
// checkout without it (or without the variable) still has to start, so the key
// is dropped rather than pointing at a file that does not exist.
const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  const android = { ...config.android };
  const fromEnv = process.env.GOOGLE_SERVICES_JSON;
  const local = path.join(__dirname, 'google-services.json');

  if (fromEnv) {
    android.googleServicesFile = fromEnv;
  } else if (fs.existsSync(local)) {
    android.googleServicesFile = './google-services.json';
  } else {
    delete android.googleServicesFile; // push notifications need a real build anyway
  }

  return { ...config, android };
};
