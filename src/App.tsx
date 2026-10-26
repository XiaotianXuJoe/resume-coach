import { Routes, Route } from 'react-router'
import Layout from '@/components/Layout'
import { Toaster } from '@/components/ui/sonner'
import Home from '@/pages/Home'
import History from '@/pages/History'
import HistoryDetail from '@/pages/HistoryDetail'
import Kb from '@/pages/Kb'
import Guide from '@/pages/Guide'
import Settings from '@/pages/Settings'

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="history" element={<History />} />
          <Route path="history/:id" element={<HistoryDetail />} />
          <Route path="kb" element={<Kb />} />
          <Route path="guide" element={<Guide />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}
