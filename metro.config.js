const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable package.json exports field (default in SDK 53)
config.resolver.unstable_enablePackageExports = true;

module.exports = config; 