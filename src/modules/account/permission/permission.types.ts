export interface PermissionItem {
  key: string;
  label?: string;
  title?: string;
  group?: string;
  route?: string;
  list?: PermissionItem[];
}
