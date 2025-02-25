export const MAX_PAGE_SIZE = 100;
export const MAX_PAGE_NUMBER = 25;

export const DefaultPageSize = {
  USERS: 10,
  ROLES: 10,
  CATEGORIES: 10,
  PRIORITIES: 10,
  TICKETS: 10,
} as const satisfies Record<string, number>;
