import { Link } from 'react-router'

/** 全站页脚（暖色、克制）。 */
export default function Footer() {
  return (
    <footer className="border-t border-line bg-panel/60">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row lg:px-10">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="" className="h-6 w-6 rounded-md" />
          <span className="font-serif text-[14px] font-bold text-ink">EasyCV</span>
        </div>
        <nav className="flex items-center gap-5 text-[13px] text-ink-2">
          <Link to="/" className="transition-colors hover:text-terra">工作台</Link>
          <Link to="/history" className="transition-colors hover:text-terra">历史记录</Link>
          <Link to="/kb" className="transition-colors hover:text-terra">题库</Link>
          <Link to="/guide" className="transition-colors hover:text-terra">使用指南</Link>
        </nav>
        <p className="font-mono text-[12px] text-ink-3">
          Powered by Kimi · 数据仅保存于本地
        </p>
      </div>
    </footer>
  )
}
