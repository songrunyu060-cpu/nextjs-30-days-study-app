"use server";
import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";

type User = {
  id: number;
  email: string;
  name: string | null;
};

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  return neon(databaseUrl);
}

export async function createRandomUser(_formData: FormData): Promise<void> {
  const sql = getSql();
  const email = `test-${crypto.randomUUID()}@test.com`;
  const name = "NextJS 16 Learner";

  await sql`insert into "User" (email, name) values (${email}, ${name})`;
  revalidatePath("/");
}

//  查找用户
export async function findUsers(): Promise<User[]> {
  const sql = getSql();
  return (await sql`select * from "User"`) as unknown as User[];
}
