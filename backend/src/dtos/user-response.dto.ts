import { ApiProperty } from '@nestjs/swagger';
import { UserDocument } from '../entities/user.schema';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  static fromDocument(user: UserDocument): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user._id.toString();
    dto.email = user.email;
    dto.name = user.name;
    return dto;
  }
}
