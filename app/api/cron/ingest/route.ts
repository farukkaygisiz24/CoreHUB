import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runIngest } from "@/lib/ingest/run";
import { CATEGORY_SLUGS } from "@/lib/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  // Vercel Cron bazen Authorization göndermez; resmi UA + schedule header ile doğrula
  const ua = req.headers.get("user-agent") ?? "";
  if (ua.includes("vercel-cron") && req.headers.get("x-vercel-cron-schedule")) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runIngest();

    revalidatePath("/", "layout");
    for (const slug of CATEGORY_SLUGS) {
      revalidatePath(`/${slug}`);
    }

    return NextResponse.json({
      ok: true,
      added: result.added,
      total: result.total,
      log: result.messages,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
