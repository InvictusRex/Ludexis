export type LoadingState = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}
