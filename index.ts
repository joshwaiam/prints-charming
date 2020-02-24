/* eslint-disable @typescript-eslint/no-use-before-define */
import * as dotenv from "dotenv";
import * as puppeteer from "puppeteer";
import logger from "./logger";
const axios = require("axios").default;

dotenv.config({ path: __dirname + "/.env" });

const url = process.env.PRINTER_URL;
const interval = parseInt(process.env.CHECK_INTERVAL, 10) * 1000;
const teamsUrl = process.env.TEAMS_URL;

let previousMessage = "";

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
    message = "Prints Charming is error free!";
  } else {
    message = "Prints Charming has the following errors:\n";
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

  /** Post to Teams */
  await axios.post(teamsUrl, { text: message });
};

/** Start the timer */
setInterval(checkPrinterErrors, interval);
