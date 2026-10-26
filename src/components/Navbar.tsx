import { NavLink, Link } from 'react-router'
import { LayoutDashboard, History, LibraryBig, BookOpen, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: '工作台', icon: LayoutDashboard, end: true },
  { to: '/history', label: '历史记录', icon: History, end: false },
  { to: '/kb', label: '题库', icon: LibraryBig, end: false },
  { to: '/guide', label: '指南', icon: BookOpen, end: false },
  { to: '/settings', label: '设置', icon: Settings2, end: false },
]

/**
 * 全站顶部导航。
 * 定位契约：sticky top-0 z-50，处于文档流中——页面无需补偿导航高度。
 * 个人工具无账号体系，不含登录/账户区域。
 */
export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-8 px-6 lg:px-10">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <img src="/logo.svg" alt="EasyCV" className="h-9 w-9 rounded-[10px] shadow-card" />
          <span className="flex flex-col leading-none">
            <span className="font-serif text-[18px] font-bold tracking-[0.01em] text-ink">
              EasyCV
            </span>
          </span>
        </Link>

        {/* 主导航 */}
        <nav className="flex flex-1 items-center gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-10 items-center gap-2 rounded-[10px] px-4 text-[14px] font-medium transition-colors duration-200',
                  isActive
                    ? 'bg-surface text-ink shadow-card'
                    : 'text-ink-2 hover:bg-surface/60 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* 激活项左侧 3px 赤陶竖条 */}
                  <span
                    className={cn(
                      'absolute left-1 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-full bg-terra transition-opacity duration-200',
                      isActive ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px]',
                      isActive ? 'text-terra' : 'text-ink-3 group-hover:text-ink-2',
                    )}
                    strokeWidth={1.75}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 右侧：模型状态胶囊（静态展示，后端嫁接后接配置） */}
        <div className="hidden shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 md:flex">
          <span className="h-2 w-2 rounded-full bg-pine" />
          <span className="font-mono text-[12px] text-ink-2">kimi-k3 · 推理 max</span>
        </div>
      </div>
    </header>
  )
}
