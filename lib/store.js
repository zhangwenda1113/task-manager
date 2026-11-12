/**
 * 数据访问层（仅在服务端运行）
 * ------------------------------------------------------------
 * 配置了 SUPABASE_URL / SUPABASE_ANON_KEY 时，通过 @supabase/supabase-js
 * 走 Supabase REST API 读写 tasks 表；
 * 未配置时降级为本地 JSON 文件，方便先预览界面、跑通功能。
 *
 * 表结构（见 supabase/schema.sql）：
 *   id bigint | title text | priority '高'|'中'|'低' | completed boolean | created_at timestamptz
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();

export const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const DATA_FILE = path.join(process.cwd(), 'data', 'tasks.json');

let client = null;
function db() {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return client;
}

/** 数据库行（snake_case）→ 前端使用的结构（camelCase） */
function mapRow(row) {
  return {
    id: String(row.id),
    title: row.title,
    priority: row.priority,
    completed: row.completed,
    createdAt: row.created_at
  };
}

/* ---------------- 本地文件降级存储 ---------------- */

function readLocal() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(tasks) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

function seedLocal() {
  const now = Date.now();
  return [
    { id: '1', title: '完成数据库课程设计报告', priority: '高', completed: false, createdAt: new Date(now).toISOString() },
    { id: '2', title: '复习软件测试期末考点', priority: '中', completed: false, createdAt: new Date(now - 3600000).toISOString() },
    { id: '3', title: '整理本周实验数据', priority: '低', completed: true, createdAt: new Date(now - 7200000).toISOString() }
  ];
}

/* ---------------- 对外方法 ---------------- */

export async function listTasks(priority = '全部') {
  if (HAS_SUPABASE) {
    let query = db().from('tasks').select('*').order('created_at', { ascending: false });
    if (priority !== '全部') query = query.eq('priority', priority);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase 查询失败：${error.message}`);
    return (data || []).map(mapRow);
  }

  if (fs.existsSync(DATA_FILE)) {
    const tasks = readLocal();
    return tasks
      .filter((t) => priority === '全部' || t.priority === priority)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const seeded = seedLocal();
  writeLocal(seeded);
  return seeded.filter((t) => priority === '全部' || t.priority === priority);
}

export async function createTask({ title, priority }) {
  if (HAS_SUPABASE) {
    const { data, error } = await db()
      .from('tasks')
      .insert({ title, priority, completed: false })
      .select()
      .single();
    if (error) throw new Error(`Supabase 新增失败：${error.message}`);
    return mapRow(data);
  }

  const tasks = fs.existsSync(DATA_FILE) ? readLocal() : seedLocal();
  const nextId = String(
    tasks.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0) + 1
  );
  const task = {
    id: nextId,
    title,
    priority,
    completed: false,
    createdAt: new Date().toISOString()
  };
  writeLocal([...tasks, task]);
  return task;
}

export async function updateTask(id, patch) {
  const payload = {};
  if (typeof patch.completed === 'boolean') payload.completed = patch.completed;
  if (patch.title) payload.title = patch.title;
  if (patch.priority) payload.priority = patch.priority;

  if (HAS_SUPABASE) {
    const { data, error } = await db()
      .from('tasks')
      .update(payload)
      .eq('id', Number(id))
      .select()
      .maybeSingle();
    if (error) throw new Error(`Supabase 更新失败：${error.message}`);
    if (!data) throw new Error('任务不存在');
    return mapRow(data);
  }

  const tasks = readLocal();
  const target = tasks.find((t) => t.id === String(id));
  if (!target) throw new Error('任务不存在');
  Object.assign(target, payload);
  writeLocal(tasks);
  return target;
}

export async function deleteTask(id) {
  if (HAS_SUPABASE) {
    const { error } = await db().from('tasks').delete().eq('id', Number(id));
    if (error) throw new Error(`Supabase 删除失败：${error.message}`);
    return;
  }

  const tasks = readLocal();
  const index = tasks.findIndex((t) => t.id === String(id));
  if (index === -1) throw new Error('任务不存在');
  tasks.splice(index, 1);
  writeLocal(tasks);
}
