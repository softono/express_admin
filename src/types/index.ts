/* eslint-disable @typescript-eslint/no-explicit-any */
// ApiResponse — shape every API route must return
export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data?: T;
}

// ApiResult — shape every api service method must return (adds http_status)
export interface ApiResult<T = any> extends ApiResponse<T> {
  http_status: number;
}
