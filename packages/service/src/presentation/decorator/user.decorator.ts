import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUserDto } from '@application/query/dto';
import type { HttpRequestWithAuthenticatedUser } from '../guard/member-auth.guard';

export function getAuthenticatedUser(
  context: ExecutionContext,
  property?: keyof AuthenticatedUserDto,
): AuthenticatedUserDto | AuthenticatedUserDto[keyof AuthenticatedUserDto] | undefined {
  const request = context.switchToHttp().getRequest<HttpRequestWithAuthenticatedUser>();
  const user = request.user;

  if (user === undefined || property === undefined) {
    return user;
  }

  return user[property];
}

export const User = createParamDecorator(
  (property: keyof AuthenticatedUserDto | undefined, context: ExecutionContext) =>
    getAuthenticatedUser(context, property),
);
