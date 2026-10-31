import "./styles.css";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatApiResponse = {
  answer?: string;
  error?: string;
};

type BackendHealthResponse = {
  status?: string;
  provider?: string;
  configured?: boolean;
};

const messages: ChatMessage[] = [];

const welcome = document.querySelector<HTMLElement>("#welcome")!;
const messageList = document.querySelector<HTMLElement>("#messages")!;
const form = document.querySelector<HTMLFormElement>("#chat-form")!;
const input = document.querySelector<HTMLTextAreaElement>("#message-input")!;
const sendButton = document.querySelector<HTMLButtonElement>("#send-button")!;
const modelDot = document.querySelector<HTMLElement>("#model-dot")!;
const modelStatus = document.querySelector<HTMLElement>("#model-status")!;
const toastRegion = document.querySelector<HTMLElement>("#toast-region")!;

let isSending = false;
let toastTimeout: number | undefined;

function setTheme(theme: "dark" | "light"): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute(
    "content",
    theme === "dark" ? "#111110" : "#f5f5f5",
  );
  const nextTheme = theme === "dark" ? "clair" : "sombre";
  document.querySelectorAll<HTMLButtonElement>(".theme-toggle").forEach((button) => {
    button.setAttribute("aria-label", `Activer le mode ${nextTheme}`);
    button.title = `Activer le mode ${nextTheme}`;
  });
  localStorage.setItem("mentor-it-theme", theme);
}

const savedTheme = localStorage.getItem("mentor-it-theme");
setTheme(savedTheme === "light" ? "light" : "dark");

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character]!;
  });
}

function renderMarkdown(text: string): string {
  const codeBlocks: string[] = [];
  let html = escapeHtml(text).replace(/```([^\n]*)\n([\s\S]*?)```/g, (_match, _language: string, code: string) => {
    const index = codeBlocks.push(
      `<pre><code>${code.trimEnd()}</code></pre>`,
    ) - 1;
    return `@@CODE${index}@@`;
  });

  html = html
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^\s*[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)(?:\n(?!<li>))/g, "$1");

  html = html
    .split(/\n{2,}/)
    .map((paragraph) => {
      if (/^@@CODE\d+@@$/.test(paragraph)) return paragraph;
      if (paragraph.startsWith("<h3>") || paragraph.startsWith("<h4>")) return paragraph;
      if (/^(<li>.*<\/li>\s*)+$/.test(paragraph)) return `<ul>${paragraph}</ul>`;
      return paragraph ? `<p>${paragraph.replace(/\n/g, "<br>")}</p>` : "";
    })
    .join("");

  return html.replace(/@@CODE(\d+)@@/g, (_match, index: string) => codeBlocks[Number(index)]!);
}

function scrollToLatestMessage(): void {
  messageList.scrollTop = messageList.scrollHeight;
}

function addMessage(role: ChatMessage["role"], content: string): HTMLElement {
  const item = document.createElement("article");
  item.className = `message message-${role}`;

  const avatar = document.createElement("span");
  avatar.className = `message-avatar ${role === "assistant" ? "mentor-avatar" : "user-avatar"}`;
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = role === "assistant" ? "✳" : "T";

  const body = document.createElement("div");
  body.className = "message-body";

  const label = document.createElement("div");
  label.className = "message-label";
  label.innerHTML =
    role === "assistant"
        ? 'Ton mentor <span class="message-model">· Gemma 4</span>'
      : "Toi";

  const contentElement = document.createElement("div");
  contentElement.className = "message-content";
  contentElement.innerHTML = renderMarkdown(content);

  body.append(label, contentElement);
  item.append(avatar, body);
  messageList.append(item);
  scrollToLatestMessage();
  return item;
}

function setLoading(loading: boolean): void {
  isSending = loading;
  sendButton.disabled = loading;
  input.disabled = loading;

  if (!loading) return;

  const item = document.createElement("article");
  item.className = "message message-assistant loading-message";
  item.innerHTML = `
    <span class="message-avatar mentor-avatar" aria-hidden="true">✳</span>
    <div class="message-body">
      <div class="message-label">Ton mentor <span class="message-model">· réfléchit</span></div>
      <div class="typing-indicator" aria-label="Ton mentor prépare sa réponse"><span></span><span></span><span></span></div>
    </div>`;
  item.dataset.loading = "true";
  messageList.append(item);
  scrollToLatestMessage();
}

function removeLoading(): void {
  messageList.querySelector('[data-loading="true"]')?.remove();
}

function showToast(message: string): void {
  window.clearTimeout(toastTimeout);
  toastRegion.textContent = message;
  toastRegion.classList.add("toast-visible");
  toastTimeout = window.setTimeout(() => {
    toastRegion.classList.remove("toast-visible");
  }, 4200);
}

function resetConversation(): void {
  messages.length = 0;
  messageList.replaceChildren();
  welcome.hidden = false;
  input.value = "";
  input.focus();
}

