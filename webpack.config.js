const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  target: "node",
  entry: {
    NotifyTodaysReleases: path.resolve(
      __dirname,
      "./NotifyTodaysReleases/index.ts"
    ),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "[name]/bundle.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs",
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "host.json" },
        { from: "*/function.json", to: "[file]" },
      ],
    }),
  ],
};
