const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join, resolve } = require('path');

module.exports = {
  // ✔ Moved resolve to top-level
  resolve: {
    alias: {
      "@packages": resolve(__dirname, '../../packages'),
    },
    extensions: ['.ts', '.js'],
  },

  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },

  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ["./src/assets"],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMaps: true,
    })
  ],
};
