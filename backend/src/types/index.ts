export type Category = 'plano_original' | 'situacao_atual' | 'custo_vida';

export interface CreateDataDTO {
  label: string;
  value: number;
  category: Category;
  date?: Date | string;
}

export interface UpdateDataDTO {
  label?: string;
  value?: number;
  category?: Category;
  date?: Date | string;
}

export interface DataFilters {
  category?: Category;
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SummaryData {
  category: Category;
  total: number;
  average: number;
  min: number;
  max: number;
  count: number;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}

