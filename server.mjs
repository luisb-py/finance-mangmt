import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

await loadLocalEnv();

const root = resolve(".");
const port = Number(process.env.PORT || 4174);
const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "POST" && url.pathname === "/api/ai") {
      await handleAi(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/register") {
      await handleRegister(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      await handleLogin(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/update-password") {
      await handleUpdatePassword(request, response);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/profile") {
      await handleGetProfile(request, response);
      return;
    }

    if (request.method === "PATCH" && url.pathname === "/api/profile") {
      await handleUpdateProfile(request, response);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/app-state") {
      await handleGetAppState(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/app-state") {
      await handleSaveAppState(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/stripe/create-checkout-session") {
      await handleCreateStripeCheckoutSession(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/stripe/webhook") {
      await handleStripeWebhook(request, response);
      return;
    }

    if (request.method !== "GET") {
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }

    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = resolve(root, `.${decodeURIComponent(pathname)}`);
    if (!filePath.startsWith(root)) {
      sendJson(response, 403, { error: "Forbidden" });
      return;
    }

    const file = await readFile(filePath);
    response.writeHead(200, { "content-type": mime[extname(filePath)] || "application/octet-stream" });
    response.end(file);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(response, 404, { error: "Not found" });
      return;
    }
    sendJson(response, 500, { error: "Internal server error" });
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`Finanças app rodando na porta ${port}`);
});

async function handleAi(request, response) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(response, 503, { error: "OPENAI_API_KEY não configurada" });
    return;
  }

  const payload = await readJson(request);
  const question = String(payload.question || "").trim();
  const allowedModes = new Set(["finance", "investment", "decision"]);
  const mode = allowedModes.has(payload.mode) ? payload.mode : "finance";
  const previousResponseId = typeof payload.previousResponseId === "string" ? payload.previousResponseId : null;
  if (!question) {
    sendJson(response, 400, { error: "Pergunta vazia" });
    return;
  }

  const requestBody = {
    model,
    instructions: buildInstructions(mode),
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Pergunta atual: ${question}\n\nContexto financeiro atual em JSON:\n${JSON.stringify(payload.context || {}, null, 2)}`,
          },
        ],
      },
    ],
    max_output_tokens: 650,
  };

  if (previousResponseId) {
    requestBody.previous_response_id = previousResponseId;
  }

  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  const data = await aiResponse.json();
  if (!aiResponse.ok) {
    sendJson(response, aiResponse.status, { error: data.error?.message || "Erro ao chamar OpenAI" });
    return;
  }

  sendJson(response, 200, { answer: extractOutputText(data), responseId: data.id });
}

async function handleRegister(request, response) {
  const { supabaseUrl, supabaseAnonKey } = supabaseConfig();
  if (!supabaseUrl || !supabaseAnonKey) {
    sendJson(response, 503, { error: "SUPABASE_URL e SUPABASE_ANON_KEY não configuradas" });
    return;
  }

  const payload = await readJson(request);
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");
  const username = String(payload.username || "").trim();

  if (!username || !email || password.length < 6) {
    sendJson(response, 400, { error: "Informe usuário, email e senha com pelo menos 6 caracteres." });
    return;
  }

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: supabaseHeaders(supabaseAnonKey),
    body: JSON.stringify({
      email,
      password,
      data: { username },
    }),
  });

  const data = await authResponse.json();
  if (!authResponse.ok) {
    sendJson(response, authResponse.status, { error: data.msg || data.error_description || data.error || "Erro ao registrar no Supabase" });
    return;
  }

  await upsertProfile({ id: data.user?.id, email, username });
  const profile = await profileForUser(data.user, { fallbackUsername: username, fallbackEmail: email });
  sendJson(response, 200, { user: data.user, session: data.session, profile, message: data.session ? "Registrado" : "Verifique seu email para confirmar o cadastro." });
}

async function handleLogin(request, response) {
  const { supabaseUrl, supabaseAnonKey } = supabaseConfig();
  if (!supabaseUrl || !supabaseAnonKey) {
    sendJson(response, 503, { error: "SUPABASE_URL e SUPABASE_ANON_KEY não configuradas" });
    return;
  }

  const payload = await readJson(request);
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");

  if (!email || !password) {
    sendJson(response, 400, { error: "Informe email e senha." });
    return;
  }

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: supabaseHeaders(supabaseAnonKey),
    body: JSON.stringify({ email, password }),
  });

  const data = await authResponse.json();
  if (!authResponse.ok) {
    sendJson(response, authResponse.status, { error: data.msg || data.error_description || data.error || "Email ou senha inválidos" });
    return;
  }

  const profile = await profileForUser(data.user);
  sendJson(response, 200, { user: data.user, session: data, profile });
}

async function handleUpdatePassword(request, response) {
  const auth = await authenticatedSupabaseUser(request);
  if (auth.error) {
    sendJson(response, auth.status, { error: auth.error });
    return;
  }

  const { supabaseUrl, supabaseAnonKey } = supabaseConfig();
  const payload = await readJson(request);
  const password = String(payload.password || "");
  if (password.length < 6) {
    sendJson(response, 400, { error: "A senha precisa ter pelo menos 6 caracteres." });
    return;
  }

  const updateResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: {
      ...supabaseHeaders(supabaseAnonKey),
      authorization: request.headers.authorization,
    },
    body: JSON.stringify({ password }),
  });
  const data = await updateResponse.json().catch(() => ({}));
  if (!updateResponse.ok) {
    sendJson(response, updateResponse.status, { error: data.msg || data.error_description || data.error || "Erro ao alterar senha" });
    return;
  }

  sendJson(response, 200, { ok: true });
}

async function handleGetProfile(request, response) {
  const auth = await authenticatedSupabaseUser(request);
  if (auth.error) {
    sendJson(response, auth.status, { error: auth.error });
    return;
  }

  const profile = await profileForUser(auth.user);
  sendJson(response, 200, { profile });
}

async function handleUpdateProfile(request, response) {
  const auth = await authenticatedSupabaseUser(request);
  if (auth.error) {
    sendJson(response, auth.status, { error: auth.error });
    return;
  }

  const payload = await readJson(request);
  const username = String(payload.username || "").trim();
  if (username.length < 2) {
    sendJson(response, 400, { error: "Informe um nome com pelo menos 2 caracteres." });
    return;
  }

  const profile = await upsertProfile({
    id: auth.user.id,
    username,
    email: auth.user.email,
  });
  await updateOwnUserMetadata(request, { username });

  sendJson(response, 200, { profile: profile || profileFallback(auth.user, { fallbackUsername: username }) });
}

async function handleGetAppState(request, response) {
  const auth = await authenticatedSupabaseUser(request);
  if (auth.error) {
    sendJson(response, auth.status, { error: auth.error });
    return;
  }

  const { supabaseUrl, supabaseServiceRoleKey } = supabaseConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    sendJson(response, 503, { error: "SUPABASE_SERVICE_ROLE_KEY não configurada" });
    return;
  }

  const stateResponse = await fetch(
    `${supabaseUrl}/rest/v1/app_states?user_id=eq.${auth.user.id}&select=data,updated_at&limit=1`,
    {
      headers: {
        ...supabaseHeaders(supabaseServiceRoleKey),
        Accept: "application/json",
      },
    }
  );
  const data = await stateResponse.json();
  if (!stateResponse.ok) {
    sendJson(response, stateResponse.status, { error: data.message || data.error || "Erro ao carregar dados" });
    return;
  }

  sendJson(response, 200, { data: data[0]?.data || null, updatedAt: data[0]?.updated_at || null });
}

async function handleSaveAppState(request, response) {
  const auth = await authenticatedSupabaseUser(request);
  if (auth.error) {
    sendJson(response, auth.status, { error: auth.error });
    return;
  }

  const { supabaseUrl, supabaseServiceRoleKey } = supabaseConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    sendJson(response, 503, { error: "SUPABASE_SERVICE_ROLE_KEY não configurada" });
    return;
  }

  const payload = await readJson(request);
  const appData = payload.data && typeof payload.data === "object" ? payload.data : {};
  const stateResponse = await fetch(`${supabaseUrl}/rest/v1/app_states`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(supabaseServiceRoleKey),
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      user_id: auth.user.id,
      data: appData,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!stateResponse.ok) {
    const data = await stateResponse.json();
    sendJson(response, stateResponse.status, { error: data.message || data.error || "Erro ao salvar dados" });
    return;
  }

  sendJson(response, 200, { ok: true });
}

async function handleCreateStripeCheckoutSession(request, response) {
  const auth = await authenticatedSupabaseUser(request);
  if (auth.error) {
    sendJson(response, auth.status, { error: auth.error });
    return;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    sendJson(response, 503, { error: "STRIPE_SECRET_KEY não configurada" });
    return;
  }

  await readJson(request).catch(() => ({}));
  const origin = request.headers.origin || appBaseUrl(request);
  const successUrl = process.env.STRIPE_SUCCESS_URL || `${origin}/?stripe=success`;
  const cancelUrl = process.env.STRIPE_CANCEL_URL || `${origin}/?stripe=cancel`;
  const userId = auth.user.id;
  const params = {
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    customer_email: auth.user.email,
    "metadata[supabase_user_id]": userId,
    "metadata[email]": auth.user.email || "",
    "subscription_data[metadata][supabase_user_id]": userId,
    "subscription_data[metadata][email]": auth.user.email || "",
    "allow_promotion_codes": "true",
    "line_items[0][quantity]": "1",
  };

  if (process.env.STRIPE_PREMIUM_PRICE_ID) {
    params["line_items[0][price]"] = process.env.STRIPE_PREMIUM_PRICE_ID;
  } else {
    params["line_items[0][price_data][currency]"] = process.env.STRIPE_CURRENCY || "brl";
    params["line_items[0][price_data][unit_amount]"] = process.env.STRIPE_PREMIUM_AMOUNT || "2990";
    params["line_items[0][price_data][recurring][interval]"] = "month";
    params["line_items[0][price_data][product_data][name]"] = process.env.STRIPE_PREMIUM_PRODUCT_NAME || "Premium - Minha Gestão Financeira";
  }

  const session = await stripeApiRequest("/v1/checkout/sessions", params);
  if (session.error) {
    sendJson(response, session.status || 502, { error: session.error.message || "Erro ao criar checkout no Stripe" });
    return;
  }

  sendJson(response, 200, { url: session.url, sessionId: session.id });
}

async function handleStripeWebhook(request, response) {
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeWebhookSecret) {
    sendJson(response, 503, { error: "STRIPE_WEBHOOK_SECRET não configurado" });
    return;
  }

  const rawBody = await readRawBody(request);
  const signature = request.headers["stripe-signature"];
  if (!verifyStripeSignature(rawBody, signature, stripeWebhookSecret)) {
    sendJson(response, 400, { error: "Assinatura do Stripe inválida" });
    return;
  }

  let event = null;
  try {
    event = JSON.parse(rawBody);
  } catch {
    sendJson(response, 400, { error: "Payload inválido" });
    return;
  }

  try {
    await applyStripeEvent(event);
    sendJson(response, 200, { received: true });
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "Erro ao processar evento do Stripe" });
  }
}

async function applyStripeEvent(event) {
  const object = event.data?.object || {};
  if (event.type === "checkout.session.completed") {
    const userId = object.client_reference_id || object.metadata?.supabase_user_id;
    if (userId && object.mode === "subscription") {
      await updateUserSubscription(userId, "premium", "active", {
        stripeCustomerId: object.customer,
        stripeSubscriptionId: object.subscription,
      });
    }
    return;
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const userId = object.metadata?.supabase_user_id;
    if (!userId) return;
    const active = ["active", "trialing"].includes(object.status);
    await updateUserSubscription(userId, active ? "premium" : "free", active ? "active" : object.status || "inactive", {
      stripeCustomerId: object.customer,
      stripeSubscriptionId: object.id,
    });
    return;
  }

  if (event.type === "customer.subscription.deleted") {
    const userId = object.metadata?.supabase_user_id;
    if (!userId) return;
    await updateUserSubscription(userId, "free", "inactive", {
      stripeCustomerId: object.customer,
      stripeSubscriptionId: object.id,
    });
  }
}

async function authenticatedSupabaseUser(request) {
  const { supabaseUrl, supabaseAnonKey } = supabaseConfig();
  if (!supabaseUrl || !supabaseAnonKey) {
    return { status: 503, error: "SUPABASE_URL e SUPABASE_ANON_KEY não configuradas" };
  }

  const token = String(request.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return { status: 401, error: "Sessão não encontrada" };
  }

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      ...supabaseHeaders(supabaseAnonKey),
      authorization: `Bearer ${token}`,
    },
  });
  const data = await authResponse.json();
  if (!authResponse.ok) {
    return { status: 401, error: data.msg || data.error_description || data.error || "Sessão inválida" };
  }

  return { user: data };
}

async function stripeApiRequest(pathname, params) {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      body.append(key, String(value));
    }
  });

  const stripeResponse = await fetch(`https://api.stripe.com${pathname}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await stripeResponse.json();
  if (!stripeResponse.ok) {
    return { error: data.error || data, status: stripeResponse.status };
  }
  return data;
}

async function updateUserSubscription(userId, plan, status, stripe = {}) {
  const { supabaseUrl, supabaseServiceRoleKey } = supabaseConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey || !userId) return;

  const headers = supabaseHeaders(supabaseServiceRoleKey);
  const currentResponse = await fetch(`${supabaseUrl}/rest/v1/app_states?user_id=eq.${userId}&select=data&limit=1`, {
    headers: { ...headers, Accept: "application/json" },
  });
  const rows = currentResponse.ok ? await currentResponse.json() : [];
  const data = rows[0]?.data || { version: 1, state: {} };
  data.version ||= 1;
  data.state ||= {};
  data.state.accounts ||= [];
  data.state.cards ||= [];
  data.state.transactions ||= [];
  data.state.recurringTransactions ||= [];
  data.state.subscription = {
    plan,
    status,
    updatedAt: new Date().toISOString(),
    stripeCustomerId: stripe.stripeCustomerId || data.state.subscription?.stripeCustomerId || null,
    stripeSubscriptionId: stripe.stripeSubscriptionId || data.state.subscription?.stripeSubscriptionId || null,
  };
  data.savedAt = new Date().toISOString();

  await fetch(`${supabaseUrl}/rest/v1/app_states`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      user_id: userId,
      data,
      updated_at: new Date().toISOString(),
    }),
  });
}

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!rawBody || !signatureHeader || !secret) return false;
  const parts = Object.fromEntries(
    String(signatureHeader)
      .split(",")
      .map((part) => part.split("="))
      .filter(([key, value]) => key && value)
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}

