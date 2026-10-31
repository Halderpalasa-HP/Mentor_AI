import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { DEFAULT_MODEL, generateMentorAnswer } from "./gemini.js";

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(serverDirectory, "..");
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 6000;
const MAX_CONVERSATION_LENGTH = 24000;

function validateMessages(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
    return "La conversation doit contenir entre 1 et 20 messages.";
  }

  let totalLength = 0;
  for (const message of value) {
    if (
      typeof message !== "object" ||
      message === null ||
      !["user", "assistant"].includes(message.role) ||
      typeof message.content !== "string"
    ) {
      return "Chaque message doit avoir un rôle « user » ou « assistant » et un texte.";
    }

    const content = message.content.trim();
    if (!content || content.length > MAX_MESSAGE_LENGTH) {
      return "Chaque message doit contenir entre 1 et 6 000 caractères.";
    }

    totalLength += content.length;
  }

  if (totalLength > MAX_CONVERSATION_LENGTH) {
    return "La conversation est trop longue. Commence une nouvelle discussion.";
  }

  if (value[value.length - 1].role !== "user") {
    return "Le dernier message doit être une question.";
  }

  return null;
}

function getProviderErrorStatus(error) {
  const status = Number(error?.status ?? error?.statusCode);
  if ([401, 402, 403, 404, 429].includes(status)) return status;
  if (status >= 500) return 503;
  return 502;
}

function getProviderErrorMessage(status) {
  if (status === 401 || status === 403) {
    return "Clé Google AI Studio invalide ou accès refusé. Vérifie GEMINI_API_KEY.";
  }
  if (status === 402) {
    return "Le compte Google AI Studio ne dispose pas du quota nécessaire.";
  }
  if (status === 404) {
    return "Le modèle Gemma configuré est introuvable ou indisponible dans l’API Gemini.";
  }
  if (status === 429) {
    return "La limite de requêtes Google AI Studio est atteinte. Réessaie plus tard.";
  }
  if (status === 503) {
    return "Google AI Studio est temporairement indisponible. Réessaie dans un instant.";
  }
  return "Google AI Studio n’a pas pu générer de réponse. Vérifie le modèle configuré.";
}

export function createApp({
  apiKey = process.env.GEMINI_API_KEY,
  model = process.env.GEMINI_MODEL || DEFAULT_MODEL,
  generateResponse = generateMentorAnswer,
  logger = console,
} = {}) {
  const app = express();
  const configuredApiKey =
    typeof apiKey === "string" && apiKey.trim().length > 0;

  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        },
      },
    }),
  );
  app.use(express.json({ limit: "48kb" }));

  app.get("/api/health", (_request, response) => {
    response.json({
      status: "ok",
      provider: "google-ai-studio",
      model,
      configured: configuredApiKey,
    });
  });

  app.post(
    "/api/chat",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 20,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Trop de questions en peu de temps. Réessaie dans quelques minutes." },
    }),
    async (request, response) => {
      if (!configuredApiKey) {
        response.status(503).json({
          error: "Le serveur n’est pas encore configuré. Ajoute GEMINI_API_KEY dans le fichier .env.",
        });
        return;
      }

      const validationError = validateMessages(request.body?.messages);
      if (validationError) {
        response.status(400).json({ error: validationError });
        return;
      }

      const messages = request.body.messages.map(({ role, content }) => ({
        role,
        content: content.trim(),
      }));

      try {
        const answer = await generateResponse({ apiKey: apiKey.trim(), model, messages });
        if (typeof answer !== "string" || !answer.trim()) {
          response.status(502).json({ error: "Gemma n’a pas renvoyé de réponse. Réessaie." });
          return;
        }

        response.json({ answer: answer.trim() });
      } catch (error) {
        const status = getProviderErrorStatus(error);
        logger.error("Google AI Studio request failed", {
          status: error?.status ?? error?.statusCode ?? "unknown",
          name: error instanceof Error ? error.name : "UnknownError",
        });
        response.status(status).json({ error: getProviderErrorMessage(status) });
      }
    },
  );

  const clientBuildDirectory = resolve(projectDirectory, "dist");
  const clientEntryPoint = resolve(clientBuildDirectory, "index.html");
  if (existsSync(clientEntryPoint)) {
    app.use(express.static(clientBuildDirectory, { index: false }));
    app.get(/.*/, (request, response, next) => {
      if (request.path.startsWith("/api/")) {
        next();
        return;
      }
      response.sendFile(clientEntryPoint);
    });
  }

  app.use("/api", (_request, response) => {
    response.status(404).json({ error: "Route API introuvable." });
  });

  app.use((error, _request, response, _next) => {
    if (error?.type === "entity.too.large") {
      response.status(413).json({ error: "La demande est trop volumineuse." });
      return;
    }
    if (error instanceof SyntaxError && "body" in error) {
      response.status(400).json({ error: "Le corps de la demande doit être un JSON valide." });
      return;
    }

    logger.error("Backend request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    response.status(500).json({ error: "Une erreur interne est survenue. Réessaie." });
  });

  return app;
}
