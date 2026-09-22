import client from "./client";
import type { User } from "@/types";

export const usersApi = {
  async getMe(): Promise<User> {
    const { data } = await client.get<User>("/users/me");
    return data;
  },

  async getByCreator(creatorId: string): Promise<User[]> {
    const { data } = await client.get<User[]>(`/users/creator/${creatorId}`);
    return data;
  },

  async getAll(): Promise<User[]> {
    const { data } = await client.get<User[]>("/users");
    return data;
  },

  async getById(id: string): Promise<User> {
    const { data } = await client.get<User>(`/users/${id}`);
    return data;
  },

  // ✅ create con created_by
  async create(payload: {
    email: string;
    password: string;
    displayName: string;
    status: string;
    roleIds: number[];
    created_by?: string; 
  }): Promise<User> {
    console.log('📡 Enviando al backend:', JSON.stringify(payload, null, 2));
    const { data } = await client.post<User>("/users", payload);
    return data;
  },

  async update(id: string, payload: {
    displayName?: string;
    email?: string;
    status?: string;
    roleIds?: number[];
  }): Promise<User> {
    const { data } = await client.patch<User>(`/users/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await client.delete(`/users/${id}`);
  },
};