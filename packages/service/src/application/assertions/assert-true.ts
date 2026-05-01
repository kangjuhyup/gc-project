export function assertTrue(
  value: boolean,
  errorFactory: () => Error,
): asserts value is true {
  if (!value) {
    throw errorFactory();
  }
}
