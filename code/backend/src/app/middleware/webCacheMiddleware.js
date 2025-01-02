module.exports = {
    setNoCache: function (res) {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 1);
        res.setHeader("Expires", date.toUTCString());
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Cache-Control", "public, no-cache");
    },

    setLongTermCache: function (res) {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        res.setHeader("Expires", date.toUTCString());
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
};
