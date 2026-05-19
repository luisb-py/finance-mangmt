const STORAGE_KEY = "personalFinanceApp.v1";

const initialState = {
  accounts: [],
  cards: [],
  transactions: [],
};

let state = loadState();
let importPreview = [];
let aiPreviousResponseId = null;
let investmentPreviousResponseId = null;
let authMode = "login";
let editingCardId = null;
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const icons = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  transactions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 7h14l-4-4"/><path d="M17 17H3l4 4"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><path d="M16 13h.01"/></svg>',
  sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16v4H4v-4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m20 6-11 11-5-5"/></svg>',
  brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5 3 3 0 0 0 2 5v1a3 3 0 0 0 5 2"/><path d="M15 3a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5 3 3 0 0 1-2 5v1a3 3 0 0 1-5 2"/><path d="M9 8h1"/><path d="M14 8h1"/><path d="M9 14h6"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.9 15.1A8.5 8.5 0 0 1 8.9 3.1 9 9 0 1 0 20.9 15.1Z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>',
  arrowDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
  bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 10 9-6 9 6"/><path d="M5 10v9"/><path d="M19 10v9"/><path d="M3 19h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h3"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  calculator: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
  trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
  empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 3v6h-6"/><path d="M21 9 13.5 16.5 9.5 12.5 3 19"/></svg>',
};

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  hydrateIcons();
  bindLogin();
  bindTabs();
  bindForms();
  bindAiChat();
  bindCalculator();
  initScrollAnimations();
  syncLoginState();
  setDefaultDate();
  render();
  updateCalculatorVisibility(document.querySelector(".nav-tab.active")?.dataset.tab || "dashboard");
  window.addEventListener("resize", debounce(scheduleDashboardRender, 120));
});

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(initialState);
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((node) => {
    node.innerHTML = icons[node.dataset.icon] || "";
  });
}

function bindTabs() {
  document.querySelectorAll(".nav-tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach((tab) => tab.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(button.dataset.tab).classList.add("active");
      updateCalculatorVisibility(button.dataset.tab);
      if (button.dataset.tab === "dashboard") {
        scheduleDashboardRender();
      }
    });
  });
}

function bindForms() {
  document.getElementById("accountForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.accounts.push({
      id: makeId(),
      name: getValue("accountName"),
      initialBalance: Number(getValue("accountBalance")),
    });
    event.target.reset();
    persistAndRender();
  });

  document.getElementById("cardForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = {
      name: getValue("cardName"),
      limit: Number(getValue("cardLimit")),
      closeDay: Number(getValue("cardCloseDay")),
    };
    if (editingCardId) {
      state.cards = state.cards.map((card) => (card.id === editingCardId ? { ...card, ...payload } : card));
    } else {
      state.cards.push({ id: makeId(), ...payload });
    }
    event.target.reset();
    document.getElementById("cardCloseDay").value = 10;
    resetCardForm();
    persistAndRender();
  });
  document.getElementById("cancelCardEdit").addEventListener("click", resetCardForm);

  document.getElementById("transactionForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const [sourceType, sourceId] = getValue("transactionSource").split(":");
    const type = getValue("transactionType");
    const amount = Number(getValue("transactionAmount"));
    const installments = sourceType === "card" && type === "expense" ? getInstallmentCount() : 1;
    state.transactions.push(...buildTransactionEntries({ sourceType, sourceId, type, amount, installments }));
    event.target.reset();
    setDefaultDate();
    document.getElementById("transactionInstallments").value = 1;
    updateInstallmentControls();
    persistAndRender();
  });

  document.getElementById("transactionSearch").addEventListener("input", renderTransactions);
  document.getElementById("monthFilter").addEventListener("change", renderDashboard);
  document.getElementById("transactionSource").addEventListener("change", updateInstallmentControls);
  document.getElementById("transactionType").addEventListener("change", updateInstallmentControls);
  document.getElementById("transactionAmount").addEventListener("input", updateInstallmentControls);
  document.getElementById("transactionInstallments").addEventListener("input", updateInstallmentControls);
  document.getElementById("dashboardCardFilter").addEventListener("change", renderDashboard);

  document.getElementById("seedDemo").addEventListener("click", () => {
    state = demoState();
    persistAndRender();
  });

  document.getElementById("clearData").addEventListener("click", () => {
    if (confirm("Deseja apagar todos os dados cadastrados?")) {
      state = structuredClone(initialState);
      persistAndRender();
    }
  });

  document.getElementById("logoutButton").addEventListener("click", () => {
    localStorage.removeItem("personalFinanceApp.session");
    syncLoginState();
  });

  document.getElementById("invoiceFile").addEventListener("change", handleInvoiceFiles);
  document.getElementById("parseInvoiceText").addEventListener("click", () => {
    const rows = parseInvoiceText(getValue("invoicePaste"));
    setImportPreview(rows, "texto colado");
  });
  document.getElementById("clearImportPreview").addEventListener("click", () => {
    importPreview = [];
    document.getElementById("invoicePaste").value = "";
    setImportStatus("Aguardando arquivo ou texto da fatura.");
    renderImportPreview();
  });
  document.getElementById("importSelectedRows").addEventListener("click", importSelectedPreviewRows);
  document.getElementById("saveInvestmentProfile").addEventListener("click", saveInvestmentProfile);
  document.getElementById("generateInvestmentPlan").addEventListener("click", generateInvestmentPlan);
  document.getElementById("askInvestmentAi").addEventListener("click", askInvestmentQuestion);
}

function bindCalculator() {
  const widget = document.getElementById("calculatorWidget");
  const panel = document.getElementById("calculatorPanel");
  document.getElementById("toggleCalculator").addEventListener("click", () => {
    widget.classList.toggle("open");
    panel.setAttribute("aria-hidden", widget.classList.contains("open") ? "false" : "true");
    updateCalculatorResult();
  });
  document.getElementById("closeCalculator").addEventListener("click", () => {
    widget.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  });
  document.getElementById("calculatorInstallmentValue").addEventListener("input", updateCalculatorResult);
  document.getElementById("calculatorInstallmentCount").addEventListener("input", updateCalculatorResult);
  document.getElementById("useCalculatorTotal").addEventListener("click", () => {
    const total = calculatorTotalValue();
    document.getElementById("transactionAmount").value = total ? total.toFixed(2) : "";
    document.getElementById("transactionInstallments").value = Math.max(1, Number(getValue("calculatorInstallmentCount") || 1));
    updateInstallmentControls();
  });
}

function initTheme() {
  const storedTheme = localStorage.getItem("personalFinanceApp.theme");
  setTheme(storedTheme || "dark");
  document.getElementById("themeToggle").addEventListener("click", () => {
    setTheme(document.body.dataset.theme === "light" ? "dark" : "light");
    scheduleDashboardRender();
  });
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem("personalFinanceApp.theme", theme);
  const icon = document.querySelector("#themeToggle [data-icon]");
  if (icon) {
    icon.dataset.icon = theme === "light" ? "sun" : "moon";
    hydrateIcons(document.getElementById("themeToggle"));
  }
}

