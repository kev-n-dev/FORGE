import { test, expect } from "@playwright/test";

/**
 * Smoke tests — verify the most critical user flows work end-to-end.
 */

test.describe("Home page", () => {
  test("loads and shows FORGE branding", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/FORGE/);
    await expect(page.getByRole("heading", { name: /build your reputation/i })).toBeVisible();
  });

  test("navigation links are accessible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /discover/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /join forge/i })).toBeVisible();
  });
});

test.describe("Search page", () => {
  test("shows search form", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: /find professionals/i })).toBeVisible();
    await expect(page.getByRole("searchbox")).toBeVisible();
  });

  test("search form is keyboard accessible", async ({ page }) => {
    await page.goto("/discover");
    await page.keyboard.press("Tab");
    // Focus should reach the search input
    const searchInput = page.getByRole("textbox", { name: /search professionals/i });
    await searchInput.focus();
    await searchInput.fill("Carpenter");
    await page.keyboard.press("Enter");
    // Should show results or empty state without error
    await expect(page.locator("body")).not.toContainText("unexpected error");
  });
});

test.describe("Auth flows", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
  });

  test("shows validation errors on empty login submit", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Should show validation feedback
    await expect(page.locator("[role='alert']").first()).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("home page has no obvious accessibility issues", async ({ page }) => {
    await page.goto("/");
    // Check for skip link
    const skipLink = page.getByRole("link", { name: /skip to content/i });
    await expect(skipLink).toBeAttached();
  });

  test("main content landmark exists", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main")).toBeVisible();
  });
});

test.describe("Mobile navigation", () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 Pro

  test("mobile menu toggle works", async ({ page }) => {
    await page.goto("/");
    const menuButton = page.getByRole("button", { name: /open menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.getByRole("button", { name: /close menu/i })).toBeVisible();
    // Nav links should be visible
    await expect(page.getByRole("link", { name: /discover/i }).last()).toBeVisible();
  });
});
