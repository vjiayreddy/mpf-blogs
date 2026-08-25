import { ROLE_RANK, type Role } from "./constants";

export function hasMinRole(userRole: Role, required: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[required];
}

export function canPublish(role: Role): boolean {
  return hasMinRole(role, "EDITOR");
}

export function canEditAnyContent(role: Role): boolean {
  return hasMinRole(role, "EDITOR");
}

export function canUploadMedia(role: Role): boolean {
  return hasMinRole(role, "AUTHOR");
}

export function canDeleteContent(role: Role): boolean {
  return hasMinRole(role, "EDITOR");
}

export function canAssignRole(actor: Role, target: Role): boolean {
  if (actor === "OWNER") return true;
  if (actor === "ADMIN") return target !== "OWNER" && target !== "ADMIN";
  return false;
}
