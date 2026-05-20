import { createServer } from "node:http";
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

    if (request.method === "GET" && url.pathname === "/api/app-state") {
      await handleGetAppState(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/app-state") {
      await handleSaveAppState(request, response);
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
  const mode = payload.mode === "investment" ? "investment" : "finance";
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
  sendJson(response, 200, { user: data.user, session: data.session, message: data.session ? "Registrado" : "Verifique seu email para confirmar o cadastro." });
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

  sendJson(response, 200, { user: data.user, session: data });
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
  if (!supabaseUrl || !supabaseServiceRoleKey || !profile.id) return;

  await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(supabaseServiceRoleKey),
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id: profile.id,
      username: profile.username,
      email: profile.email,
    }),
  });
}

function buildInstructions(mode) {
  const base =
    "Você é um assistente conversacional de finanças pessoais para um dashboard brasileiro. Responda em português do Brasil, com tom claro, próximo e prático. Converse com a pessoa, reconheça a pergunta específica dela e use o contexto financeiro atual em JSON. Use números explicitamente: valores, percentuais, categorias, faturas, saldo, tendências e alertas quando existirem. Evite respostas genéricas. Não repita sempre a mesma resposta. Se a pessoa fizer uma pergunta de acompanhamento, use a conversa anterior e conecte com a pergunta atual. Estruture respostas curtas assim: diagnóstico direto, dados que sustentam, próximos passos. Quando a pergunta for pessoal e depender de dado ausente, faça no máximo uma pergunta objetiva no fim. Não invente dados.";

  if (mode === "investment") {
    return `${base} Você está na área de investimentos. Atue como apoio educacional e planejamento financeiro, não como consultor financeiro registrado. Não recomende comprar/vender ativos específicos, tickers, fundos ou criptomoedas. Antes de sugerir aumentar risco, verifique reserva de emergência, dívidas/fatura do cartão, horizonte, perfil de risco e capacidade de aporte. Sugira classes ou conceitos em termos gerais, como reserva, renda fixa, diversificação, liquidez e consistência de aportes. Inclua alertas de risco.`;
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
