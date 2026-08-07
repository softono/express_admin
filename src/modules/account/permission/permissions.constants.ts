import type { PermissionItem } from "@/modules/account/permission/permission.types";

const PERMISSIONS: PermissionItem[] = [
  {
    title: "Admin",
    key: "admin_admin",
    list: [
      {
        title: "List",
        key: "admin/admin",
        route: "/admin/admins",
      },
      {
        title: "View",
        key: "admin/admin/view",
        route: "/admin/admins/view/[id]",
      },
      {
        title: "Create",
        key: "admin/admin/create",
        route: "/admin/admins/create",
      },
      {
        title: "Update",
        key: "admin/admin/update",
        route: "/admin/admins/update/[id]",
      },
      {
        title: "Delete",
        key: "admin/admin/delete",
        route: "/admin/admins",
      },
    ],
  },
  {
    title: "User",
    key: "admin_user",
    list: [
      {
        title: "List",
        key: "admin/user",
        route: "/admin/users",
      },
      {
        title: "View",
        key: "admin/user/view",
        route: "/admin/users/view/[id]",
      },
      {
        title: "Create",
        key: "admin/user/create",
        route: "/admin/users/create",
      },
      {
        title: "Update",
        key: "admin/user/update",
        route: "/admin/users/update/[id]",
      },
      {
        title: "Delete",
        key: "admin/user/delete",
        route: "/admin/users",
      },
      {
        title: "Action",
        key: "admin/user/action",
        route: "/admin/users",
      },
      {
        title: "Auto Login",
        key: "admin/user/autologin",
        route: "/admin/users/view/[id]",
      },
      {
        title: "Send Mail",
        key: "admin/user/mail",
        route: "/admin/users/view/[id]",
      },
      {
        title: "Send TFA Mail",
        key: "admin/user/send-tfa-mail",
        route: "/admin/users/view/[id]",
      },
    ],
  },

  {
    title: "Page",
    key: "admin_page",
    list: [
      {
        title: "List",
        key: "admin/page",
        route: "/admin/pages",
      },
      {
        title: "Update",
        key: "admin/page/update",
        route: "/admin/pages/update/[id]",
      },
      {
        title: "View",
        key: "page/",
        route: "/admin/pages/update/[id]",
      },
    ],
  },
  {
    title: "Seo meta",
    key: "admin_seo",
    list: [
      {
        title: "List",
        key: "admin/seo/meta",
        route: "/admin/seos",
      },
      {
        title: "Create",
        key: "admin/seo/create",
        route: "/admin/seos/create",
      },
      {
        title: "Update",
        key: "admin/seo/update",
        route: "/admin/seos/update/[id]",
      },
      {
        title: "Delete",
        key: "admin/seo/delete",
        route: "/admin/seos",
      },
    ],
  },
  {
    title: "Setting",
    key: "admin_setting",
    list: [
      {
        title: "Update",
        key: "admin/setting/update",
        route: "/admin/settings",
      },
    ],
  },
  {
    title: "Sessions",
    key: "admin_session",
    list: [
      {
        title: "Index",
        key: "admin/session",
        route: "/admin/sessions",
      },
      {
        title: "Action",
        key: "admin/session/logout",
        route: "/admin/sessions",
      },
    ],
  },
  {
    title: "Activity",
    key: "admin_activity",
    list: [
      {
        title: "View",
        key: "admin/activity",
        route: "/admin/activities",
      },
    ],
  },
  {
    title: "Email Template",
    key: "admin_email_template",
    list: [
      {
        title: "List",
        key: "admin/email_template",
        route: "/admin/email-templates",
      },
      {
        title: "View",
        key: "admin/email_template/view",
        route: "/admin/email-templates/view/[id]",
      },
      {
        title: "Update",
        key: "admin/email_template/update",
        route: "/admin/email-templates/update/[id]",
      },
    ],
  },
  {
    title: "Blog",
    key: "admin_blog",
    list: [
      {
        title: "List",
        key: "admin/blog",
        route: "/admin/blogs",
      },
      {
        title: "View",
        key: "blog/",
        route: "/admin/blogs/update/[id]",
      },
      {
        title: "Create",
        key: "admin/blog/create",
        route: "/admin/blogs/create",
      },
      {
        title: "Update",
        key: "admin/blog/update",
        route: "/admin/blogs/update/[id]",
      },
      {
        title: "Delete",
        key: "admin/blog/delete",
        route: "/admin/blogs",
      },
    ],
  },
];

export default PERMISSIONS;
export { PERMISSIONS };
