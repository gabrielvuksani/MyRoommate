import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.myroommate.app',
  appName: 'MyRoommate',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    url: 'https://605e9f51-ac45-473e-8a9d-c0795b618f01-00-1epp5col3qtfm.worf.replit.dev',
    cleartext: false
  },
  ios: {
    scheme: 'MyRoommate',
    contentInset: 'automatic'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#F7F8FA",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#000000"
    },
    Browser: {
      presentationStyle: "popover"
    }
  }
};

export default config;
