import { useEffect } from 'react'
import { Outlet } from 'react-router'
import Lenis from 'lenis'
import Navbar from './Navbar'
import Footer from './Footer'

/**
 * 全站布局壳（嵌套路由模式：渲染 <Outlet/>，App.tsx 中使用嵌套 <Route>）。
 * Navbar 为 sticky 文档流定位，内容区无需额外顶部内边距。
 * 全站挂 Lenis 平滑滚动（lerp 0.1，长滚动页体验）；prefers-reduced-motion 时关闭。
 */
export default function Layout() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.1 })
    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar />
      {/* 台灯暖光：主内容顶部极淡径向光晕 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-16 h-[420px]"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(185,85,46,0.06), transparent)',
        }}
      />
      <main className="relative flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
