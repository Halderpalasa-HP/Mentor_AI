import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || "127.0.0.1";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT doit être un numéro de port valide.");
}

const server = createApp().listen(port, host, () => {
  console.log(`Mentor IT backend listening at http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close((error) => {
      if (error) {
        console.error("Backend shutdown failed", { name: error.name });
        process.exitCode = 1;
      }
    });
  });
}
