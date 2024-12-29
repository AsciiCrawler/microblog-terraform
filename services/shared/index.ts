import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { APIGatewayProxyEventV2, Handler } from 'aws-lambda';
import { sign, verify } from 'jsonwebtoken';
import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(5).regex(/^[a-zA-Z0-9_-]{5,}$/),
  password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#^-_])[A-Za-z\d@$!%*?&#^-_]{8,}$/)
});

export type ProxyHandler = Handler<APIGatewayProxyEventV2, any>;
export const generateResponse = (statusCode: number, body: any, jwt: string | null = null) => {
  let response: any = {
    statusCode: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    },
    body: JSON.stringify(body)
  }

  if (jwt != null) {
    const cookieValue: string = jwt;
    const cookieOptions: string[] = [
      `Path=/`,                  // Make the cookie available globally
      // `HttpOnly`,                // Prevent JavaScript access
      // `Secure=false`,                  // Use HTTPS
      `SameSite=Lax`,         // Prevent cross-site usage
      `Max-Age=86400`            // 1 day in seconds
    ];
    response.cookies = [`jwt=${cookieValue}; Path=/; Max-Age=86400`];
  }
  return response;
}

export const safeJsonParse = (json: string): any | null => {
  let parsed: any | null = null;
  try {
    parsed = JSON.parse(json)
  } catch (e) {
    return null;
  }

  return parsed;
}

type getUserDataFromCookieResponse = {
  username: string
};
export class AsciiCrawlerUtility {
  //////////////////
  /* PRIVATE APIS */
  private secretManagerClient = new SecretsManagerClient({ region: process.env.SECRET_MANAGER_REGION });

  private __secret: string | null = null;
  private getSecret = async () => {
    if (this.__secret == null)
      this.__secret = (await this.secretManagerClient.send(new GetSecretValueCommand({ SecretId: process.env.JWT_KEY }))).SecretString || null;
    return this.__secret;
  }

  private getUserData = async (token: string) => {
    const secret = await this.getSecret();
    if (secret == null)
      return null;

    return verify(token, secret) as { username: string; iat: number };
  }
  /* PRIVATE APIS */
  //////////////////

  /////////////////
  /* PUBLIC APIS */
  signJWT = async (username: string): Promise<string | null> => {
    const secret = await this.getSecret();
    if (secret == null)
      return null;

    return sign({
      username: username
    }, secret);
  }

  getUserDataFromCookie = async (headers: string[] | undefined): Promise<getUserDataFromCookieResponse | null> => {
    if (headers == null)
      return null;

    let token: string | null = null;
    for (let i = 0; i < headers.length; i++) {
      const cookie = headers[i];
      const parts = cookie.split('=');
      const key = (parts.shift() || "").trim()
      const value = decodeURI(parts.join('='));
      if (key == "jwt") {
        token = value;
        break;
      }
    }

    if (token == null)
      return null;

    return await this.getUserData(token);
  };
  /* PUBLIC APIS */
  /////////////////
}