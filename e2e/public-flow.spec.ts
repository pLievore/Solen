import { expect, test } from "@playwright/test";

const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? "https://solen-api.onrender.com";

type Questions = {
  knockout: {
    question: string;
    triggerAnswer: "YES" | "NO";
  }[];
  conditionStates: { label: string }[];
  detailedStates: { question: string }[];
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("vendy_lgpd_accepted", "rejected");
  });
  await page.route(`${API_BASE_URL}/api/**`, async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response });
  });
});

test("home publica catálogo e metadados essenciais", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Vendy/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("link", { name: /iPhones/i })).toBeVisible();

  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute("href", /localhost:3000\/?$/);
});

test("sitemap inclui os conteúdos SEO publicados", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBeTruthy();
  const sitemap = await response.text();

  for (const slug of [
    "quanto-vale-iphone-11-usado",
    "onde-vender-apple-watch-usado",
    "quanto-vale-ps5-usado",
    "o-que-fazer-antes-de-vender-iphone-ipad",
    "como-preparar-apple-watch-para-vender",
  ]) {
    expect(sitemap).toContain(`/blog/${slug}`);
  }
});

test("política informa direitos e permite alterar cookies", async ({ page }) => {
  await page.goto("/privacidade");

  await expect(
    page.getByRole("heading", { level: 1, name: "Política de Privacidade" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "9. Direitos do titular" }),
  ).toBeVisible();
  await expect(page.getByText("66.123.276/0001-75")).toBeVisible();
  const contactSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "1. Controlador e contato" }),
  });
  await expect(contactSection.getByText(/WhatsApp/i)).toBeVisible();

  await page.getByRole("button", { name: "Autorizar analytics" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("vendy_lgpd_accepted")),
    )
    .toBe("accepted");

  await page.getByRole("button", { name: "Recusar analytics" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("vendy_lgpd_accepted")),
    )
    .toBe("rejected");
});

test("avalia aparelho e chega à escolha de entrega sem criar lead", async ({
  page,
  request,
}) => {
  await page.route("https://viacep.com.br/**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        logradouro: "Avenida Paulista",
        bairro: "Bela Vista",
        localidade: "São Paulo",
      }),
    });
  });

  await page.goto("/vender/iphones");
  const modelSection = page.locator("section").filter({
    has: page.getByRole("heading", { level: 2, name: "Modelo" }),
  });
  await modelSection.getByRole("button").first().click();

  const variantSection = page.locator("section").filter({
    has: page.getByRole("heading", { level: 2, name: "Versão" }),
  });
  await variantSection.getByRole("button").first().click();
  await page.getByRole("button", { name: /Avaliar meu aparelho/i }).click();

  await expect(page).toHaveURL(/\/avaliacao\/[^/]+$/);
  const variantId = page.url().split("/").pop();
  expect(variantId).toBeTruthy();

  const questionsResponse = await request.get(
    `${API_BASE_URL}/api/evaluation/variants/${variantId}/questions`,
  );
  expect(questionsResponse.ok()).toBeTruthy();
  const questions = (await questionsResponse.json()) as Questions;

  for (const question of questions.knockout) {
    const safeAnswer = question.triggerAnswer === "YES" ? "Não" : "Sim";
    await page
      .getByRole("button", {
        name: `${question.question}: ${safeAnswer}`,
        exact: true,
      })
      .click();
  }

  await page
    .getByRole("button", {
      name: `Estado do aparelho: ${questions.conditionStates[0].label}`,
      exact: true,
    })
    .click();

  for (const question of questions.detailedStates) {
    await page
      .getByRole("button", {
        name: `${question.question}: Não`,
        exact: true,
      })
      .click();
  }

  await page.getByRole("button", { name: /Ver minha proposta/i }).click();
  await expect(page.getByText("Sua proposta", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: /Continuar para o WhatsApp/i })
    .click();

  await expect(
    page.getByRole("heading", { name: /Seus dados para contato/i }),
  ).toBeVisible();
  await page.getByLabel("Nome completo").fill("Teste Vendy");
  await page.getByLabel("WhatsApp").fill("(11) 99999-9999");
  await page.getByLabel("CEP").fill("01310-100");
  await page.getByLabel("CEP").blur();
  await expect(page.getByLabel("Cidade")).toHaveValue("São Paulo");
  await page.getByLabel("Bairro").fill("Bela Vista");
  await page.getByLabel("Rua").fill("Avenida Paulista");
  await page.getByLabel("Nº").fill("100");
  await page.getByRole("button", { name: /^Continuar\b/ }).click();

  await expect(
    page.getByRole("heading", {
      name: /Onde você quer entregar o aparelho/i,
    }),
  ).toBeVisible();
  const whatsappButton = page.getByRole("button", {
    name: /Ir para o WhatsApp/i,
  });
  await expect(whatsappButton).toBeDisabled();
  await page
    .getByRole("button", { name: /Sem ponto de coleta próximo/i })
    .click();
  await expect(whatsappButton).toBeEnabled();
});
