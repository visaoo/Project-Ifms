import axios from 'axios';

export const authApi = axios.create({
  baseURL: import.meta.env.VITE_HOST_API ?? 'https://api.sigea.fun',
  timeout: 10_000,
});

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface AuthUser {
  email: string;
  nome?: string;
  role?: string;
}

export interface LoginResponse {
  token: string;
  user?: AuthUser;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await authApi.post<LoginResponse>('/login', payload);
  return data;
}