function bindLogin() {
  document.getElementById("showLogin").addEventListener("click", () => setAuthMode("login"));
  document.getElementById("showRegister").addEventListener("click", () => setAuthMode("register"));

  document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitAuthForm();
  });
}

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  document.getElementById("showLogin").classList.toggle("active", !isRegister);
  document.getElementById("showRegister").classList.toggle("active", isRegister);
  document.querySelectorAll(".register-only").forEach((item) => item.classList.toggle("hidden", !isRegister));
  document.getElementById("authTitle").textContent = isRegister ? "Crie sua conta" : "Entre no seu painel";
  document.getElementById("authSubmitText").textContent = isRegister ? "Registrar" : "Entrar";
  document.getElementById("loginPassword").autocomplete = isRegister ? "new-password" : "current-password";
  document.getElementById("authStatus").textContent = isRegister
    ? "Informe usuário, email e senha para registrar no Supabase."
    : "Use seu cadastro do Supabase para acessar o painel.";
}

async function submitAuthForm() {
  const status = document.getElementById("authStatus");
  const endpoint = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
  const payload = {
    email: getValue("loginEmail"),
    password: getValue("loginPassword"),
    username: getValue("registerUsername"),
  };

  if (authMode === "register" && !payload.username) {
    status.textContent = "Informe um usuário para registrar.";
    return;
  }

  status.textContent = authMode === "register" ? "Registrando..." : "Entrando...";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await readJsonResponse(response);
    if (!response.ok) throw new Error(data.error || "Falha na autenticação");

    localStorage.setItem(
      "personalFinanceApp.session",
      JSON.stringify({
        name: data.user?.user_metadata?.username || data.user?.email || payload.username,
        email: data.user?.email || payload.email,
        accessToken: data.session?.access_token || null,
        refreshToken: data.session?.refresh_token || null,
        signedAt: new Date().toISOString(),
      })
    );
    status.textContent = "Acesso confirmado.";
    syncLoginState();
  } catch (error) {
    status.textContent = error.message || "Não foi possível autenticar.";
  }
}

function bindAiChat() {
  const widget = document.getElementById("aiWidget");
  const panel = document.getElementById("aiPanel");
  const toggle = document.getElementById("toggleAiChat");
  const close = document.getElementById("closeAiChat");
  const form = document.getElementById("aiChatForm");
  const question = document.getElementById("aiQuestion");

  toggle.addEventListener("click", () => {
    const isOpen = widget.classList.toggle("open");
    panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
    if (isOpen) question.focus();
  });

  close.addEventListener("click", () => {
    widget.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && widget.classList.contains("open")) {
      widget.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      toggle.focus();
    }
  });

  document.querySelectorAll("[data-ai-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      question.value = button.dataset.aiPrompt;
      form.requestSubmit();
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const prompt = question.value.trim();
    if (!prompt) return;

    question.value = "";
    addAiMessage(prompt, "user");
    const loading = addAiMessage("Analisando seus dados...", "assistant loading");

    try {
      const answer = await askRealAi(prompt);
      loading.textContent = answer;
      loading.classList.remove("loading");
      setAiStatus("Resposta gerada pelo modelo conectado ao servidor local.");
    } catch (error) {
      loading.textContent = localAiFallback(prompt);
      loading.classList.remove("loading");
      setAiStatus("Servidor de IA indisponível. Mostrei uma análise local temporária.");
    }
  });
}

function addAiMessage(text, type) {
  const messages = document.getElementById("aiMessages");
  const message = document.createElement("div");
  message.className = `ai-message ${type}`;
  message.textContent = text;
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
  return message;
}

async function askRealAi(question, mode = "finance") {
  const previousResponseId = mode === "investment" ? investmentPreviousResponseId : aiPreviousResponseId;
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      mode,
      previousResponseId,
      context: buildAiContext(),
    }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = await readJsonResponse(response);
  if (mode === "investment") {
    investmentPreviousResponseId = data.responseId || investmentPreviousResponseId;
  } else {
    aiPreviousResponseId = data.responseId || aiPreviousResponseId;
  }
  return data.answer || "Não consegui gerar uma resposta agora.";
}

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {
      error: response.status === 404
        ? "Servidor local sem as rotas de API. Reinicie usando server.mjs."
        : text || "Resposta inválida do servidor.",
    };
  }
}

function buildAiContext() {
  const stats = financialStats();
  const transactions = state.transactions.slice().sort((a, b) => b.date.localeCompare(a.date));
  return {
    stats,
    investmentProfile: getInvestmentProfile(),
    diagnostics: buildFinancialDiagnostics(stats),
    categoryBreakdown: categoryBreakdown(),
    monthlyTrend: monthlyTrend(),
    accounts: calculateAccounts().map((account) => ({
      name: account.name,
      balance: account.balance,
    })),
    cards: calculateCards().map((card) => ({
      name: card.name,
      limit: card.limit,
      used: card.used,
      available: card.available,
      closeDay: card.closeDay,
    })),
    recentTransactions: transactions
      .slice(0, 30)
      .map((transaction) => ({
        date: transaction.date,
        description: transaction.description,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        source: sourceName(transaction),
      })),
  };
}

function buildFinancialDiagnostics(stats) {
  const totalAccountBalance = calculateAccounts().reduce((total, account) => total + account.balance, 0);
  const monthlyExpense = Math.max(stats.expense, 1);
  const reserveMonths = totalAccountBalance / monthlyExpense;
  const savingsRate = stats.income ? (stats.net / stats.income) * 100 : 0;
  const cardPressure = stats.income ? (stats.cardOpenTotal / stats.income) * 100 : 0;

  return {
    totalAccountBalance,
    reserveMonths: Number(reserveMonths.toFixed(1)),
    savingsRate: Number(savingsRate.toFixed(1)),
    cardPressure: Number(cardPressure.toFixed(1)),
    warnings: [
      stats.net < 0 ? "resultado_mensal_negativo" : null,
      cardPressure > 35 ? "fatura_acima_de_35_porcento_da_renda" : null,
      reserveMonths < 3 ? "reserva_menor_que_3_meses_de_gastos" : null,
    ].filter(Boolean),
  };
}

