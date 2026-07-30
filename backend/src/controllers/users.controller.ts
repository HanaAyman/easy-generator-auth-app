import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserResponseDto } from '../dtos/user-response.dto';
import type { UserDocument } from '../entities/user.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('users')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  @Get('me')
  @ApiOperation({ summary: 'Get the currently authenticated user (protected)' })
  me(@CurrentUser() user: UserDocument): UserResponseDto {
    return UserResponseDto.fromDocument(user);
  }
}
