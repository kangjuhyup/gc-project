import path from 'node:path';

const quote = (value) => JSON.stringify(value);

const toPackageRelativeArgs = (files, packageDir) =>
  files
    .map((file) => quote(path.relative(path.join(import.meta.dirname, packageDir), file)))
    .join(' ');

export default {
  'packages/service/src/**/*.{js,jsx,ts,tsx,mjs,cjs}': [
    (files) =>
      `pnpm --filter @gc-project/service exec eslint --fix ${toPackageRelativeArgs(
        files,
        'packages/service',
      )}`,
    'prettier --write',
  ],
  'packages/ui/src/**/*.{js,jsx,ts,tsx,mjs,cjs}': [
    (files) =>
      `pnpm --filter @gc-project/ui exec eslint --fix ${toPackageRelativeArgs(files, 'packages/ui')}`,
    'prettier --write',
  ],
  'packages/{service,ui}/test/**/*.{js,jsx,ts,tsx,mjs,cjs}': 'prettier --write',
  'packages/{service,ui}/src/**/*.{css,json}': 'prettier --write',
  '*.{json,js,mjs,cjs,css,html}': 'prettier --write',
  'packages/{service,ui}/*.{json,js,mjs,cjs,css,html}': 'prettier --write',
};
