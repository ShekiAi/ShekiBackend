"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
const db_1 = require("../../db");
async function getUsers() {
    return await db_1.prisma.user.findMany({
        select: {
            id: true,
            email_address: true,
            first_name: true,
            last_name: true,
            createdAt: true
        }
    });
}
//# sourceMappingURL=user_function.js.map