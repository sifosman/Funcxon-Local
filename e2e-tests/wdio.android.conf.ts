import type { Options } from '@wdio/types';
import path from 'path';

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
  specs: ['./tests/login.spec.ts'],
  exclude: [],
  maxInstances: 1,
  capabilities: [
    {
      platformName: 'Android',
      'appium:deviceName': 'Android Device',
      'appium:platformVersion': '',
      'appium:automationName': 'UiAutomator2',
      'appium:appPackage': 'host.exp.exponent',
      'appium:appActivity': '.expo.host.exp.exponent',
      'appium:noReset': true,
      'appium:newCommandTimeout': 300,
      'appium:fullReset': false,
      'appium:autoGrantPermissions': true,
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
    timeout: 60000,
  },
};