function appBaseUrl(request) {
  const protocol = request.headers["x-forwarded-proto"] || "https";
  const host = request.headers["x-forwarded-host"] || request.headers.host;
  return `${protocol}://${host}`;
}

function supabaseConfig() {
  return {
    supabaseUrl: process.env.SUPABASE_URL?.replace(/\/$/, ""),
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function supabaseHeaders(key) {
  return {
    "content-type": "application/json",
    apikey: key,
    authorization: `Bearer ${key}`,
  };
}

async function upsertProfile(profile) {
  const { supabaseUrl, supabaseServiceRoleKey } = supabaseConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey || !profile.id) return profileFallback(null, profile);

  const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(supabaseServiceRoleKey),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      id: profile.id,
      username: profile.username,
      email: profile.email,
    }),
  });

  const data = await profileResponse.json().catch(() => []);
  if (!profileResponse.ok) return profileFallback(null, profile);
  return data[0] || profileFallback(null, profile);
}

async function profileForUser(user, fallback = {}) {
  if (!user?.id) return profileFallback(user, fallback);

  const { supabaseUrl, supabaseServiceRoleKey } = supabaseConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey) return profileFallback(user, fallback);

  const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=id,username,email&limit=1`, {
    headers: {
      ...supabaseHeaders(supabaseServiceRoleKey),
      Accept: "application/json",
    },
  });
  const data = await profileResponse.json().catch(() => []);
  if (!profileResponse.ok || !data[0]) return profileFallback(user, fallback);
  return data[0];
}

function profileFallback(user, fallback = {}) {
  const email = fallback.fallbackEmail || fallback.email || user?.email || "";
  const username = fallback.fallbackUsername || fallback.username || user?.user_metadata?.username || email.split("@")[0] || "usuário";
  return {
    id: fallback.id || user?.id || null,
    username,
    email,
  };
}

async function updateOwnUserMetadata(request, metadata) {
  const { supabaseUrl, supabaseAnonKey } = supabaseConfig();
  if (!supabaseUrl || !supabaseAnonKey) return;

  await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: {
      ...supabaseHeaders(supabaseAnonKey),
      authorization: request.headers.authorization,
    },
    body: JSON.stringify({ data: metadata }),
  }).catch(() => null);
}

function buildInstructions(mode) {
  const base =
    "Você é um assistente conversacional de finanças pessoais para um dashboard brasileiro. Responda em português do Brasil, com tom claro, próximo e prático. Converse com a pessoa, reconheça a pergunta específica dela e use o contexto financeiro atual em JSON. Use números explicitamente: valores, percentuais, categorias, faturas, saldo, tendências e alertas quando existirem. Evite respostas genéricas. Não repita sempre a mesma resposta. Se a pessoa fizer uma pergunta de acompanhamento, use a conversa anterior e conecte com a pergunta atual. Estruture respostas curtas assim: diagnóstico direto, dados que sustentam, próximos passos. Quando a pergunta for pessoal e depender de dado ausente, faça no máximo uma pergunta objetiva no fim. Não invente dados.";

  if (mode === "investment") {
    return `${base} Você está na área de investimentos. Atue como apoio educacional e planejamento financeiro, não como consultor financeiro registrado. Não recomende comprar/vender ativos específicos, tickers, fundos ou criptomoedas. Antes de sugerir aumentar risco, verifique reserva de emergência, dívidas/fatura do cartão, horizonte, perfil de risco e capacidade de aporte. Sugira classes ou conceitos em termos gerais, como reserva, renda fixa, diversificação, liquidez e consistência de aportes. Inclua alertas de risco.`;
  }

  if (mode === "decision") {
    return `${base} Você está no planejador de decisão. Ajude a pessoa a decidir se deve comprar, parcelar, viajar, comprar carro ou começar um investimento. Use o fluxo: 1) resposta direta: avançar, ajustar ou adiar; 2) impacto mensal em reais e percentuais quando houver dados; 3) riscos para fatura, reserva e fluxo de caixa; 4) uma alternativa mais segura; 5) próximos passos objetivos. Não incentive endividamento arriscado. Se faltar dado crítico, faça uma pergunta curta no fim.`;
  }

  return `${base} Para finanças pessoais, priorize fluxo de caixa, orçamento, categorias de gasto, fatura do cartão, reserva de emergência e hábitos simples. Não dê recomendação de investimento específica nesta área; encaminhe para a área de investimentos quando a pergunta for sobre investir.`;
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text;
  return (
    data.output
      ?.flatMap((item) => item.content || [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n") || "Não consegui gerar uma resposta agora."
  );
}

function readJson(request) {
  return new Promise((resolveRead, rejectRead) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        rejectRead(new Error("Payload muito grande"));
      }
    });
    request.on("end", () => {
      try {
        resolveRead(JSON.parse(body || "{}"));
      } catch (error) {
        rejectRead(error);
      }
    });
    request.on("error", rejectRead);
  });
}

function readRawBody(request) {
  return new Promise((resolveRead, rejectRead) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        rejectRead(new Error("Payload muito grande"));
      }
    });
    request.on("end", () => resolveRead(body));
    request.on("error", rejectRead);
  });
}

function sendJson(response, status, data) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

async function loadLocalEnv() {
  try {
    const env = await readFile(resolve(".env"), "utf8");
    env.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const separator = trimmed.indexOf("=");
      if (separator === -1) return;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  } catch {
    // Environment variables can still be provided by the shell or host.
  }
}
