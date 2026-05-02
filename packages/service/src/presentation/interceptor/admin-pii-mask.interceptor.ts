import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, mergeMap } from 'rxjs';
import {
  CommandBus,
  getPrivacyFields,
  RecordAdminAuditCommand,
  type PrivacyFieldMetadata,
} from '@application';
import type { AuthenticatedAdminDto } from '@application/query/dto';

const UNMASK_HEADER = 'x-admin-unmask-pii';
const UNMASK_REASON_HEADER = 'x-admin-unmask-reason';
interface AdminPiiRequest {
  admin?: AuthenticatedAdminDto;
  headers: Record<string, string | string[] | undefined>;
  method?: string;
  originalUrl?: string;
  url?: string;
  route?: {
    path?: string;
  };
}

interface PrivacyItem {
  id: string;
  [key: string]: unknown;
}

interface PrivacyListResponse {
  items: PrivacyItem[];
  [key: string]: unknown;
}

@Injectable()
export class AdminPiiMaskInterceptor implements NestInterceptor {
  constructor(private readonly commandBus: CommandBus) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AdminPiiRequest>();
    const shouldUnmask = this.shouldUnmask(request);
    const reason = this.unmaskReason(request);

    if (shouldUnmask && reason === undefined) {
      throw new BadRequestException('ADMIN_UNMASK_REASON_REQUIRED');
    }

    return next.handle().pipe(
      mergeMap(async (response) => {
        if (!this.isPrivacyListResponse(response)) {
          return response;
        }

        const privacyFields = this.privacyFields(response);

        if (privacyFields.length === 0) {
          return response;
        }

        if (shouldUnmask) {
          await this.recordAudit(request, response, privacyFields, reason);
          return this.transform(response, privacyFields, false);
        }

        return this.transform(response, privacyFields, true);
      }),
    );
  }

  private shouldUnmask(request: AdminPiiRequest): boolean {
    return this.headerValue(request, UNMASK_HEADER)?.toLowerCase() === 'true';
  }

  private unmaskReason(request: AdminPiiRequest): string | undefined {
    const reason = this.decodeHeaderValue(this.headerValue(request, UNMASK_REASON_HEADER))?.trim();
    return reason === '' ? undefined : reason;
  }

  private decodeHeaderValue(value: string | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  private headerValue(request: AdminPiiRequest, name: string): string | undefined {
    const value = request.headers[name];

    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }

  private isPrivacyListResponse(response: unknown): response is PrivacyListResponse {
    if (typeof response !== 'object' || response === null || !('items' in response)) {
      return false;
    }

    const { items } = response as { items?: unknown };

    return Array.isArray(items) && items.every((item) => this.isPrivacyItem(item));
  }

  private isPrivacyItem(item: unknown): item is PrivacyItem {
    if (typeof item !== 'object' || item === null) {
      return false;
    }

    const candidate = item as Partial<PrivacyItem>;

    return typeof candidate.id === 'string';
  }

  private privacyFields(response: PrivacyListResponse): PrivacyFieldMetadata[] {
    return response.items[0] === undefined ? [] : getPrivacyFields(response.items[0]);
  }

  private async recordAudit(
    request: AdminPiiRequest,
    response: PrivacyListResponse,
    privacyFields: PrivacyFieldMetadata[],
    reason: string | undefined,
  ): Promise<void> {
    await this.commandBus.execute(
      RecordAdminAuditCommand.of({
        adminId: request.admin?.adminId ?? 'UNKNOWN',
        httpMethod: request.method ?? 'GET',
        path: this.requestPath(request),
        unmaskedFields: privacyFields.map((field) => field.propertyKey),
        targetType: 'MEMBER',
        targetIds: response.items.map((item) => item.id),
        reason: reason ?? '',
        occurredAt: new Date(),
      }),
    );
  }

  private requestPath(request: AdminPiiRequest): string {
    return (
      request.route?.path ?? request.originalUrl?.split('?')[0] ?? request.url?.split('?')[0] ?? ''
    );
  }

  private transform<RESPONSE extends PrivacyListResponse>(
    response: RESPONSE,
    privacyFields: PrivacyFieldMetadata[],
    masked: boolean,
  ): RESPONSE {
    return {
      ...response,
      items: response.items.map((item) => ({
        ...item,
        ...Object.fromEntries(
          privacyFields.map((field) => [
            field.propertyKey,
            masked
              ? this.maskValue(String(item[field.propertyKey] ?? ''), field.mask)
              : item[field.propertyKey],
          ]),
        ),
      })),
      privacy: {
        masked,
        fields: privacyFields.map((field) => field.propertyKey),
      },
    };
  }

  private maskValue(value: string, mask: PrivacyFieldMetadata['mask']): string {
    if (mask === 'name') {
      return this.maskName(value);
    }

    if (mask === 'phoneNumber') {
      return this.maskPhoneNumber(value);
    }

    return '*'.repeat(value.length);
  }

  private maskName(value: string): string {
    if (value.length <= 1) {
      return '*';
    }

    if (value.length === 2) {
      return `${value[0]}*`;
    }

    return `${value[0]}${'*'.repeat(value.length - 2)}${value[value.length - 1]}`;
  }

  private maskPhoneNumber(value: string): string {
    const digits = value.replace(/\D/g, '');

    if (digits.length < 7) {
      return '*'.repeat(value.length);
    }

    return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
  }
}
