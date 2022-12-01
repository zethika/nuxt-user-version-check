export default class UserVersionCheck{
    _app = null;
    lastVersion = null;

    constructor(options) {
        this.middlewareUrl = options.middlewareUrl;
        this.cookieName = options.versionCookieName;
        this.checkInterval = options.checkInterval;
        this.eventName = options.documentEventName;
        this.debug = options.debug;
        this.initScenariosWhenReady()
    }

    get app() {
        return this._app;
    }

    set app(value) {
        this._app = value;
    }

    log(string){
        if(this.debug) console.log(string)
    }

    /**
     * We need both the app and the $cookies property on the app object to be present.
     * When checkForDiff was run immediately from the plugin function, sometimes $cookie would not be present on app yet.
     */
    initScenariosWhenReady(){
        if(this.app === null || typeof this.app.$cookies === 'undefined')
            return setTimeout(() => this.initScenariosWhenReady(),10)

        this.log('uvc: Ready')

        // Check immediately on page load
        this.checkForDiff()

        // Check at consistent intervals
        setInterval(() => this.checkForDiff(),this.checkInterval * 1000)

        // Check when the browser tab becomes active
        window.onfocus = () => this.checkForDiff()
    }

    /**
     * Checks if a difference has occurred, possibly triggering events / actions
     */
    checkForDiff(){
        this.log('uvc: Checking diff')
        this.ensureLocalVersion();
        const hadVersion = this.lastVersion !== null;

        this.fetchVersion()
        .then(remoteVersion => {
            if(hadVersion)
            {
                const diff = this.determineDiff(remoteVersion)
                if(diff.length > 0)
                    this.trigger(remoteVersion,diff);
                else
                    this.log('uvc: No diff')
            }

            this.updateLocalVersion(remoteVersion)
        })
        .catch(error => {
            this.log(error);
            // ?
        })
    }

    /**
     * @param remoteVersion
     * @param diff
     */
    trigger(remoteVersion,diff){
        this.log('uvc: Had diff '+JSON.stringify(diff))
        document.dispatchEvent(new CustomEvent(this.eventName, {
            detail: {
                old: this.lastVersion,
                new: remoteVersion,
                diff: diff
            }
        }));
    }

    /**
     *
     * @param remoteVersion
     * @returns {*[]}
     */
    determineDiff(remoteVersion){
        let diffs = [];
        Object.entries(this.lastVersion.client).forEach(entry => {
            if(remoteVersion.client[entry[0]] !== entry[1])
                diffs.push('client.'+entry[0])
        })

        Object.entries(this.lastVersion.server).forEach(entry => {
            if(remoteVersion.server[entry[0]] !== entry[1])
                diffs.push('server.'+entry[0])
        })

        return diffs;
    }

    /**
     * Updates the local version data and persists them into the cookie
     * @param version
     */
    updateLocalVersion(version){
        this.lastVersion = version;
        this.app.$cookies.set(this.cookieName,version,{path: '/', expires: new Date(new Date().getTime() + 1000 * 3600 * 24 * 30)})
    }

    /**
     * Checks the locally stored versions and persists them in the local store.
     * Locally stored version takes precedence over cookie versions, since it represents an individual browser tab
     */
    ensureLocalVersion(){
        if(this.lastVersion !== null) return;

        const cookie = this.app.$cookies.get(this.cookieName)
        if(typeof cookie !== 'undefined')
            this.lastVersion = cookie;
    }

    /**
     * Attempts to fetch the url present on the remote
     */
    fetchVersion(){
        return new Promise((resolve,reject) => {
            fetch(this.middlewareUrl)
            .then(response => response.json())
            .then(data => resolve(data))
            .catch(error => reject(error));
        })
    }
}
