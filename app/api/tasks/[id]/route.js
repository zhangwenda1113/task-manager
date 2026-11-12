import { NextResponse } from 'next/server';
import { updateTask, deleteTask } from '../../../../lib/store';
import { isPriority, normalizeTitle } from '../../../../lib/priority';

export const dynamic = 'force-dynamic';

function fail(message, status = 500) {
  return NextResponse.json({ ok: false, message }, { status });
}

/** PATCH /api/tasks/:id —— 切换完成状态（也可改标题、优先级） */
export async function PATCH(request, { params }) {
  try {
    const id = params.id;
    const body = await request.json().catch(() => null);
    if (!body) return fail('请求体格式不正确', 400);

    if (body.completed !== undefined && typeof body.completed !== 'boolean') {
      return fail('completed 必须是布尔值', 400);
    }
    if (body.title === undefined && body.priority === undefined && body.completed === undefined) {
      return fail('没有需要更新的字段', 400);
    }

    const patch = {};
    if (body.completed !== undefined) patch.completed = body.completed;
    if (body.title !== undefined) {
      const titleCheck = normalizeTitle(body.title);
      if (!titleCheck.ok) return fail(titleCheck.message, 400);
      patch.title = titleCheck.title;
    }
    if (body.priority !== undefined) {
      if (!isPriority(body.priority)) return fail('优先级只能是「高 / 中 / 低」', 400);
      patch.priority = body.priority;
    }

    const task = await updateTask(id, patch);
    return NextResponse.json({ ok: true, data: task });
  } catch (error) {
    const notFound = error.message === '任务不存在';
    return fail(error.message || '更新任务失败', notFound ? 404 : 500);
  }
}

/** DELETE /api/tasks/:id —— 删除任务 */
export async function DELETE(request, { params }) {
  try {
    await deleteTask(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const notFound = error.message === '任务不存在';
    return fail(error.message || '删除任务失败', notFound ? 404 : 500);
  }
}
