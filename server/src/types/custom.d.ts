// Ignore type errors for these modules
declare module "nodemailer";
declare module "bcrypt";
declare module "jsonwebtoken" {
    export type JwtPayload = { [key: string]: any };
    export function sign(
        payload: string | object | Buffer,
        secretOrPrivateKey: string,
        options?: any
    ): string;
    export function verify(
        token: string,
        secretOrPublicKey: string,
        options?: any
    ): any;
    export function decode(token: string, options?: any): any;
}
declare module "cors";
declare module "ejs";