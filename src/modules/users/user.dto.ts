import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, TransformFnParams } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ChangePasswordDTO {
  @ApiProperty({ description: 'Old Password', required: true })
  @IsString({ message: 'Value must be a string' })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: 'Old Password is required!' })
  oldPassword: string;

  @ApiProperty({ description: 'New Password', required: true })
  @IsString({ message: 'Value must be a string' })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: 'New Password is required!' })
  newPassword: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Full Name' })
  @IsString()
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  fullName?: string;
  
  @ApiPropertyOptional({ description: 'Email' })
  @IsString()
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => value?.trim()?.toLowerCase())
  @IsEmail({}, { message: 'Please enter a valid email!' })
  email?: string;
  
  @ApiPropertyOptional({ description: 'User Name' })
  @IsString()
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  username?: string;

  @ApiPropertyOptional({
    description: 'Avatar image',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  avatar?: Express.Multer.File;
}