function categoryBreakdown() {
  const month = document.getElementById("monthFilter")?.value || new Date().toISOString().slice(0, 7);
  const expenses = state.transactions.filter((transaction) => transaction.date.startsWith(month) && transaction.type === "expense");
  const total = sum(expenses);
  return Object.entries(
    expenses.reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      return acc;
    }, {})
  )
    .map(([category, amount]) => ({
      category,
      amount,
      percent: total ? Number(((amount / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function monthlyTrend() {
  const groups = state.transactions.reduce((acc, transaction) => {
    const month = transaction.date.slice(0, 7);
    acc[month] ||= { month, income: 0, expense: 0, net: 0 };
    acc[month][transaction.type === "income" ? "income" : "expense"] += transaction.amount;
    acc[month].net = acc[month].income - acc[month].expense;
    return acc;
  }, {});
  return Object.values(groups).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
}

function localAiFallback(question) {
  const stats = financialStats();
  const lowerQuestion = question.toLowerCase();
  const categories = categoryBreakdown();
  const topCategories = categories.slice(0, 3);

  if (/cart[aã]o|fatura|cr[eé]dito/.test(lowerQuestion)) {
    return `Sua fatura em aberto está em ${money.format(stats.cardOpenTotal)}. Isso representa ${stats.income ? Math.round((stats.cardOpenTotal / stats.income) * 100) : 0}% das entradas do mês. Comece revisando gastos no cartão nas maiores categorias: ${formatCategoryList(topCategories)}.`;
  }

  if (/carro|ve[ií]culo|comprar|financiar|entrada/.test(lowerQuestion)) {
    const diagnostics = buildFinancialDiagnostics(stats);
    const monthlyRoom = Math.max(0, stats.net);
    return `Para pensar em comprar um carro, eu olharia primeiro sua folga mensal: hoje ela está em ${money.format(stats.net)}. Seus maiores gastos são ${formatCategoryList(topCategories)}. Se a parcela, seguro e manutenção passarem de ${money.format(monthlyRoom * 0.5)}, o orçamento fica apertado. Antes de avançar, eu definiria valor de entrada, custo mensal total do carro e manteria pelo menos 3 a 6 meses de gastos em reserva; hoje sua reserva estimada cobre ${diagnostics.reserveMonths} mês(es).`;
  }

  if (/econom|guardar|poupar|sobrando|sobra/.test(lowerQuestion)) {
    const tenPercent = stats.income * 0.1;
    return `Seu resultado do mês está em ${money.format(stats.net)}. Uma meta inicial seria guardar 10% das entradas, cerca de ${money.format(tenPercent)}. Se isso estiver pesado, reduza primeiro a maior categoria: ${topCategories[0]?.category || "sem categoria suficiente"} representa ${topCategories[0]?.percent || 0}% das saídas.`;
  }

  if (/onde|gastando|gasto|maiores|revisar|cortar|reduzir/.test(lowerQuestion) && topCategories.length) {
    return `Você está gastando mais em ${formatCategoryList(topCategories)}. Eu revisaria nessa ordem porque essas categorias concentram a maior parte das saídas. Depois, olhe os lançamentos recentes mais altos antes de cortar coisas pequenas.`;
  }

  if (stats.topCategory) {
    return `O maior foco agora é ${stats.topCategory.name}, com ${money.format(stats.topCategory.value)} em saídas. Seu resultado do mês está em ${money.format(stats.net)} e a fatura aberta está em ${money.format(stats.cardOpenTotal)}. Pergunte sobre uma meta específica, como carro, reserva, quitar cartão ou reduzir gastos.`;
  }

  return "Cadastre mais entradas, saídas e faturas para eu conseguir analisar com mais precisão. Com poucos dados, eu só consigo orientar de forma geral.";
}

function formatCategoryList(categories) {
  if (!categories.length) return "sem categorias suficientes";
  return categories.map((item) => `${item.category} (${money.format(item.amount)}, ${item.percent}%)`).join(", ");
}

function setAiStatus(message) {
  document.getElementById("aiStatus").textContent = message;
}

function loadInvestmentProfile() {
  const saved = JSON.parse(localStorage.getItem("personalFinanceApp.investmentProfile") || "{}");
  if (saved.goal) document.getElementById("investmentGoal").value = saved.goal;
  if (saved.riskProfile) document.getElementById("riskProfile").value = saved.riskProfile;
  if (saved.horizon) document.getElementById("investmentHorizon").value = saved.horizon;
  if (saved.monthlyInvestment !== undefined) document.getElementById("monthlyInvestment").value = saved.monthlyInvestment;
  if (saved.emergencyReserve !== undefined) document.getElementById("emergencyReserve").value = saved.emergencyReserve;
  if (saved.notes) document.getElementById("investmentNotes").value = saved.notes;
}

function saveInvestmentProfile() {
  localStorage.setItem("personalFinanceApp.investmentProfile", JSON.stringify(getInvestmentProfile()));
  document.getElementById("investmentStatus").textContent = "Perfil salvo. A IA vai usar esses dados nas orientações.";
  renderInvestmentSummary();
}

function getInvestmentProfile() {
  return {
    goal: getValue("investmentGoal") || "reserva",
    riskProfile: getValue("riskProfile") || "conservador",
    horizon: getValue("investmentHorizon") || "curto",
    monthlyInvestment: Number(getValue("monthlyInvestment") || 0),
    emergencyReserve: Number(getValue("emergencyReserve") || 0),
    notes: getValue("investmentNotes"),
  };
}

function renderInvestmentSummary() {
  const container = document.getElementById("investmentSummary");
  if (!container) return;

  const profile = getInvestmentProfile();
  const stats = financialStats();
  const diagnostics = buildFinancialDiagnostics(stats);
  const reserveTarget = stats.expense * 6;
  const reserveGap = Math.max(0, reserveTarget - profile.emergencyReserve);
  const canInvest = stats.net > 0 && diagnostics.reserveMonths >= 3 && diagnostics.cardPressure < 35;

  const cards = [
    {
      label: "Prioridade",
      value: canInvest ? "Investir com rotina" : "Organizar base",
      detail: canInvest ? "Há espaço para aportes recorrentes." : "Reserva, dívidas ou fatura pedem atenção antes.",
    },
    {
      label: "Reserva alvo",
      value: money.format(reserveTarget),
      detail: reserveGap > 0 ? `Faltam ${money.format(reserveGap)} para 6 meses de gastos.` : "Reserva informada cobre 6 meses de gastos.",
    },
    {
      label: "Aporte",
      value: money.format(profile.monthlyInvestment),
      detail: `Perfil ${profile.riskProfile}, horizonte ${profile.horizon}.`,
    },
  ];

  container.innerHTML = cards
    .map(
      (card) => `
        <article class="investment-card">
          <span>${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(card.value)}</strong>
          <p>${escapeHtml(card.detail)}</p>
        </article>
      `
    )
    .join("");
}

async function generateInvestmentPlan() {
  saveInvestmentProfile();
  const answer = document.getElementById("investmentAnswer");
  answer.textContent = "Gerando plano com base no seu perfil e nos seus números...";
  try {
    answer.textContent = await askRealAi(
      "Monte um plano educacional de próximos passos para investimentos com base no meu perfil, reserva, gastos, faturas e capacidade de aporte. Não indique ativos específicos.",
      "investment"
    );
  } catch {
    answer.textContent = localInvestmentFallback();
  }
}

async function askInvestmentQuestion() {
  const question = getValue("investmentQuestion");
  const answer = document.getElementById("investmentAnswer");
  if (!question) {
    answer.textContent = "Escreva uma pergunta sobre investimentos para a IA analisar.";
    return;
  }
  saveInvestmentProfile();
  answer.textContent = "Analisando com a IA...";
  try {
    answer.textContent = await askRealAi(question, "investment");
  } catch {
    answer.textContent = localInvestmentFallback(question);
  }
}

function localInvestmentFallback() {
  const profile = getInvestmentProfile();
  const stats = financialStats();
  const diagnostics = buildFinancialDiagnostics(stats);

  if (diagnostics.cardPressure > 35) {
    return `Antes de investir mais, eu reduziria a pressão do cartão: sua fatura equivale a ${diagnostics.cardPressure}% das entradas do mês. Foque em baixar esse risco e manter aportes simbólicos, se couber.`;
  }

  if (diagnostics.reserveMonths < 3) {
    return `Sua reserva estimada cobre ${diagnostics.reserveMonths} mês(es) de gastos. Para um perfil ${profile.riskProfile}, o primeiro passo é aproximar isso de 3 a 6 meses antes de aumentar risco.`;
  }

  return `Com perfil ${profile.riskProfile}, horizonte ${profile.horizon} e aporte pretendido de ${money.format(profile.monthlyInvestment)}, pense em uma rotina simples: reserva preservada, aporte mensal automático e diversificação por classes, sem concentrar tudo em um único produto.`;
}

function initScrollAnimations() {
  const animatedItems = document.querySelectorAll(".metric, .panel, .form-panel, .table-panel");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    animatedItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  let observer = null;
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -36px 0px" }
    );
  }

  const revealVisibleItems = () => {
    animatedItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight - 24 && rect.bottom > 0) {
        item.classList.add("is-visible");
      }
    });
  };

  animatedItems.forEach((item, index) => {
    item.classList.add("reveal-on-scroll");
    item.style.setProperty("--reveal-delay", `${Math.min(index * 42, 240)}ms`);
    if (observer) {
      observer.observe(item);
    }
  });

  if (!observer) {
    animatedItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  revealVisibleItems();
  if ("requestAnimationFrame" in window) {
    requestAnimationFrame(revealVisibleItems);
  } else if ("setTimeout" in window) {
    setTimeout(revealVisibleItems, 0);
  }
  window.addEventListener("scroll", debounce(revealVisibleItems, 80), { passive: true });
}

function syncLoginState() {
  const session = localStorage.getItem("personalFinanceApp.session");
  document.body.classList.toggle("is-locked", !session);
  document.getElementById("loginScreen").setAttribute("aria-hidden", session ? "true" : "false");
}

function setDefaultDate() {
  document.getElementById("transactionDate").value = new Date().toISOString().slice(0, 10);
}

function getValue(id) {
  return document.getElementById(id).value.trim();
}

function persistAndRender() {
  saveState();
  render();
}

function isDashboardVisible() {
  const dashboard = document.getElementById("dashboard");
  return Boolean(dashboard?.classList.contains("active") && dashboard.offsetParent !== null);
}

function scheduleDashboardRender() {
  if ("requestAnimationFrame" in window) {
    requestAnimationFrame(() => requestAnimationFrame(renderDashboard));
    return;
  }
  setTimeout(renderDashboard, 0);
}

function render() {
  renderSourceOptions();
  renderImportSourceOptions();
  renderMonthFilter();
  renderDashboardCardFilter();
  renderDashboard();
  renderTransactions();
  renderAccountsAndCards();
  renderImportPreview();
  loadInvestmentProfile();
  renderInvestmentSummary();
}

function renderDashboardCardFilter() {
  const select = document.getElementById("dashboardCardFilter");
  if (!select) return;
  const current = select.value || "all";
  select.innerHTML = [
    `<option value="all">Todos os cartões</option>`,
    ...state.cards.map((card) => `<option value="${card.id}">${escapeHtml(card.name)}</option>`),
  ].join("");
  select.value = current === "all" || state.cards.some((card) => card.id === current) ? current : "all";
}

function renderSourceOptions() {
  const source = document.getElementById("transactionSource");
  const submit = document.querySelector("#transactionForm .primary-button");
  const options = sourceOptions();
  source.innerHTML = options.map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join("");
  source.disabled = options.length === 0;
  submit.disabled = options.length === 0;
  updateInstallmentControls();
}

function renderImportSourceOptions() {
  const source = document.getElementById("importSource");
  const importButton = document.getElementById("importSelectedRows");
  if (!source || !importButton) return;

  const options = sourceOptions();
  source.innerHTML = options.map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join("");
  source.disabled = options.length === 0;
  importButton.disabled = options.length === 0 || importPreview.length === 0;
}

function sourceOptions() {
  return [
    ...state.accounts.map((account) => [`account:${account.id}`, `Conta: ${account.name}`]),
    ...state.cards.map((card) => [`card:${card.id}`, `Cartão: ${card.name}`]),
  ];
}

function renderMonthFilter() {
  const select = document.getElementById("monthFilter");
  const months = [...new Set(state.transactions.map((transaction) => transaction.date.slice(0, 7)))].sort().reverse();
  const current = select.value || months[0] || new Date().toISOString().slice(0, 7);
  select.innerHTML = months.length
    ? months.map((month) => `<option value="${month}">${formatMonth(month)}</option>`).join("")
    : `<option value="${current}">${formatMonth(current)}</option>`;
  select.value = months.includes(current) ? current : months[0] || current;
}

function renderDashboard() {
  const month = document.getElementById("monthFilter").value;
  const selectedCard = document.getElementById("dashboardCardFilter")?.value || "all";
  const transactions = state.transactions.filter((transaction) => transaction.date.startsWith(month));
  const dashboardTransactions = selectedCard === "all"
    ? transactions
    : transactions.filter((transaction) => transaction.sourceType === "card" && transaction.sourceId === selectedCard);
  const income = sum(dashboardTransactions.filter((item) => item.type === "income"));
  const expense = sum(dashboardTransactions.filter((item) => item.type === "expense"));
  const cardOpenTotal = calculateCardOpenTotal(dashboardTransactions);
  const allBalance = calculateAccounts().reduce((total, account) => total + account.balance, 0);

  setText("totalIncome", money.format(income));
  setText("totalExpense", money.format(expense));
  setText("netBalance", money.format(income - expense));
  setText("cardOpenTotal", money.format(cardOpenTotal));
  setText("sidebarBalance", money.format(allBalance));

  renderSummaryLists();
  if (!isDashboardVisible()) return;

  renderCashflowChart(dashboardTransactions);
  renderCategoryChart(dashboardTransactions);
}

function renderTransactions() {
  const term = getValue("transactionSearch").toLowerCase();
  const rows = state.transactions
    .filter((transaction) => {
      const haystack = `${transaction.description} ${transaction.category} ${sourceName(transaction)}`.toLowerCase();
      return haystack.includes(term);
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((transaction) => {
      const amountClass = transaction.type === "income" ? "amount-income" : "amount-expense";
      const sign = transaction.type === "income" ? "+" : "-";
      const installmentLabel = transaction.installmentCount > 1 ? ` <span class="installment-badge">${transaction.installmentIndex}/${transaction.installmentCount}</span>` : "";
      return `
        <tr>
          <td>${formatDate(transaction.date)}</td>
          <td>${escapeHtml(transaction.description)}${installmentLabel}</td>
          <td>${escapeHtml(transaction.category)}</td>
          <td>${escapeHtml(sourceName(transaction))}</td>
          <td class="${amountClass}">${sign} ${money.format(transaction.amount)}</td>
          <td><button class="delete-button" data-delete-transaction="${transaction.id}" title="Excluir"><span data-icon="trash"></span></button></td>
        </tr>
      `;
    });

  const table = document.getElementById("transactionsTable");
  table.innerHTML = rows.join("") || `<tr><td colspan="6">${emptyStateMarkup()}</td></tr>`;
  hydrateIcons(table);
  table.querySelectorAll("[data-delete-transaction]").forEach((button) => {
    button.addEventListener("click", () => {
      const transaction = state.transactions.find((item) => item.id === button.dataset.deleteTransaction);
      if (transaction?.installmentGroupId && transaction.installmentCount > 1) {
        const message = `Excluir todas as ${transaction.installmentCount} parcelas desta compra?`;
        if (!confirm(message)) return;
        state.transactions = state.transactions.filter((item) => item.installmentGroupId !== transaction.installmentGroupId);
      } else {
        state.transactions = state.transactions.filter((item) => item.id !== button.dataset.deleteTransaction);
      }
      persistAndRender();
    });
  });
}

function renderAccountsAndCards() {
  renderCollection("accountsList", calculateAccounts(), (account) => `
    <div class="list-item">
      <div class="list-row">
        <strong>${escapeHtml(account.name)}</strong>
        <button class="delete-button" data-delete-account="${account.id}" title="Excluir"><span data-icon="trash"></span></button>
      </div>
      <div class="list-row subtle">
        <span>Saldo inicial</span>
        <span>${money.format(account.initialBalance)}</span>
      </div>
      <div class="list-row">
        <span class="subtle">Saldo atual</span>
        <strong>${money.format(account.balance)}</strong>
      </div>
    </div>
  `);

  renderCollection("cardsList", calculateCards(), (card) => `
    <div class="list-item">
      <div class="list-row">
        <strong>${escapeHtml(card.name)}</strong>
        <span class="list-actions">
          <button class="edit-button" data-edit-card="${card.id}" title="Editar"><span data-icon="edit"></span></button>
          <button class="delete-button" data-delete-card="${card.id}" title="Excluir"><span data-icon="trash"></span></button>
        </span>
      </div>
      <div class="list-row subtle">
        <span>Fechamento</span>
        <span>Dia ${card.closeDay}</span>
      </div>
      <div class="list-row">
        <span class="subtle">Usado</span>
        <strong>${money.format(card.used)} / ${money.format(card.limit)}</strong>
      </div>
      <div class="progress"><span style="width: ${Math.min(card.usedPercent, 100)}%"></span></div>
    </div>
  `);

  bindDeleteButtons();
}

function renderSummaryLists() {
  renderCollection("accountSummary", calculateAccounts(), (account) => `
    <div class="list-item">
      <div class="list-row">
        <strong>${escapeHtml(account.name)}</strong>
        <strong>${money.format(account.balance)}</strong>
      </div>
    </div>
  `);

  const selectedCard = document.getElementById("dashboardCardFilter")?.value || "all";
  const cards = calculateCards().filter((card) => selectedCard === "all" || card.id === selectedCard);
  renderCollection("cardSummary", cards, (card) => `
    <div class="list-item">
      <div class="list-row">
        <strong>${escapeHtml(card.name)}</strong>
        <span>${money.format(card.available)}</span>
      </div>
      <div class="progress"><span style="width: ${Math.min(card.usedPercent, 100)}%"></span></div>
    </div>
  `);
}

function renderCollection(id, items, template) {
  const container = document.getElementById(id);
  container.innerHTML = items.length ? items.map(template).join("") : emptyStateMarkup();
  hydrateIcons(container);
}

function bindDeleteButtons() {
  document.querySelectorAll("[data-delete-account]").forEach((button) => {
    button.addEventListener("click", () => {
      state.accounts = state.accounts.filter((account) => account.id !== button.dataset.deleteAccount);
      state.transactions = state.transactions.filter((transaction) => transaction.sourceId !== button.dataset.deleteAccount);
      persistAndRender();
    });
  });

  document.querySelectorAll("[data-delete-card]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cards = state.cards.filter((card) => card.id !== button.dataset.deleteCard);
      state.transactions = state.transactions.filter((transaction) => transaction.sourceId !== button.dataset.deleteCard);
      persistAndRender();
    });
  });
  document.querySelectorAll("[data-edit-card]").forEach((button) => {
    button.addEventListener("click", () => startCardEdit(button.dataset.editCard));
  });
}

function startCardEdit(cardId) {
  const card = state.cards.find((item) => item.id === cardId);
  if (!card) return;
  editingCardId = cardId;
  document.getElementById("cardName").value = card.name;
  document.getElementById("cardLimit").value = card.limit;
  document.getElementById("cardCloseDay").value = card.closeDay;
  document.getElementById("cardFormTitle").textContent = "Editar cartão";
  document.getElementById("cardSubmitText").textContent = "Salvar cartão";
  document.getElementById("cardSubmitIcon").dataset.icon = "check";
  document.getElementById("cancelCardEdit").classList.remove("hidden");
  hydrateIcons(document.getElementById("cardForm"));
  document.getElementById("cardForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetCardForm() {
  editingCardId = null;
  document.getElementById("cardForm").reset();
  document.getElementById("cardCloseDay").value = 10;
  document.getElementById("cardFormTitle").textContent = "Novo cartão";
  document.getElementById("cardSubmitText").textContent = "Cadastrar cartão";
  document.getElementById("cardSubmitIcon").dataset.icon = "plus";
  document.getElementById("cancelCardEdit").classList.add("hidden");
  hydrateIcons(document.getElementById("cardForm"));
}

function updateCalculatorResult() {
  document.getElementById("calculatorTotal").textContent = money.format(calculatorTotalValue());
}

function updateCalculatorVisibility(activeTab) {
  const widget = document.getElementById("calculatorWidget");
  if (!widget) return;
  const visible = activeTab === "transactions";
  widget.classList.toggle("is-available", visible);
  if (!visible) {
    widget.classList.remove("open");
    document.getElementById("calculatorPanel")?.setAttribute("aria-hidden", "true");
  }
}

function calculatorTotalValue() {
  const value = Number(getValue("calculatorInstallmentValue") || 0);
  const count = Math.max(1, Math.floor(Number(getValue("calculatorInstallmentCount") || 1)));
  return value * count;
}

async function handleInvoiceFiles(event) {
  const files = [...event.target.files];
  if (!files.length) return;

  setImportStatus(`Lendo ${files.length} arquivo(s)...`);
  const parsedRows = [];

  for (const file of files) {
    try {
      const text = await readPdfLikeText(file);
      document.getElementById("invoicePaste").value = text.slice(0, 12000);
      parsedRows.push(...parseInvoiceText(text));
    } catch (error) {
      setImportStatus(`Não consegui ler ${file.name}. Tente colar o texto da fatura manualmente.`);
    }
  }

  setImportPreview(parsedRows, files.map((file) => file.name).join(", "));
  event.target.value = "";
}

function setImportPreview(rows, origin) {
  importPreview = rows.map((row) => ({ ...row, id: makeId(), selected: true }));
  setImportStatus(
    importPreview.length
      ? `${importPreview.length} lançamento(s) encontrados em ${origin}. Revise antes de importar.`
      : `Nenhum lançamento claro encontrado em ${origin}. Cole o texto da fatura ou cadastre manualmente.`
  );
  renderImportPreview();
}

function renderImportPreview() {
  const table = document.getElementById("importPreviewTable");
  const importButton = document.getElementById("importSelectedRows");
  if (!table || !importButton) return;

  if (!importPreview.length) {
    table.innerHTML = `<tr><td colspan="6">${emptyStateMarkup()}</td></tr>`;
    importButton.disabled = true;
    hydrateIcons(table);
    return;
  }

  table.innerHTML = importPreview
    .map(
      (row) => `
        <tr data-preview-row="${row.id}">
          <td><input class="preview-checkbox" type="checkbox" ${row.selected ? "checked" : ""} data-preview-field="selected" /></td>
          <td><input class="preview-input" type="date" value="${row.date}" data-preview-field="date" /></td>
          <td><input class="preview-input preview-description" type="text" value="${escapeHtml(row.description)}" data-preview-field="description" /></td>
          <td><input class="preview-input" type="text" value="${escapeHtml(row.category)}" data-preview-field="category" /></td>
          <td>
            <select class="preview-select" data-preview-field="type">
              <option value="expense" ${row.type === "expense" ? "selected" : ""}>Saída</option>
              <option value="income" ${row.type === "income" ? "selected" : ""}>Entrada</option>
            </select>
          </td>
          <td><input class="preview-input" type="number" min="0.01" step="0.01" value="${row.amount}" data-preview-field="amount" /></td>
        </tr>
      `
    )
    .join("");

  table.querySelectorAll("[data-preview-field]").forEach((field) => {
    field.addEventListener("input", updatePreviewRow);
    field.addEventListener("change", updatePreviewRow);
  });
  importButton.disabled = document.getElementById("importSource").disabled;
}

function updatePreviewRow(event) {
  const rowId = event.target.closest("[data-preview-row]").dataset.previewRow;
  const field = event.target.dataset.previewField;
  const row = importPreview.find((item) => item.id === rowId);
  if (!row) return;

  if (field === "selected") {
    row.selected = event.target.checked;
  } else if (field === "amount") {
    row.amount = Number(event.target.value);
  } else {
    row[field] = event.target.value;
  }
}

function importSelectedPreviewRows() {
  const sourceValue = getValue("importSource");
  if (!sourceValue) {
    setImportStatus("Cadastre uma conta ou cartão antes de importar.");
    return;
  }

  const [sourceType, sourceId] = sourceValue.split(":");
  const selectedRows = importPreview.filter((row) => row.selected && row.date && row.description && Number(row.amount) > 0);
  if (!selectedRows.length) {
    setImportStatus("Selecione ao menos um lançamento válido para importar.");
    return;
  }

  state.transactions.push(
    ...selectedRows.map((row) => ({
      id: makeId(),
      description: row.description,
      type: row.type,
      amount: Number(row.amount),
      date: row.date,
      category: row.category || getValue("importDefaultCategory") || "Fatura",
      sourceType,
      sourceId,
    }))
  );

  importPreview = importPreview.filter((row) => !row.selected);
  saveState();
  render();
  setImportStatus(`${selectedRows.length} lançamento(s) importados para os movimentos.`);
}

function financialStats() {
  const month = document.getElementById("monthFilter")?.value || new Date().toISOString().slice(0, 7);
  const transactions = state.transactions.filter((transaction) => transaction.date.startsWith(month));
  const income = sum(transactions.filter((item) => item.type === "income"));
  const expense = sum(transactions.filter((item) => item.type === "expense"));
  const cardOpenTotal = calculateCardOpenTotal(transactions);
  const categories = transactions
    .filter((item) => item.type === "expense")
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});
  const topCategory = Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)[0];

  return { income, expense, net: income - expense, cardOpenTotal, topCategory };
}

