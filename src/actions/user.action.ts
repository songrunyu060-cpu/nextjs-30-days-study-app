"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { NewUser, User } from "@/schema";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "@/services/user.service";

const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).nullable().optional(),
});

const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).nullable().optional(),
});

export async function listUsersAction(): Promise<User[]> {
  return await getAllUsers();
}

export async function getUserByIdAction(id: number) {
  return await getUserById(id);
}

export async function createUserAction(input: unknown) {
  const data = userCreateSchema.parse(input);
  await createUser(data as NewUser);
  revalidatePath("/users");
}

export async function updateUserAction(id: number, input: unknown) {
  const data = userUpdateSchema.parse(input);
  await updateUser(id, data as NewUser);
  revalidatePath("/users");
}

export async function deleteUserAction(id: number) {
  await deleteUser(id);
  revalidatePath("/users");
}
