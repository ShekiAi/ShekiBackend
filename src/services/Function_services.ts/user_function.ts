import { prisma } from "../../db";

export async function getUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      email_address: true,
      first_name: true,
      last_name: true,
      createdAt: true
    }
  });
}