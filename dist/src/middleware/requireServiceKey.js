"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireServiceKey = requireServiceKey;
function requireServiceKey(req, res, next) {
    const provided = req.headers["x-service-key"];
    const expected = process.env.SHEKIAI_SERVICE_KEY;
    if (!expected) {
        console.error("SHEKIAI_SERVICE_KEY is not configured — refusing all course-draft requests.");
        return res.status(500).json({ message: "Server misconfigured", data: [], status: 500, error: ["SHEKIAI_SERVICE_KEY not set"] });
    }
    if (provided !== expected) {
        return res.status(401).json({ message: "Invalid or missing service key", data: [], status: 401, error: ["unauthorized"] });
    }
    next();
}
//# sourceMappingURL=requireServiceKey.js.map