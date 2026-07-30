import { httpClient } from './http-client';
import type { User } from '../types/user';

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export async function signUp(payload: SignUpPayload): Promise<User> {
  const { data } = await httpClient.post<User>('/auth/signup', payload);
  return data;
}

export async function signIn(payload: SignInPayload): Promise<User> {
  const { data } = await httpClient.post<User>('/auth/signin', payload);
  return data;
}

export async function signOut(): Promise<void> {
  await httpClient.post('/auth/logout');
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await httpClient.get<User>('/users/me');
  return data;
}
