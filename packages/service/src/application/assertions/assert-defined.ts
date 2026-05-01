export function assertDefined<T>(
  value: T | undefined,
  errorFactory: () => Error,
): asserts value is T {
  if (value === undefined) {
    throw errorFactory();
  }
}
