import { expect, test } from "@playwright/test";

const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? "https://solen-api.onrender.com";

const MOCK_TOKEN = "E2E12345";
const MOCK_WHATSAPP_URL = "https://wa.me/5500000000000?text=e2e";

type Questions = {
  knockout: {
    question: string;
    triggerAnswer: "YES" | "NO";
  }[];
  conditionStates: { label: string }[];
  detailedStates: { question: string }[];
};
type CatalogModel = { id: string };
type CatalogVariant = { id: string };
type ProposalRequest = {
  quote?: {
    conditionStateId?: string | null;
  };
};

function proposalResponse(isScrap: boolean) {
  return {
    token: MOCK_TOKEN,
    value: isScrap ? 5000 : 123400,
    valueFormatted: isScrap ? "R$ 50,00" : "R$ 1.234,00",
    isScrap,
    breakdown: isScrap
      ? [
          {
            type: "scrap",
            label: "Valor para aproveitamento de pecas",
            amount: 5000,
          },
        ]
      : [{ type: "base", label: "Novo/lacrado", amount: 123400 }],
    whatsappUrl: MOCK_WHATSAPP_URL,
  };
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("vendy_lgpd_accepted", "rejected");
  });

  await page.route(`${API_BASE_URL}/api/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (request.method() === "POST" && path === "/api/proposals") {
      const body = request.postDataJSON() as ProposalRequest;
      const isScrap = !body.quote?.conditionStateId;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(proposalResponse(isScrap)),
      });
      return;
    }

    if (
      request.method() === "PATCH" &&
      /^\/api\/proposals\/[^/]+\/pickup$/.test(path)
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ whatsappUrl: MOCK_WHATSAPP_URL }),
      });
      return;
    }

    const response = await route.fetch();
    await route.fulfill({ response });
  });
});

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "ignoreErrors" });
});

test("home publica catalogo e metadados essenciais", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Vendy/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("link", { name: /iPhones/i })).toBeVisible();

  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute("href", /localhost:\d+\/?$/);
});

test("busca modelo na home e abre a selecao ja no passo de versoes", async ({
  page,
  request,
}) => {
  const modelsResponse = await request.get(
    `${API_BASE_URL}/api/catalog/categories/iphones/models`,
  );
  const models = (await modelsResponse.json()) as { id: string; name: string }[];
  const model = models[0];

  await page.goto("/");
  const searchBox = page.getByLabel("Buscar aparelho");
  test.skip(
    (await searchBox.count()) === 0,
    "Busca da home ainda não publicada neste ambiente",
  );
  await searchBox.fill(model.name);
  await page.getByRole("button", { name: "Buscar", exact: true }).click();

  await expect(page).toHaveURL(new RegExp(`/vender/iphones\\?modelo=${model.id}`));
  await expect(
    page.getByRole("heading", { level: 2, name: /Vers/ }),
  ).toBeVisible();
});

test("sitemap inclui os conteudos SEO publicados", async ({ request }) => {
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

test("politica informa direitos e permite alterar cookies", async ({ page }) => {
  await page.goto("/privacidade");

  await expect(
    page.getByRole("heading", { level: 1, name: /Politica|Política/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /9\. Direitos do titular/ }),
  ).toBeVisible();
  await expect(page.getByText("66.123.276/0001-75")).toBeVisible();
  const contactSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: /1\. Controlador e contato/ }),
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

test("explica quando o aparelho vai para pecas", async ({
  page,
  request,
}) => {
  const modelsResponse = await request.get(
    `${API_BASE_URL}/api/catalog/categories/iphones/models`,
  );
  const models = (await modelsResponse.json()) as CatalogModel[];
  const variantsResponse = await request.get(
    `${API_BASE_URL}/api/catalog/models/${models[0].id}/variants`,
  );
  const variants = (await variantsResponse.json()) as CatalogVariant[];
  const variantId = variants[0].id;

  const questionsResponse = await request.get(
    `${API_BASE_URL}/api/evaluation/variants/${variantId}/questions`,
  );
  const questions = (await questionsResponse.json()) as Questions;

  await page.goto(`/avaliacao/${variantId}`);
  for (const [index, question] of questions.knockout.entries()) {
    const answer =
      index === 0
        ? question.triggerAnswer === "YES"
          ? "Sim"
          : "Não"
        : question.triggerAnswer === "YES"
          ? "Não"
          : "Sim";
    await page
      .getByRole("button", {
        name: `${question.question}: ${answer}`,
        exact: true,
      })
      .click();
  }

  await expect(
    page.getByText("Seu aparelho ainda pode ser vendido"),
  ).toBeVisible();
  await expect(
    page.getByText(/retirada e reaproveitamento de pe/i),
  ).toBeVisible();

  await page.getByRole("button", { name: /Ver minha avalia/i }).click();
  await expect(page.getByRole("heading", { name: /Sua avalia/i })).toBeVisible();
  await page.getByPlaceholder("Seu nome").fill("Teste Vendy");
  await page.getByPlaceholder("(11) 99999-9999").fill("(11) 99999-9999");
  await page.getByRole("button", { name: /Ver minha avalia/i }).click();

  await expect(
    page.getByText(/Valor para aproveitamento de pe/i).first(),
  ).toBeVisible();
  await expect(
    page.getByText(/a proposta tem valor reduzido/i),
  ).toBeVisible();
});

test("avalia aparelho e chega a escolha de entrega sem lead real", async ({
  page,
  request,
}) => {
  await page.goto("/vender/iphones");
  const modelSection = page.locator("section").filter({
    has: page.getByRole("heading", { level: 2, name: "Modelo" }),
  });
  await modelSection.getByRole("button").first().click();

  const variantSection = page.locator("section").filter({
    has: page.getByRole("heading", { level: 2, name: /Vers/ }),
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

  await page.getByRole("button", { name: /Ver minha avalia/i }).click();
  await expect(page.getByRole("heading", { name: /Sua avalia/i })).toBeVisible();
  await page.getByPlaceholder("Seu nome").fill("Teste Vendy");
  await page.getByPlaceholder("(11) 99999-9999").fill("(11) 99999-9999");
  await page.getByRole("button", { name: /Ver minha avalia/i }).click();

  await expect(page.getByText("Sua proposta", { exact: true })).toBeVisible();
  await expect(page.getByText("R$ 1.234,00")).toBeVisible();
  await expect(
    page.getByText(/Onde voc.*quer entregar/i),
  ).toBeVisible();

  const whatsappButton = page.getByRole("button", {
    name: /Enviar no WhatsApp/i,
  });
  await expect(whatsappButton).toBeDisabled();
  await page
    .getByRole("button", { name: /Sem ponto de coleta pr/i })
    .click();
  await expect(whatsappButton).toBeEnabled();
});
