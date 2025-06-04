import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:8080/api/v1/",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export function isAxiosError(error: unknown) {
  return typeof error === "object" && error !== null && "response" in error
}

export type AxiosErrorResponse = {
  data: {
    error: string;
  };
  status: number;
  statusText: string;
  headers: Record<string, string>;
};