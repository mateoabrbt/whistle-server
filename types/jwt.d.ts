declare interface JwtPayload {
  sub: string;
  role: string;
  email: string;
  username: string;
  [key: string]: any;
}
