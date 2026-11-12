import './globals.css';

export const metadata = {
  title: '智能任务管理',
  description: '基于 Node.js + Supabase 的智能任务管理系统'
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
