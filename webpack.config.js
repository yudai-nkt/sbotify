const path = require("path");

module.exports = {
  target: "node", // IMPORTANT!
  entry: {
    NotifySpotifyNewReleases: path.resolve(
      __dirname,
      "./NotifySpotifyNewReleases/index.ts"
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
    // plugins: [
    //   new TsconfigPathsPlugin()
    // ]
  },
  output: {
    filename: "[name]/bundle.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs", // IMPORTANT!
  },
};
