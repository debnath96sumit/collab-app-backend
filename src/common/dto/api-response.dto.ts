export class ApiResponseDto<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
}
