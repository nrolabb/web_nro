require("dotenv").config();
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || Buffer.byteLength(jwtSecret, 'utf8') < 32) {
    throw new Error('JWT_SECRET phải được cấu hình và có ít nhất 32 byte.');
}
const databaseUser = process.env.DB_USER;
const databasePassword = process.env.DB_PASSWORD;
if (!databaseUser || databaseUser.toLowerCase() === 'root' || !databasePassword) {
    throw new Error('Cấu hình DB_USER riêng cho web và mật khẩu DB_PASSWORD trước khi khởi động.');
}

const accountRanks = [
    { name: "Đồng", key: "bronze", env: "ACCOUNT_RANK_BRONZE", amount: 10000 },
    { name: "Bạc", key: "silver", env: "ACCOUNT_RANK_SILVER", amount: 100000 },
    { name: "Vàng", key: "gold", env: "ACCOUNT_RANK_GOLD", amount: 500000 },
    { name: "Kim cương", key: "diamond", env: "ACCOUNT_RANK_DIAMOND", amount: 1000000 }
];
const configuredRanks = accountRanks.map(rank => ({
    ...rank,
    amount: process.env[rank.env]?.trim() ? Number(process.env[rank.env]) : rank.amount
}));
const validRanks = configuredRanks.every((rank, index) =>
    Number.isSafeInteger(rank.amount) && rank.amount > 0 &&
    (index === 0 || rank.amount > configuredRanks[index - 1].amount)
);
if (!validRanks) {
    console.warn("[Config] ACCOUNT_RANK_* phải là số nguyên dương tăng dần Đồng < Bạc < Vàng < Kim cương. Sử dụng các mốc mặc định.");
}

const jackpotPools = accountRanks.map((rank, index) => {
    const prefix = 'JACKPOT_' + rank.key.toUpperCase();
    const base = Number(process.env[prefix + '_BASE_VND'] || [10000, 50000, 200000, 1000000][index]);
    if (!Number.isSafeInteger(base) || base <= 0 || base > 2147483647) {
        throw new Error(prefix + ': mức khởi điểm phải là số nguyên dương hợp lệ');
    }
    return { chestId: index, base };
});

const legacyJackpotPrice = process.env.JACKPOT_PRICE_VND?.trim();
const jackpotPrices = accountRanks.map((rank, index) => {
    const name = 'JACKPOT_' + rank.key.toUpperCase() + '_PRICE_VND';
    const rawPrice = process.env[name]?.trim() || legacyJackpotPrice || '1000';
    const price = Number(rawPrice);
    if (!Number.isSafeInteger(price) || price <= 0 || price > 2147483647) {
        throw new Error(name + ' không hợp lệ');
    }
    return { chestId: index, price };
});

const jackpotChancePercent = Number(process.env.JACKPOT_CHANCE_PERCENT?.trim() || '0.01');
if (!Number.isFinite(jackpotChancePercent) || jackpotChancePercent < 0 || jackpotChancePercent > 100 ||
    !Number.isInteger(jackpotChancePercent * 1_000_000)) {
    throw new Error('JACKPOT_CHANCE_PERCENT phải từ 0 đến 100, tối đa 6 chữ số thập phân');
}
// Resolution is 1 in 100,000,000 draws, supporting percentage steps down to 0.000001%.
const jackpotChanceThreshold = Math.round(jackpotChancePercent * 1_000_000);

function socialUrl(name) {
    const value = process.env[name] || 'https://ngocrongarena.com/';
    try { const url = new URL(value); if (['https:', 'http:'].includes(url.protocol)) return url.href; } catch (_) {}
    return 'https://ngocrongarena.com/';
}
module.exports = {
    socialLinks: { facebook: socialUrl('SOCIAL_FACEBOOK_URL'), zalo: socialUrl('SOCIAL_ZALO_URL') },
    jackpotPools,
    jackpotPrices,
    jackpotChancePercent,
    jackpotChanceThreshold,
    accountRanks: (validRanks ? configuredRanks : accountRanks).map(({ name, key, amount }) => ({ name, key, amount })),
    host: process.env.HOST || "127.0.0.1",
    port: Number(process.env.PORT) || 3000,
    database: {
        host: process.env.DB_HOST || "127.0.0.1",
        database: process.env.DB_NAME || "nro_arn",
        user: databaseUser,
        password: databasePassword,
        port: Number(process.env.DB_PORT) || 3306
    },
    download: {
        pc: process.env.DOWNLOAD_PC || "#",
        ios: process.env.DOWNLOAD_IOS || "https://testflight.apple.com/join/6OHPuQQZ",
        apk: process.env.DOWNLOAD_APK || "#"
    },
    sidebar: [
        { name: "Trang chủ", path: "/", icon: "" },
        { name: "Boss Live", path: "/boss", icon: "" },
        { name: "Nạp tiền", path: "/naptien", icon: "" },
        { name: "Lịch sử", path: "/history", icon: "" },
        { name: "Vòng quay", path: "/spin", icon: "" },
        { name: "Hồ sơ", path: "/profile", icon: "" },
        { name: "Admin", path: "/panel/admin?type=home", icon: "" }
    ],
    active_coins: 20000,
    jwt_secretkey: jwtSecret,
    publicOrigin: process.env.PUBLIC_ORIGIN || '',
    logPath: "c:\\NRO_Server\\Web\\logs",
    maxLogLines: 500
}
