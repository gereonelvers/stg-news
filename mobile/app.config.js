// Dynamic config: keeps app.json as the source of truth and only resolves the
// Firebase config file, which EAS Build provides through a file secret
// (GOOGLE_SERVICES_JSON) because the file itself is not committed.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
});