async function readPdfLikeText(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const decoded = new TextDecoder("latin1").decode(bytes);
  const textFragments = [
    ...extractPdfLiteralStrings(decoded),
    ...extractPdfHexStrings(decoded),
    decoded,
  ];
  return normalizeInvoiceText(textFragments.join("\n"));
}

function extractPdfLiteralStrings(raw) {
  const fragments = [];
  const regex = /\((?:\\.|[^\\()]){2,}\)/g;
  let match;
  while ((match = regex.exec(raw))) {
    fragments.push(unescapePdfString(match[0].slice(1, -1)));
  }
  return fragments;
}

function extractPdfHexStrings(raw) {
  const fragments = [];
  const regex = /<([0-9A-Fa-f]{6,})>/g;
  let match;
  while ((match = regex.exec(raw))) {
    const hex = match[1];
    let value = "";
    for (let index = 0; index < hex.length - 1; index += 2) {
      const code = parseInt(hex.slice(index, index + 2), 16);
      if (code >= 32 && code <= 126) value += String.fromCharCode(code);
    }
    if (value.trim().length > 2) fragments.push(value);
  }
  return fragments;
}

function unescapePdfString(value) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function normalizeInvoiceText(text) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function parseInvoiceText(text) {
  const fallbackCategory = getValue("importDefaultCategory") || "Fatura";
  const fallbackType = getValue("importDefaultType") || "expense";
  const year = new Date().getFullYear();
  const rows = [];

  normalizeInvoiceText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const compactLine = line.replace(/\s+/g, " ");
      const match = compactLine.match(/(\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?)\s+(.+?)\s+(-?\s*R?\$?\s*\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})$/i);
      if (!match) return;

      const amount = parseMoney(match[3]);
      if (!amount) return;

      const description = cleanImportedDescription(match[2]);
      if (description.length < 2 || isLikelyInvoiceSummary(description)) return;

      rows.push({
        date: parseBrazilianDate(match[1], year),
        description,
        category: guessCategory(description, fallbackCategory),
        type: guessType(description, fallbackType),
        amount,
      });
    });

  return dedupeImportedRows(rows).slice(0, 120);
}

