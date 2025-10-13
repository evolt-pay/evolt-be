import { chromium } from "playwright";

class AutomationService {
    static async acceptTermsOnPage(url: string): Promise<string | null> {
        console.log("🤖 Starting Playwright automation...");

        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        try {
            console.log("🌍 Navigating to the generated link...");
            await page.goto(url);

            console.log('🎯 Locating the "Accept" button...');
            const acceptButton = page.getByRole("button", { name: "Accept" });

            const [response] = await Promise.all([
                page.waitForNavigation({ waitUntil: "load" }),
                acceptButton.click(),
            ]);

            const finalUrl = page.url();
            console.log("➡️ Final redirect URL:", finalUrl);

            return finalUrl;
        } catch (error: any) {
            console.error("❌ Playwright automation failed:", error);
            throw new Error("Playwright automation failed");
        } finally {
            await browser.close();
            console.log("🤖 Browser closed.");
        }
    }
}

export default AutomationService;