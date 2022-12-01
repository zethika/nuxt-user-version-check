const { resolve } = require('path')

module.exports = {
    rootDir: resolve(__dirname, '..'),
    buildDir: resolve(__dirname, '.nuxt'),
    head: {
        title: '@zethika/nuxt-user-version-check'
    },
    srcDir: __dirname,
    render: {
        resourceHints: false
    },
    modules: [
        'cookie-universal-nuxt',
        { handler: require('../') }
    ],
    userVersionCheck: {
        debug: true
    }
}
