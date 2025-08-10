import { APIClient } from "./api-client";

export const api = new APIClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api",
});