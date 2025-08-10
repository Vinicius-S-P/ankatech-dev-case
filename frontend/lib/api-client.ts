interface APIClientOptions {
  baseURL: string;
  headers?: Record<string, string>;
}

export class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(options: APIClientOptions) {
    this.baseURL = options.baseURL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...options.headers,
    };
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      method,
      headers: { ...this.defaultHeaders, ...headers },
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Request failed for ${method} ${url}:`, error);
      throw error;
    }
  }

  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>("GET", endpoint, undefined, headers);
  }

  post<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>("POST", endpoint, data, headers);
  }

  put<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>("PUT", endpoint, data, headers);
  }

  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>("DELETE", endpoint, undefined, headers);
  }
}