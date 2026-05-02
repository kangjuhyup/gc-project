export class EnvironmentAdapterFlag {
  private constructor(
    readonly name: string,
    private readonly value?: string,
  ) {}

  static of(params: { name: string; value?: string }): EnvironmentAdapterFlag {
    return new EnvironmentAdapterFlag(params.name, params.value);
  }

  select<T>(params: { adapters: Record<string, T>; fallback: T }): T {
    const adapter =
      this.normalizedValue === undefined ? undefined : params.adapters[this.normalizedValue];

    return adapter ?? params.fallback;
  }

  matches(value: string): boolean {
    return this.normalizedValue === value.trim().toLocaleLowerCase();
  }

  private get normalizedValue(): string | undefined {
    const normalized = this.value?.trim().toLocaleLowerCase();
    return normalized === '' ? undefined : normalized;
  }
}
