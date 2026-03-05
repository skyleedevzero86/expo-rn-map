module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@domain': './src/domain',
            '@application': './src/application',
            '@infrastructure': './src/infrastructure',
            '@presentation': './src/presentation',
          },
        },
      ],
    ],
  };
};
