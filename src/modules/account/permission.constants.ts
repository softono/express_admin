import type { PermissionItem } from "@/modules/account/permission/permission.types";

export interface ServerPermissionChild extends PermissionItem {
  apis: string[];
}

export interface ServerPermissionGroup extends PermissionItem {
  list?: ServerPermissionChild[];
}

const PERMISSIONS: ServerPermissionGroup[] = [
  {
    title: "Admin",
    key: "admin_admin",
    list: [
      {
        title: "List",
        key: "admin/admin",
        route: "/admin/admins",
        apis: ["GET /admins"],
      },
      {
        title: "View",
        key: "admin/admin/view",
        route: "/admin/admins/view/[id]",
        apis: [
          "GET /admins/[id]",
          "GET /admins/[id]/activity",
          "GET /admins/[id]/session",
        ],
      },
      {
        title: "Create",
        key: "admin/admin/create",
        route: "/admin/admins/create",
        apis: ["POST /admins"],
      },
      {
        title: "Update",
        key: "admin/admin/update",
        route: "/admin/admins/update/[id]",
        apis: ["PATCH /admins/[id]"],
      },
      {
        title: "Delete",
        key: "admin/admin/delete",
        route: "/admin/admins",
        apis: ["DELETE /admins/[id]"],
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
        apis: ["GET /users"],
      },
      {
        title: "View",
        key: "admin/user/view",
        route: "/admin/users/view/[id]",
        apis: [
          "GET /users/[id]",
          "GET /users/[id]/activity",
          "GET /users/[id]/devices",
          "GET /users/[id]/mails",
        ],
      },
      {
        title: "Create",
        key: "admin/user/create",
        route: "/admin/users/create",
        apis: ["POST /users"],
      },
      {
        title: "Update",
        key: "admin/user/update",
        route: "/admin/users/update/[id]",
        apis: ["PATCH /users/[id]"],
      },
      {
        title: "Delete",
        key: "admin/user/delete",
        route: "/admin/users",
        apis: ["DELETE /users/[id]"],
      },
      {
        // Status toggle shares PATCH /users/[id] with Update;
        // the endpoint is enforced under the Update permission.
        title: "Action",
        key: "admin/user/action",
        route: "/admin/users",
        apis: [],
      },
      {
        // No autologin endpoint currently implemented.
        title: "Auto Login",
        key: "admin/user/autologin",
        route: "/admin/users/view/[id]",
        apis: [],
      },
      {
        title: "Send Mail",
        key: "admin/user/mail",
        route: "/admin/users/view/[id]",
        apis: ["POST /users/mail"],
      },
      {
        // No dedicated send-tfa-mail endpoint currently implemented.
        title: "Send TFA Mail",
        key: "admin/user/send-tfa-mail",
        route: "/admin/users/view/[id]",
        apis: [],
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
        apis: ["GET /page"],
      },
      {
        title: "Update",
        key: "admin/page/update",
        route: "/admin/pages/update/[id]",
        apis: ["GET /page/[id]", "PATCH /page/[id]"],
      },
      {
        title: "View",
        key: "page/",
        route: "/admin/pages/update/[id]",
        apis: [],
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
        apis: ["GET /seos"],
      },
      {
        title: "Create",
        key: "admin/seo/create",
        route: "/admin/seos/create",
        apis: ["POST /seos"],
      },
      {
        title: "Update",
        key: "admin/seo/update",
        route: "/admin/seos/update/[id]",
        apis: ["GET /seos/[id]", "PATCH /seos/[id]"],
      },
      {
        title: "Delete",
        key: "admin/seo/delete",
        route: "/admin/seos",
        apis: ["DELETE /seos/[id]"],
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
        apis: [
          "GET /setting/update",
          "POST /setting/save",
          "POST /setting/save-captcha",
          "POST /setting/save-content",
          "POST /setting/save-email",
          "POST /setting/save-logo",
          "POST /setting/save-social",
          "GET /setting/cache-clear",
          "POST /setting/mail-process",
          "GET /setting/public",
        ],
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
        apis: ["GET /sessions"],
      },
      {
        title: "Action",
        key: "admin/session/logout",
        route: "/admin/sessions",
        apis: ["POST /sessions/logout"],
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
        apis: ["GET /user-activities"],
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
        apis: ["GET /email-template"],
      },
      {
        title: "View",
        key: "admin/email_template/view",
        route: "/admin/email-templates/view/[id]",
        apis: ["GET /email-template/[id]"],
      },
      {
        title: "Update",
        key: "admin/email_template/update",
        route: "/admin/email-templates/update/[id]",
        apis: [
          "PATCH /email-template/[id]",
          "POST /email-template/[id]/save-file",
        ],
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
        apis: ["GET /blogs"],
      },
      {
        title: "View",
        key: "blog/",
        route: "/admin/blogs/update/[id]",
        apis: [],
      },
      {
        title: "Create",
        key: "admin/blog/create",
        route: "/admin/blogs/create",
        apis: ["POST /blogs"],
      },
      {
        title: "Update",
        key: "admin/blog/update",
        route: "/admin/blogs/update/[id]",
        apis: ["GET /blogs/[id]", "PATCH /blogs/[id]"],
      },
      {
        title: "Delete",
        key: "admin/blog/delete",
        route: "/admin/blogs",
        apis: ["DELETE /blogs/[id]"],
      },
    ],
  },
];

export default PERMISSIONS;
export { PERMISSIONS };
