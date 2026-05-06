const path = require("path");
const { composePlugins, withNx } = require("@nx/webpack");

module.exports = composePlugins(withNx(), (config) => {
  // Entry and target
  config.entry = "./src/main.ts";
  config.mode = "production";
  config.target = "node";

  // OUTPUT -> place dist inside the app folder so Nx can find apps/auth-service/dist/main.js
  config.output = {
  path: path.resolve(__dirname, "../../dist/apps/auth-service"),
  filename: "main.js",
  clean: true,
};


  // Resolve aliases and extensions
  config.resolve = {
    alias: {
      "@packages": path.resolve(__dirname, "../../packages"),
    },
    extensions: [".ts", ".js", ".json"],
    fullySpecified: false,
    symlinks: false,
  };

  // TypeScript loader
  config.module = {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
            // ⭐ FIX: Explicitly tell webpack which tsconfig to use
            configFile: path.resolve(__dirname, "tsconfig.json"),
          },
        },
        exclude: /node_modules/,
      },
    ],
  };
  config.watch = false;
  return config;
});
