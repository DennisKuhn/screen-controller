module.exports = {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    entry: {
        index: './src/index.ts',
        preload: './src/infrastructure/preload.ts'
    },
    output: {
        filename: '[name].js',
    },
    // Put your normal webpack config below here
    target: 'electron-renderer',
    node: {
        __dirname: true,
        __filename: false,
    },
    module: {
        rules: require('./webpack.rules'),
    },
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json']
    },
};
