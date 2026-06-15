const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prevent Windows EPERM crash in jest-worker during release builds
config.maxWorkers = 1;

// Exclude react-native-maps from web bundle
config.resolver.platforms = ['ios', 'android', 'native'];

// Force @tanstack packages to use compiled ESM builds instead of raw TypeScript
// source (react-native field: src/index.ts). The TypeScript source causes a
// TypeError: undefined is not a function in useEffect under React 19.
const TANSTACK_COMPILED = ['@tanstack/react-query', '@tanstack/query-core'];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (TANSTACK_COMPILED.includes(moduleName)) {
    const pkgJsonPath = require.resolve(path.join(moduleName, 'package.json'));
    const pkg = require(pkgJsonPath);
    if (pkg.module) {
      return {
        filePath: path.resolve(path.dirname(pkgJsonPath), pkg.module),
        type: 'sourceFile',
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
