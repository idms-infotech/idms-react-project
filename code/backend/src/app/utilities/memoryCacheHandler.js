const cache = require("memory-cache");
class MemoryCache {
    constructor() {
        this.cache = cache;
    }
    put(key, value) {
        this.cache[key] = {
            value
        };
    }

    get(key) {
        const cachedItem = this.cache[key];
        return cachedItem?.value;
    }
}

module.exports = new MemoryCache();
