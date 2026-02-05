import type { Options } from '@wdio/types';

// Set Android environment variables
const androidSdk = process.env.LOCALAPPDATA + '\\Android\\Sdk';
process.env.ANDROID_HOME = androidSdk;
process.env.ANDROID_SDK_ROOT = androidSdk;

export const config: Options.Testrunner = {
  runner: 'local',
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      project: './tsconfig.json',
      transpileOnly: true,
    },
  },
  port: 4723,
  specs: ['./tests/**/*.ts'],
  exclude: [],
  maxInstances: 1,
  capabilities: [
    {
      platformName: 'Android',
      // For real device testing - Appium will use the first connected device
      'appium:deviceName': 'Android Device',
      'appium:automationName': 'UiAutomator2',
      // Use already installed app - set to your app's package name
      'appium:appPackage': 'com.anonymous.vibeventzapp',
      'appium:appActivity': '.MainActivity',
      // Don't reinstall the app between tests
      'appium:noReset': true,
      // Don't clear app data between tests
      'appium:fullReset': false,
      // Auto-grant permissions so dialogs don't block tests
      'appium:autoGrantPermissions': true,
      // Longer timeout for real devices
      'appium:newCommandTimeout': 300,
      // Optional: Specify UDID if you have multiple devices
      // 'appium:udid': 'YOUR_DEVICE_UDID',
    },
  ],
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: ['appium'],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000, // 2 minutes timeout for real device operations
  },
};
