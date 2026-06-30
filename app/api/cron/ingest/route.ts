import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runIngest } from "@/lib/ingest/run";
import { CATEGORY_SLUGS } from "@/lib/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
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
