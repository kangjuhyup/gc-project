export const MovieImageType = {
  POSTER: 'POSTER',
  STILL: 'STILL',
} as const;

export type MovieImageType = (typeof MovieImageType)[keyof typeof MovieImageType];
