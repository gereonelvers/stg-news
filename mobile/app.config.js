// Dynamic config: keeps app.json as the source of truth and only resolves the
// Firebase config file. EAS Build supplies it through the file-type environment
// variable GOOGLE_SERVICES_JSON because the file itself is not committed; a
// checkout without it (or without the variable) still has to start, so the key
// is dropped rather than pointing at a file that does not exist.
const { AndroidConfig, withStringsXml } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * `expo.name` has to stay ASCII: eas-cli bundles @expo/config-plugins 55, whose
 * sanitizedName() drops the "ü" and yields STGSchlerzeitung, while the SDK 58
 * prebuild transliterates it to STGSchulerzeitung. The two names disagreeing
 * makes an iOS build fail when it assigns the provisioning profile to a target
 * that does not exist. Android shows `expo.name` on the launcher, so the proper
 * spelling goes back in here; on iOS CFBundleDisplayName already handles it.
 */
const ANDROID_LABEL = 'STG Schülerzeitung';

const withGermanAppName = (config) =>
  withStringsXml(config, (cfg) => {
    cfg.modResults = AndroidConfig.Strings.setStringItem(
      [{ _: ANDROID_LABEL, $: { name: 'app_name', translatable: 'false' } }],
      cfg.modResults,
    );
    return cfg;
  });

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

  return withGermanAppName({ ...config, android });
};
