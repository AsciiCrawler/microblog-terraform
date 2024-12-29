import { AsciiCrawlerUtility, ProxyHandler, generateResponse } from './shared';

const asciiCrawlerUtility = new AsciiCrawlerUtility();
export const handler: ProxyHandler = async (event) => {
  const userData = await asciiCrawlerUtility.getUserDataFromCookie(event.cookies);
  if (!userData)
    return generateResponse(401, { message: "Unauthorized" });

  return generateResponse(200, userData);
}