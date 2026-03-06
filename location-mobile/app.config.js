const appJson = require('./app.json');

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    ios: {
      ...appJson.expo?.ios,
      infoPlist: {
        ...appJson.expo?.ios?.infoPlist,
        NSAppTransportSecurity: {
          NSAllowsLocalNetworking: true,
        },
      },
    },
    android: {
      ...appJson.expo?.android,
      usesCleartextTraffic: true,
    },
    extra: {
      ...appJson.expo?.extra,
      KAKAO_NATIVE_APP_KEY: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY || '',
      EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080',
    },
  },
};
