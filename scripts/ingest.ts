import { config } from "dotenv";
import { runIngest } from "@/lib/ingest/run";

config({ path: ".env.local" });

runIngest()
  .then((r) => {
    for (const line of r.messages) console.log(line);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Ingest hatası:", err);
    process.exit(1);
  });
