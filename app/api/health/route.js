import { NextResponse } from 'next/server';
import { HAS_SUPABASE } from '../../../lib/store';
import { PRIORITIES } from '../../../lib/priority';

export const dynamic = 'force-dynamic';

/** GET /api/health —— 当前数据源（supabase / local） */
export async function GET() {
  return NextResponse.json({
    ok: true,
    storage: HAS_SUPABASE ? 'supabase' : 'local',
    priorities: PRIORITIES
  });
}