function showHelp(): void {
  addMessage(
    "assistant",
    "**Voici ce que l’on peut faire ensemble :**\n\n- Pose-moi une question sur le code, le web ou l’informatique.\n- Tape `/sujet HTML` pour une mini-leçon sur un thème.\n- Tape `/aide` pour retrouver ces commandes.\n- Clique sur **Nouvelle discussion** pour repartir de zéro.\n\nLes réponses sont générées par une IA : pense à vérifier les informations importantes.",
  );
}

async function sendToMentor(text: string): Promise<void> {
  if (isSending || !text.trim()) return;

  const message = text.trim();
  welcome.hidden = true;
  messages.push({ role: "user", content: message });
  addMessage("user", message);
  input.value = "";
  input.style.height = "auto";
  setLoading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
      }),
      signal: AbortSignal.timeout(120_000),
    });

    const data = (await response.json()) as ChatApiResponse;
    if (!response.ok) {
      throw new Error(data.error || `Erreur du serveur (${response.status}).`);
    }

    const answer = data.answer?.trim();
    if (!answer) {
      throw new Error("Gemma 4 n’a pas renvoyé de réponse. Réessaie dans un instant.");
    }

    messages.push({ role: "assistant", content: answer });
    removeLoading();
    addMessage("assistant", answer);
    modelDot.classList.add("connected");
    modelDot.classList.remove("disconnected");
  } catch (error) {
    removeLoading();
    messages.pop();
    modelDot.classList.remove("connected");
    modelDot.classList.add("disconnected");
    modelStatus.title = "Gemma indisponible. Vérifie la configuration de Google AI Studio.";

    const detail =
      error instanceof DOMException && error.name === "TimeoutError"
        ? "La réponse prend plus de temps que prévu. Réessaie dans un instant."
        : error instanceof TypeError
          ? "Impossible de joindre le backend. Vérifie qu’il fonctionne avec `npm run dev`."
          : error instanceof Error
            ? error.message
            : "Une erreur inattendue s’est produite.";

    addMessage("assistant", `**Je n’arrive pas à répondre pour l’instant.**\n\n${detail}`);
  } finally {
    setLoading(false);
    input.disabled = false;
    input.focus();
  }
}

function handleSubmission(rawText: string): void {
  const text = rawText.trim();
  if (!text || isSending) return;

  const command = text.match(/^\/(\S+)(?:\s+([\s\S]*))?$/);
  if (!command) {
    void sendToMentor(text);
    return;
  }

  const [, name, argument = ""] = command;
  switch (name.toLowerCase()) {
    case "aide":
      welcome.hidden = true;
      showHelp();
      input.value = "";
      break;
    case "sujet":
      if (!argument.trim()) {
        showToast("Écris un thème après la commande, par exemple : /sujet HTML");
        return;
      }
      void sendToMentor(
        `Prépare-moi une mini-leçon pour débutant·e sur ${argument.trim()}. Explique les bases avec des mots simples, un exemple facile à tester et un petit exercice.`,
      );
      break;
    case "quitter":
      resetConversation();
      showToast("À bientôt ! Continue à apprendre pas à pas. Tu peux fermer cet onglet.");
      break;
    default:
      showToast(`Commande inconnue : /${escapeHtml(name)}. Tape /aide pour voir les commandes disponibles.`);
  }
}

async function checkBackend(): Promise<void> {
  try {
    const response = await fetch("/api/health", {
      signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) {
      throw new Error(`Backend indisponible (${response.status}).`);
    }

    const data = (await response.json()) as BackendHealthResponse;
    if (data.status !== "ok") {
      throw new Error("Backend indisponible.");
    }

    if (!data.configured) {
      modelDot.classList.remove("connected");
      modelDot.classList.add("disconnected");
      modelStatus.title = "Clé Google AI Studio manquante. Configure GEMINI_API_KEY dans .env.";
      return;
    }

    modelDot.classList.add("connected");
    modelDot.classList.remove("disconnected");
    modelStatus.title = "Backend connecté à Google AI Studio.";
  } catch (error) {
    modelDot.classList.remove("connected");
    modelDot.classList.add("disconnected");
    modelStatus.title =
      error instanceof Error
        ? error.message
        : "Backend inaccessible. Lance le serveur avec npm run dev.";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  handleSubmission(input.value);
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 144)}px`;
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const promptButton = target.closest<HTMLButtonElement>("[data-prompt]");
  if (promptButton) {
    const prompt = promptButton.dataset.prompt;
    if (prompt) void sendToMentor(prompt);
    return;
  }

  const actionButton = target.closest<HTMLElement>("[data-action]");
  if (!actionButton) return;

  if (actionButton.dataset.action === "new-chat" || actionButton.dataset.action === "home") {
    resetConversation();
  } else if (actionButton.dataset.action === "theme-toggle") {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  } else if (actionButton.dataset.action === "info") {
    showToast("Mentor IT utilise Gemma via Google AI Studio. Ta clé reste sur le serveur et les conversations ne sont pas enregistrées.");
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    resetConversation();
  }
});

void checkBackend();
input.focus({ preventScroll: true });
