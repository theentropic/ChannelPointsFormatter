const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
module.exports = {
    mode: "production",
    entry: {
        "points-formatter": path.resolve(__dirname, "src", "points-formatter.ts"),
        "index": path.resolve(__dirname, "src", "index.ts")
    },
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].js",
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new CopyPlugin({ patterns: [{ from: ".", to: ".", context: "resources" }] }),
    ],
    optimization: {
        minimize: false
    }
};