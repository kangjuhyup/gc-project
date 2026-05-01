export function assertNonEmpty<T>(
  values: T[],
  errorFactory: () => Error,
): asserts values is [T, ...T[]] {
  if (values.length === 0) {
    throw errorFactory();
  }
}
