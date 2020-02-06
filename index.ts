/* eslint-disable @typescript-eslint/no-use-before-define */
import * as SlackBot from "slackbots";
import * as dotenv from "dotenv";
import * as puppeteer from "puppeteer";
import logger from "./logger";

dotenv.config({ path: __dirname + "/.env" });

const token = process.env.SLACK_TOKEN;
const name = process.env.SLACK_BOT_NAME;
const url = process.env.PRINTER_URL;
const channel = process.env.SLACK_CHANNEL;
const interval = parseInt(process.env.CHECK_INTERVAL, 10) * 1000;
// eslint-disable-next-line @typescript-eslint/camelcase
const messageParams = { link_names: true };

let previousMessage = "";

const bot = new SlackBot({
  token,
  name
});

bot.on("start", async () => {
  setInterval(checkPrinterErrors, interval);
});

const checkPrinterErrors = async (): Promise<void> => {
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;
  let errorsToReport: string[] = [];

  function exitWithError(e: string): void {
    logger.error(e);
    browser.close();
  }

  logger.info("Checking for errors.");

  /** Initialize the browser */
  try {
    browser = await puppeteer.launch({ args: ["--disable-gpu"] });
  } catch (e) {
    exitWithError(e.message);
    return;
  }

  /** Fetch the dashboard HTML */
  try {
    page = await browser.newPage();
    await page.goto(url);
  } catch (e) {
    exitWithError(e.message);
    return;
  }

  /** Parse the error DOM nodes */
  try {
    errorsToReport = await page.evaluate(() => {
      const errorNodes = document.getElementsByClassName("ErrorInfoMessage");
      const parsedErrors: string[] = [];

      const errorsToIgnore = [
        "The cyan toner is low.",
        "The magenta toner is low.",
        "The yellow toner is low.",
        "The black toner is low.",
        "The waste toner container is almost full."
      ];

      for (const node of errorNodes) {
        const errorText = node.textContent.trim();
        if (!errorsToIgnore.includes(errorText)) {
          parsedErrors.push(errorText);
        }
      }

      return parsedErrors;
    });
  } catch (e) {
    exitWithError(e.message);
    return;
  }

  /** Format the message to send back */
  let message: string;
  if (errorsToReport.length === 0) {
    message = ":success: Prints Charming is error free!";
  } else {
    message = ":warning: @channel\nPrints Charming has the following errors:\n";
    errorsToReport.map(e => {
      message += `*${e}*\n`;
    });
  }

  /** Close the browser */
  await browser.close();

  logger.info("Error check complete.");

  /** Exit if the error message is the same as the last check */
  if (message === previousMessage) {
    return;
  }

  previousMessage = message;
  bot.postMessageToChannel(channel, message, messageParams);
};
