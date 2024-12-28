export class AuthService {
  public static isAuth(authorizationHeader: string, token: string): boolean {
    const b64auth = authorizationHeader.split(" ")[1] || "";
    const [login, password] = Buffer.from(b64auth, "base64").toString().split(":");
    if (login === token || password === token) return true;
    return false;
  }
}
