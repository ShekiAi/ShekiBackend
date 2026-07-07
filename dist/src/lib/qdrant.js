"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/lib/qdrant.ts
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const js_client_rest_1 = require("@qdrant/js-client-rest");
const qdrant = new js_client_rest_1.QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});
exports.default = qdrant;
//# sourceMappingURL=qdrant.js.map