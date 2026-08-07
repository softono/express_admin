export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export const USER_STATUS_LABEL = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "destructive" },
} as const;

export const USER_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export const ADMIN_ROLES = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];
export const USER_ACTIVITY = {
  LOGIN_FAILED: "Login Fail",
  LOGIN_SUCCESS: "Login Success",
  REGISTER: "Register",
  LOGIN_WITH_OTP: "Login With Otp",
  LOGIN_WITH_SOCIAL: "Login With Social Media",
  LOGIN_WITH_LINK: "Login With Magic Link",
  REGISTER_WITH_SOCIAL: "Register With Social Media",
  LOGOUT: "Logout",
  ACCOUNT_DEACTIVATE: "Account deactivate",
  EMAIL_UPDATE: "Email update",
  PASSWORD_CHANGED: "password changed",
  ACCOUNT_UPDATE: "Account update",
  DEVICE_LOGGED_OUT: "device logged out",
  IMAGE_UPLOADED: "Image uploaded",
  PASSWORD_SET: "Password set",
  PASSKEY_ADDED: "Passkey added",
  PASSKEY_DELETED: "Passkey deleted",
  BACKUP_CODES_REGENERATED: "Backup codes regenerated",
  TFA_ENABLED: "TFA enabled",
  TFA_DISABLED: "TFA disabled",
  TFA_AUTHENTICATOR_REMOVED: "Authenticator app removed",
  //ADMIN ACTIVITY
  SETTING_UPDATE: "Setting update",
  ADMIN_UPDATE: "Admin update",
  USER_UPDATE: "User update",
  DATA_UPDATE: "Data update",
} as const;
