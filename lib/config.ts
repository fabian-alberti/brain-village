import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const DEV_MODE = __DEV__;

export const SIMULATE_SCREEN_TIME: boolean =
  extra.simulateScreenTime ?? DEV_MODE;

export const SIMULATE_DEVICE_APPS: boolean =
  extra.simulateDeviceApps ?? DEV_MODE;

export const TEST_MODE: boolean =
  extra.testMode ?? DEV_MODE;
