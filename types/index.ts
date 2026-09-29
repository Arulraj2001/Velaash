/**
 * Shared Global Types
 */

export * from "./database.types";

export interface ActionSuccess<T = void> {
  success: true;
  data: T;
  message?: string;
}

export interface ActionError {
  success: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
}

export type ActionResponse<T = void> = ActionSuccess<T> | ActionError;

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
