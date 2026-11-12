import { NextResponse } from 'next/server';
import { listTasks, createTask } from '../../../lib/store';
import { isFilter, isPriority, normalizeTitle, DEFAULT_PRIORITY } from '../../../lib/priority';

// 每次都读数据库，不做静态缓存
export const dynamic = 'force-dynamic';

function fail(message, status = 500) {
  return NextResponse.json({ ok: false, message }, { status });
}

/** GET /api/tasks?priority=全部|高|中|低 —— 任务列表（按创建时间倒序） */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get('priority') || '全部';
    if (!isFilter(priority)) return fail('优先级筛选参数不合法', 400);

    const data = await listTasks(priority);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return fail(error.message || '任务加载失败');
  }
}

/** POST /api/tasks —— 新增任务，body: { title, priority } */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return fail('请求体格式不正确', 400);

    const titleCheck = normalizeTitle(body.title);
    if (!titleCheck.ok) return fail(titleCheck.message, 400);

    let priority = DEFAULT_PRIORITY;
    if (body.priority !== undefined && body.priority !== null && body.priority !== '') {
      if (!isPriority(body.priority)) return fail('优先级只能是「高 / 中 / 低」', 400);
      priority = body.priority;
    }

    const task = await createTask({ title: titleCheck.title, priority });
    return NextResponse.json({ ok: true, data: task }, { status: 201 });
  } catch (error) {
    return fail(error.message || '添加任务失败');
  }
}
