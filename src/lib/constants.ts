export const ROLES = ["OWNER", "ADMIN", "EDITOR", "AUTHOR", "READER"] as const;
export type Role = (typeof ROLES)[number];

export const CONTENT_STATUSES = ["draft", "scheduled", "published"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const ROLE_RANK: Record<Role, number> = {
  READER: 0,
  AUTHOR: 1,
  EDITOR: 2,
  ADMIN: 3,
  OWNER: 4,
};
