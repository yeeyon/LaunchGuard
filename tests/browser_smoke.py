from playwright.sync_api import sync_playwright


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.goto("http://127.0.0.1:3000")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="test-results/launchguard-home.png", full_page=True)
    assert page.get_by_role("heading", name="Know whether your repository is ready to launch.").is_visible()
    page.get_by_role("button", name="Run the broken-repo demo").click()
    page.wait_for_url("**/scan/**", timeout=30_000)
    page.wait_for_load_state("networkidle")
    assert page.get_by_text("Production build script is missing").is_visible()
    page.get_by_text("Production build script is missing").click()
    page.wait_for_url("**/finding/**")
    assert page.get_by_text("reviewable patch").is_visible()
    assert not errors, f"browser console errors: {errors}"
    browser.close()
