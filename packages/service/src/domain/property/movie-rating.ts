export const MovieRating = {
  ALL: 'ALL',
  AGE_12: '12',
  AGE_15: '15',
  AGE_19: '19',
} as const;

export type MovieRating = (typeof MovieRating)[keyof typeof MovieRating];
