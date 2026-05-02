const encryptedProperties = new WeakMap<Function, Set<string>>();

export function EncryptedProperty(): PropertyDecorator {
  return (target, propertyKey) => {
    const constructor = target.constructor;
    const properties = encryptedProperties.get(constructor) ?? new Set<string>();
    properties.add(String(propertyKey));
    encryptedProperties.set(constructor, properties);
  };
}

export function getEncryptedProperties(entity: object): string[] {
  return [...(encryptedProperties.get(entity.constructor) ?? [])];
}
