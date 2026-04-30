export function shouldRunMigrationsOnStartup(value = process.env.MIGRATIONS_RUN_ON_STARTUP): boolean {
  return ['1', 'true', 'yes', 'on'].includes(value?.trim().toLocaleLowerCase() ?? '');
}
