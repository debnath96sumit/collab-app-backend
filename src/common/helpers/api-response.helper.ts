import { ApiResponseDto } from '../dto/api-response.dto';
import { HttpStatus } from '@nestjs/common';

export function successResponse<T>(
  data: T,
  message = 'Request successful',
  statusCode = HttpStatus.OK,
): ApiResponseDto<T> {
  return {
    success: true,
    statusCode,
    message,
    data,
  };
}

export function errorResponse<T>(
  message = 'Something went wrong',
  statusCode = HttpStatus.BAD_REQUEST,
): ApiResponseDto<T> {
  return {
    success: false,
    statusCode,
    message,
    data: null,
  };
}
