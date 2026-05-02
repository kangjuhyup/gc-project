import 'reflect-metadata';

export type PrivacyMaskType = 'name' | 'phoneNumber' | 'text';

export interface PrivacyFieldMetadata {
  propertyKey: string;
  mask: PrivacyMaskType;
}

const PRIVACY_FIELDS_METADATA = Symbol('PRIVACY_FIELDS_METADATA');

export function Privacy(params: { mask: PrivacyMaskType }): PropertyDecorator {
  return (target, propertyKey) => {
    const constructor = target.constructor;
    const fields = Reflect.getMetadata(PRIVACY_FIELDS_METADATA, constructor) as
      | PrivacyFieldMetadata[]
      | undefined;
    const nextFields = [
      ...(fields ?? []).filter((field) => field.propertyKey !== String(propertyKey)),
      {
        propertyKey: String(propertyKey),
        mask: params.mask,
      },
    ];

    Reflect.defineMetadata(PRIVACY_FIELDS_METADATA, nextFields, constructor);
  };
}

export function getPrivacyFields(value: object): PrivacyFieldMetadata[] {
  return (
    (Reflect.getMetadata(PRIVACY_FIELDS_METADATA, value.constructor) as
      | PrivacyFieldMetadata[]
      | undefined) ?? []
  );
}