function parseMoney(value) {
  const normalized = value
    .replace(/\s/g, "")
    .replace(/R\$/i, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return Math.abs(Number(normalized));
}

function parseBrazilianDate(value, fallbackYear) {
  const parts = value.split(/[\/.-]/).map(Number);
  const day = String(parts[0]).padStart(2, "0");
  const month = String(parts[1]).padStart(2, "0");
  const year = parts[2] ? String(parts[2] < 100 ? 2000 + parts[2] : parts[2]) : String(fallbackYear);
  return `${year}-${month}-${day}`;
}

function cleanImportedDescription(value) {
  return value
    .replace(/\b(parcela|compra|nacional|internacional|cartao|cartão)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isLikelyInvoiceSummary(description) {
  return /total|saldo|pagamento minimo|pagamento mínimo|limite|vencimento|fatura/i.test(description);
}

function guessType(description, fallbackType) {
  return /pagamento|estorno|credito|crédito|cashback|reembolso|pix recebido|salario|salário/i.test(description) ? "income" : fallbackType;
}

function guessCategory(description, fallbackCategory) {
  const rules = [
    [/mercado|supermerc|padaria|ifood|restaurante|lanch/i, "Alimentação"],
    [/uber|99|combust|posto|metro|metrô|estacion/i, "Transporte"],
    [/farm|droga|medic|hospital|clinica|clínica/i, "Saúde"],
    [/netflix|spotify|prime|cinema|show|ingresso/i, "Lazer"],
    [/energia|internet|agua|água|telefone|condominio|condomínio/i, "Casa"],
    [/pagamento|estorno|cashback|reembolso/i, "Ajustes"],
  ];
  return rules.find(([regex]) => regex.test(description))?.[1] || fallbackCategory;
}

function dedupeImportedRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = `${row.date}-${row.description.toLowerCase()}-${row.amount}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function setImportStatus(message) {
  const status = document.getElementById("importStatus");
  if (status) status.textContent = message;
}

function renderCashflowChart(transactions) {
  const income = sum(transactions.filter((item) => item.type === "income"));
  const expense = sum(transactions.filter((item) => item.type === "expense"));
  drawBarChart("cashflowChart", [
    { label: "Entradas", value: income, color: "#45e58f", glow: "#08704d" },
    { label: "Saídas", value: expense, color: "#ff7f8f", glow: "#be2944" },
    { label: "Resultado", value: income - expense, color: "#6db7ff", glow: "#1d4ed8" },
  ]);
}

function renderCategoryChart(transactions) {
  const categories = transactions
    .filter((item) => item.type === "expense")
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});
  const labels = Object.keys(categories);
  drawDonutChart(
    "categoryChart",
    labels.length
      ? labels.map((label) => ({ label, value: categories[label] }))
      : [{ label: "Sem saídas", value: 1, empty: true }]
  );
}

function drawBarChart(canvasId, items) {
  const canvas = prepareCanvas(canvasId);
  const ctx = canvas.getContext("2d");
  const width = canvas.logicalWidth;
  const height = canvas.logicalHeight;
  const chartWidth = Math.min(width - 56, 500);
  const chartLeft = (width - chartWidth) / 2;
  const chartRight = chartLeft + chartWidth;
  const chartTop = 30;
  const baseline = height - 38;
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  const slotWidth = chartWidth / items.length;
  const barWidth = Math.min(70, Math.max(42, slotWidth * 0.42));
  const hasValues = items.some((item) => Math.abs(item.value) > 0.009);

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = cssVar("--chart-grid");
  ctx.lineWidth = 1;
  for (let line = 0; line < 4; line++) {
    const y = chartTop + line * ((baseline - chartTop) / 3);
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();
  }

  if (!hasValues) {
    const emptyY = height * 0.52;
    const emptyWidth = Math.min(330, chartWidth);

    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    roundRect(ctx, width / 2 - emptyWidth / 2, emptyY - 42, emptyWidth, 84, 18);
    ctx.fill();

    ctx.fillStyle = cssVar("--chart-text");
    ctx.font = "750 15px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Sem lançamentos neste mês", width / 2, emptyY - 8);
    ctx.fillStyle = cssVar("--chart-muted");
    ctx.font = "650 12px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("Adicione entradas ou saídas para ver o comparativo.", width / 2, emptyY + 15);

    items.forEach((item, index) => {
      const center = chartLeft + slotWidth * index + slotWidth / 2;
      ctx.fillStyle = colorMix(item.color, 0.72);
      roundRect(ctx, center - 18, baseline - 4, 36, 4, 4);
      ctx.fill();
      ctx.fillStyle = cssVar("--chart-muted");
      ctx.font = "650 12px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.label, center, height - 18);
    });
    return;
  }

  items.forEach((item, index) => {
    const center = chartLeft + slotWidth * index + slotWidth / 2;
    const barHeight = Math.max(10, (Math.abs(item.value) / max) * (height - 98));
    const x = center - barWidth / 2;
    const y = item.value >= 0 ? baseline - barHeight : baseline;
    const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);

    gradient.addColorStop(0, item.color);
    gradient.addColorStop(1, item.glow);

    if (barHeight > 0) {
      roundRect(ctx, x, y, barWidth, barHeight, 8);
      ctx.fillStyle = gradient;
      ctx.shadowColor = item.glow;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = cssVar("--chart-text");
    ctx.font = "700 12px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    drawCenteredFittedText(ctx, money.format(item.value), center, Math.max(18, y - 12), Math.min(116, slotWidth - 8));
    ctx.fillStyle = cssVar("--chart-muted");
    ctx.font = "650 12px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(item.label, center, height - 18);
  });
}

function drawDonutChart(canvasId, items) {
  const canvas = prepareCanvas(canvasId);
  const ctx = canvas.getContext("2d");
  const width = canvas.logicalWidth;
  const height = canvas.logicalHeight;
  const hasSideLegend = width >= 440;
  const radius = hasSideLegend ? Math.min(width * 0.22, height * 0.34) : Math.min(width, height) * 0.25;
  const centerX = hasSideLegend ? width * 0.3 : width / 2;
  const centerY = hasSideLegend ? height * 0.48 : height * 0.34;
  const total = items.reduce((acc, item) => acc + item.value, 0);
  const colors = ["#45e58f", "#2dd4bf", "#6db7ff", "#ffd166", "#ff7f8f", "#9ae6b4"];
  let start = -Math.PI / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.shadowColor = "rgba(69,229,143,0.24)";
  ctx.shadowBlur = 20;
  items.forEach((item, index) => {
    const slice = (item.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = item.empty ? "rgba(255,255,255,0.09)" : colors[index % colors.length];
    ctx.fill();
    ctx.strokeStyle = cssVar("--chart-hole");
    ctx.lineWidth = 3;
    ctx.stroke();
    start += slice;
  });
  ctx.restore();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = cssVar("--chart-hole");
  ctx.fill();

  ctx.fillStyle = cssVar("--chart-text");
  ctx.font = "800 16px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(items.some((item) => item.empty) ? "R$ 0,00" : compactMoney(total), centerX, centerY - 2);
  ctx.fillStyle = cssVar("--chart-muted");
  ctx.font = "700 10px system-ui";
  ctx.fillText("saídas", centerX, centerY + 15);

  const legendX = hasSideLegend ? width * 0.56 : 24;
  const legendY = hasSideLegend ? Math.max(52, centerY - 74) : height - 104;
  const rowGap = hasSideLegend ? 40 : 24;
  const maxRows = hasSideLegend ? 5 : 4;
  ctx.textAlign = "left";
  items.slice(0, maxRows).forEach((item, index) => {
    const y = legendY + index * rowGap;
    const percent = item.empty ? 0 : Math.round((item.value / total) * 100);
    const labelMax = hasSideLegend ? width - legendX - 78 : width - 160;

    ctx.fillStyle = item.empty ? "rgba(255,255,255,0.12)" : colors[index % colors.length];
    roundRect(ctx, legendX, y - 11, 8, 22, 4);
    ctx.fill();

    ctx.fillStyle = cssVar("--chart-text");
    ctx.font = "750 12px system-ui";
    drawFittedText(ctx, item.label, legendX + 16, y - 1, labelMax);

    ctx.fillStyle = cssVar("--chart-muted");
    ctx.font = "700 11px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(`${percent}%`, width - 24, y - 1);
    ctx.fillStyle = cssVar("--chart-muted");
    ctx.fillText(item.empty ? "" : money.format(item.value), width - 24, y + 15);
    ctx.textAlign = "left";
  });
}

function cssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function compactMoney(value) {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  }
  return money.format(value);
}

function colorMix(hex, alpha) {
  const value = hex.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function drawFittedText(ctx, text, x, y, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }

  let fitted = text;
  while (fitted.length > 3 && ctx.measureText(`${fitted}...`).width > maxWidth) {
    fitted = fitted.slice(0, -1);
  }
  ctx.fillText(`${fitted}...`, x, y);
}

function drawCenteredFittedText(ctx, text, centerX, y, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, centerX, y);
    return;
  }

  let fitted = text;
  while (fitted.length > 3 && ctx.measureText(`${fitted}...`).width > maxWidth) {
    fitted = fitted.slice(0, -1);
  }
  ctx.fillText(`${fitted}...`, centerX, y);
}

function prepareCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const parentWidth = canvas.parentElement?.getBoundingClientRect().width || 0;
  const measuredWidth = rect.width > 1 ? rect.width : parentWidth - 36;
  const width = Math.max(320, Math.floor(measuredWidth));
  const cssHeight = Math.max(Number(canvas.getAttribute("height")), Math.floor(rect.height || Number(canvas.getAttribute("height"))));
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(cssHeight * ratio);
  canvas.logicalWidth = width;
  canvas.logicalHeight = cssHeight;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return canvas;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function calculateAccounts() {
  return state.accounts.map((account) => {
    const accountTransactions = state.transactions.filter((transaction) => transaction.sourceType === "account" && transaction.sourceId === account.id);
    const income = sum(accountTransactions.filter((item) => item.type === "income"));
    const expense = sum(accountTransactions.filter((item) => item.type === "expense"));
    return { ...account, balance: account.initialBalance + income - expense };
  });
}

function calculateCards() {
  return state.cards.map((card) => {
    const used = calculateCardUsed(card.id);
    const available = card.limit - used;
    const usedPercent = card.limit ? (used / card.limit) * 100 : 0;
    return { ...card, used, available, usedPercent };
  });
}

function calculateCardUsed(cardId) {
  const installments = new Map();
  let expenseTotal = 0;
  let creditTotal = 0;
  state.transactions
    .filter((transaction) => transaction.sourceType === "card" && transaction.sourceId === cardId)
    .forEach((transaction) => {
      if (transaction.type === "income") {
        creditTotal += Number(transaction.amount || 0);
        return;
      }
      if (transaction.type !== "expense") return;
      if (transaction.installmentGroupId && transaction.installmentTotal) {
        installments.set(transaction.installmentGroupId, Number(transaction.installmentTotal));
        return;
      }
      expenseTotal += Number(transaction.amount || 0);
    });
  const committedExpenses = expenseTotal + [...installments.values()].reduce((acc, value) => acc + value, 0);
  return Math.max(0, committedExpenses - creditTotal);
}

function calculateCardOpenTotal(transactions) {
  const cardExpenses = sum(transactions.filter((transaction) => transaction.sourceType === "card" && transaction.type === "expense"));
  const cardCredits = sum(transactions.filter((transaction) => transaction.sourceType === "card" && transaction.type === "income"));
  return Math.max(0, cardExpenses - cardCredits);
}

function buildTransactionEntries({ sourceType, sourceId, type, amount, installments }) {
  const description = getValue("transactionDescription");
  const date = getValue("transactionDate");
  const category = getValue("transactionCategory");
  if (installments <= 1) {
    return [{
      id: makeId(),
      description,
      type,
      amount,
      date,
      category,
      sourceType,
      sourceId,
    }];
  }

  const groupId = makeId();
  const values = splitInstallmentValues(amount, installments);
  return values.map((value, index) => ({
    id: makeId(),
    description,
    type,
    amount: value,
    date: addMonths(date, index),
    category,
    sourceType,
    sourceId,
    installmentGroupId: groupId,
    installmentIndex: index + 1,
    installmentCount: installments,
    installmentTotal: amount,
  }));
}

function updateInstallmentControls() {
  const row = document.getElementById("installmentRow");
  const hint = document.getElementById("installmentHint");
  const sourceValue = document.getElementById("transactionSource")?.value || "";
  const type = getValue("transactionType");
  const isCardExpense = sourceValue.startsWith("card:") && type === "expense";
  row?.classList.toggle("hidden", !isCardExpense);
  if (!hint) return;

  const amount = Number(getValue("transactionAmount") || 0);
  const installments = getInstallmentCount();
  const monthlyValue = installments > 0 ? amount / installments : amount;
  hint.textContent = isCardExpense && installments > 1
    ? `${installments} lançamentos mensais de ${money.format(monthlyValue)}. O limite usado será ${money.format(amount)}.`
    : "Compras no cartão podem ser lançadas em parcelas mensais.";
}

function getInstallmentCount() {
  const raw = Number(getValue("transactionInstallments") || 1);
  return Math.min(60, Math.max(1, Math.floor(raw || 1)));
}

function splitInstallmentValues(total, count) {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;
  return Array.from({ length: count }, (_, index) => (base + (index < remainder ? 1 : 0)) / 100);
}

function addMonths(date, monthOffset) {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(year, month - 1 + monthOffset, day);
  if (result.getDate() !== day) result.setDate(0);
  const resultYear = result.getFullYear();
  const resultMonth = String(result.getMonth() + 1).padStart(2, "0");
  const resultDay = String(result.getDate()).padStart(2, "0");
  return `${resultYear}-${resultMonth}-${resultDay}`;
}

function sourceName(transaction) {
  const collection = transaction.sourceType === "card" ? state.cards : state.accounts;
  const prefix = transaction.sourceType === "card" ? "Cartão" : "Conta";
  return `${prefix}: ${collection.find((item) => item.id === transaction.sourceId)?.name || "Removido"}`;
}

function sum(items) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0);
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatMonth(month) {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function debounce(callback, delay) {
  let timeout;
  return () => {
    if (!("setTimeout" in window)) {
      callback();
      return;
    }
    clearTimeout(timeout);
    timeout = setTimeout(callback, delay);
  };
}

function emptyStateMarkup() {
  const template = document.getElementById("emptyStateTemplate").content.cloneNode(true);
  const wrapper = document.createElement("div");
  wrapper.append(template);
  hydrateIcons(wrapper);
  return wrapper.innerHTML;
}

function demoState() {
  const accountA = makeId();
  const accountB = makeId();
  const cardA = makeId();
  const cardB = makeId();
  const month = new Date().toISOString().slice(0, 7);
  return {
    accounts: [
      { id: accountA, name: "Conta principal", initialBalance: 3200 },
      { id: accountB, name: "Reserva", initialBalance: 8500 },
    ],
    cards: [
      { id: cardA, name: "Cartão do dia a dia", limit: 4500, closeDay: 12 },
      { id: cardB, name: "Cartão viagens", limit: 8000, closeDay: 20 },
    ],
    transactions: [
      { id: makeId(), description: "Salário", type: "income", amount: 6200, date: `${month}-05`, category: "Renda", sourceType: "account", sourceId: accountA },
      { id: makeId(), description: "Aluguel", type: "expense", amount: 1850, date: `${month}-06`, category: "Moradia", sourceType: "account", sourceId: accountA },
      { id: makeId(), description: "Supermercado", type: "expense", amount: 720, date: `${month}-09`, category: "Alimentação", sourceType: "card", sourceId: cardA },
      { id: makeId(), description: "Internet", type: "expense", amount: 129.9, date: `${month}-10`, category: "Casa", sourceType: "account", sourceId: accountA },
      { id: makeId(), description: "Freela", type: "income", amount: 950, date: `${month}-14`, category: "Renda extra", sourceType: "account", sourceId: accountB },
      { id: makeId(), description: "Restaurante", type: "expense", amount: 186.5, date: `${month}-15`, category: "Lazer", sourceType: "card", sourceId: cardA },
      { id: makeId(), description: "Passagens", type: "expense", amount: 1340, date: `${month}-18`, category: "Viagem", sourceType: "card", sourceId: cardB },
    ],
  };
}
