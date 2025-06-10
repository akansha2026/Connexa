export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}



// Extend Express Request interface to include 'user'
declare global {
    namespace Express {
        interface Request {
            user?: {
                email: string;
                id: string;
            };
        }
    }
}