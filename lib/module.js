const path = require('path');
const fs = require('fs');
const crypto = require('crypto')
const defaults = require('./defaults')

module.exports = function userVersionCheck (_options) {
    const options = Object.assign(defaults, _options,this.options.userVersionCheck)

    const filePath = path.join(this.nuxt.options.buildDir, options.filename);

    this.nuxt.hook('build:done', async (builder) => {
        const data = {
            client: {},
            server: {},
            generated: new Date().getTime()
        };

        const resources = builder.nuxt.renderer.resources;

        if(typeof resources.clientManifest !== 'undefined'){
            Object.keys(resources.clientManifest).forEach(key => {
                if(typeof resources.clientManifest[key] === 'object')
                    data.client[key] = crypto.createHash('md5').update(JSON.stringify(resources.clientManifest[key])).digest("hex")
            })
        }

        if(typeof resources.serverManifest !== 'undefined') {
            Object.keys(resources.serverManifest).forEach(key => {
                if (typeof resources.serverManifest[key] === 'object')
                    data.server[key] = crypto.createHash('md5').update(JSON.stringify(resources.serverManifest[key])).digest("hex")
            })
        }

        fs.writeFileSync(filePath, JSON.stringify(data))
    })

    this.addServerMiddleware({
        path: options.middlewareUrl,
        async handler(req, res) {
            fs.readFile(filePath, (err, json) => {
                res.end(json);
            });
        },
    });

    this.addTemplate({
        src: path.resolve(__dirname, 'UserVersionCheck.js'),
        fileName: path.join('uvc', 'UserVersionCheck.js'),
        options
    })

    this.addPlugin({
        src: path.resolve(__dirname, 'plugin.js'),
        options,
        fileName: path.join('uvc', 'uvc.client.js'),
    });
}

module.exports.meta = require('../package.json')
