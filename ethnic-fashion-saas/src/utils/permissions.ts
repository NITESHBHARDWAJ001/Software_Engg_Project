import { UserRole, ModulePermissions, PermissionConfig } from '../types';

const fullAccess: PermissionConfig = {
  read: true,
  create: true,
  update: true,
  delete: true,
};

const readWrite: PermissionConfig = {
  read: true,
  create: true,
  update: true,
  delete: false,
};

const readOnly: PermissionConfig = {
  read: true,
  create: false,
  update: false,
  delete: false,
};

const noAccess: PermissionConfig = {
  read: false,
  create: false,
  update: false,
  delete: false,
};

export const ROLE_PERMISSIONS: Record<UserRole, ModulePermissions> = {
  [UserRole.SUPER_ADMIN]: {
    dashboard: fullAccess,
    tasks: fullAccess,
    exhibitions: fullAccess,
    customers: fullAccess,
    inventory: fullAccess,
    finance: fullAccess,
    marketing: fullAccess,
    analytics: fullAccess,
    settings: fullAccess,
    users: fullAccess,
  },
  [UserRole.ORG_ADMIN]: {
    dashboard: fullAccess,
    tasks: fullAccess,
    exhibitions: fullAccess,
    customers: fullAccess,
    inventory: fullAccess,
    finance: fullAccess,
    marketing: fullAccess,
    analytics: fullAccess,
    settings: fullAccess,
    users: fullAccess,
  },
  [UserRole.MANAGER]: {
    dashboard: readOnly,
    tasks: fullAccess,
    exhibitions: fullAccess,
    customers: fullAccess,
    inventory: readWrite,
    finance: readOnly,
    marketing: readWrite,
    analytics: readOnly,
    settings: readOnly,
    users: readOnly,
  },
  [UserRole.STAFF]: {
    dashboard: readOnly,
    tasks: {
      read: true,
      create: true,
      update: true,
      delete: false,
    },
    exhibitions: {
      read: true,
      create: true,
      update: true,
      delete: false,
    },
    customers: readOnly,
    inventory: readOnly,
    finance: noAccess,
    marketing: noAccess,
    analytics: noAccess,
    settings: readOnly,
    users: noAccess,
  },
};

export function hasPermission(
  role: UserRole,
  module: keyof ModulePermissions,
  action: keyof PermissionConfig
): boolean {
  return ROLE_PERMISSIONS[role][module][action];
}

export function canAccessModule(
  role: UserRole,
  module: keyof ModulePermissions
): boolean {
  return ROLE_PERMISSIONS[role][module].read;
}

export function getAccessibleModules(role: UserRole): string[] {
  const permissions = ROLE_PERMISSIONS[role];
  return Object.entries(permissions)
    .filter(([_, config]) => config.read)
    .map(([module]) => module);
}
