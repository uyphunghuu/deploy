import { expect, test } from "@playwright/test";

test("register email flow reaches plan builder", async ({ page }) => {
  await page.goto("/register/email");
  await page.getByLabel("Email").fill("demo@slabai.app");
  await page.getByRole("button", { name: /gửi mã đăng ký/i }).click();
  await page.getByLabel("Chữ số 1").fill("1");
  await page.getByLabel("Chữ số 2").fill("2");
  await page.getByLabel("Chữ số 3").fill("3");
  await page.getByLabel("Chữ số 4").fill("4");
  await page.getByLabel("Chữ số 5").fill("5");
  await page.getByLabel("Chữ số 6").fill("6");
  await page.getByRole("button", { name: /xác thực/i }).click();
  await expect(page.getByRole("heading", { name: "Training Preferences" })).toBeVisible();
});
