const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// whisper.rn ships its speech model as a raw asset (.bin) and, on iOS,
// an optional CoreML asset (.mil). Metro needs to know to treat these
// as binary assets rather than trying to parse them as source.
const defaultConfig = getDefaultConfig(__dirname);
const { assetExts } = defaultConfig.resolver;

const config = {
  resolver: {
    assetExts: [...assetExts, 'bin', 'mil'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
