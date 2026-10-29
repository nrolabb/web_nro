const path = require("path");
const fs = require("fs-extra");

module.exports = {
    name: "api/boss-live",
    method: "GET",
    middleware: [],
    run: async ({ req, res }) => {
        try {
            var bossesData = [];
            var bossesJsonPath = path.join(__dirname, "../../bosses.json");
            var lastUpdated = null;

            if (fs.existsSync(bossesJsonPath)) {
                try {
                    var stats = fs.statSync(bossesJsonPath);
                    lastUpdated = stats.mtime;
                    var content = fs.readFileSync(bossesJsonPath, "utf-8");
                    bossesData = JSON.parse(content);
                } catch (e) {
                    console.error("Error reading bosses.json in api/boss-live:", e);
                }
            }

            return res.json({
                success: true,
                count: bossesData.length,
                bosses: bossesData,
                lastUpdated: lastUpdated ? lastUpdated.toLocaleTimeString("vi-VN") : new Date().toLocaleTimeString("vi-VN")
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message,
                bosses: []
            });
        }
    },
};
