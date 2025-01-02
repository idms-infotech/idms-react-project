const rateLimit = require("express-rate-limit");

class RateLimiter {
    constructor(windowMs, maxRequests) {
        this.limiter = rateLimit({
            windowMs,
            max: maxRequests,
            message: "Too many requests from this IP, please try again later."
        });
    }

    // Method to apply the rate limiter middleware to the entire app
    apply(app) {
        app.use(this.limiter);
    }

    // Method to get the rate limiter middleware for specific routes
    getMiddleware() {
        return this.limiter;
    }
}

module.exports = RateLimiter;
