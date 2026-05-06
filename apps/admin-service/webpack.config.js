const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const path = require('path');

const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/admin-service'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  resolve: {
    alias: {
      '@packages': path.resolve(__dirname, '../../packages'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMaps: true,
    }),
  ],
};
