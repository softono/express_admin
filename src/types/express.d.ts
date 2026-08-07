import type { IUser } from "@/models/user";
import type { IUserSession } from "@/models/user-session";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      session?: IUserSession;
      deviceUid?: string;
    }
  }
}

export {};
