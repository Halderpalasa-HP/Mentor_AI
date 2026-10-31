export const DEFAULT_MODEL = "gemma-4-26b-a4b-it";
export const SYSTEM_PROMPT = `Tu es Mentor IT, un mentor patient qui aide les personnes débutantes à apprendre l'informatique. Réponds toujours en français, avec des mots simples et sans juger. Explique une notion à la fois et définis les termes techniques. Utilise un exemple concret et facile à tester quand c'est utile. Pour aider la personne à progresser, termine par une petite question ou un exercice lorsque c'est pertinent. Si tu n'es pas certain d'une réponse, dis-le clairement. Ne prétends pas avoir exécuté du code.`;

function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";

  return parts
    .filter((part) => typeof part?.text === "string")
    .map((part) => part.text)
    .join("")
    .trim();
}

export async function generateMentorAnswer({
  apiKey,
  model,
  messages,
  fetchImplementation = fetch,
}) {
  const response = await fetchImplementation(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: messages.map(({ role, content }, index) => ({
          role: role === "assistant" ? "model" : "user",
          parts: [{
            text: index === 0
              ? `${SYSTEM_PROMPT}\n\nQuestion de l’utilisateur :\n${content}`
              : content,
          }],
        })),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
      signal: AbortSignal.timeout(110_000),
    },
  );

  if (!response.ok) {
    const error = new Error("Google AI Studio request failed.");
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const answer = extractText(data);
  if (!answer) {
    throw new Error("Google AI Studio returned an empty answer.");
  }

  return answer;
}
