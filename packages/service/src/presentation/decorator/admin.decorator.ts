import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedAdminDto } from '@application/query/dto';
import type { HttpRequestWithAuthenticatedAdmin } from '../guard/admin-auth.guard';

export function getAuthenticatedAdmin(
  context: ExecutionContext,
  property?: keyof AuthenticatedAdminDto,
): AuthenticatedAdminDto | AuthenticatedAdminDto[keyof AuthenticatedAdminDto] | undefined {
  const request = context.switchToHttp().getRequest<HttpRequestWithAuthenticatedAdmin>();
  const admin = request.admin;

  if (admin === undefined || property === undefined) {
    return admin;
  }

  return admin[property];
}

export const Admin = createParamDecorator(
  (property: keyof AuthenticatedAdminDto | undefined, context: ExecutionContext) =>
    getAuthenticatedAdmin(context, property),
);
