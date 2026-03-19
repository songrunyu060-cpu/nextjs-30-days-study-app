"use server";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { users, type User } from "@/schema";

export async function createRandomUser(_formData: FormData): Promise<void> {
  const email = `test-${crypto.randomUUID()}@test.com`;
  const name = "NextJS 16 Learner";

  await db.insert(users).values({ email, name });
  revalidatePath("/");
}

//  查找用户
export async function findUsers(): Promise<User[]> {
  return await db.select().from(users);
}
