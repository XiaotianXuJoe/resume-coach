import { trpc } from '@/providers/trpc'
import type { ArchiveSummary } from '@contracts/types'

/**
 * 后端 `archives.*` 路由与 `history.renameVersion` 由后端代理并行交付。
 * tRPC 客户端运行时是动态代理，任意路径在运行时天然可达；
 * 这里仅按已定稿的接口签名做一次显式类型断言，
 * 避免并行开发期 AppRouter 类型滞后阻塞前端编译。后端合入后行为完全一致。
 */

interface MutationOptions<TVars> {
  onSuccess?: (data: unknown, vars: TVars) => void
  onError?: (err: { message: string }, vars: TVars) => void
}

interface MutationHandle<TVars> {
  mutate: (vars: TVars) => void
  isPending: boolean
}

interface QueryHandle<TData> {
  data: TData | undefined
  isLoading: boolean
  isError: boolean
  error: { message: string } | null
}

interface ArchivesBridge {
  archives: {
    list: { useQuery: () => QueryHandle<ArchiveSummary[]> }
    rename: {
      useMutation: (
        opts?: MutationOptions<{ id: number; name: string }>,
      ) => MutationHandle<{ id: number; name: string }>
    }
    remove: {
      useMutation: (opts?: MutationOptions<{ id: number }>) => MutationHandle<{ id: number }>
    }
  }
  history: {
    renameVersion: {
      useMutation: (
        opts?: MutationOptions<{ id: number; versionName: string }>,
      ) => MutationHandle<{ id: number; versionName: string }>
    }
  }
}

export const archiveApi = trpc as unknown as ArchivesBridge

type Utils = ReturnType<typeof trpc.useUtils>

/** 失效 archives.list 查询缓存（类型桥接） */
export function invalidateArchives(utils: Utils): void {
  void (utils as unknown as { archives: { list: { invalidate: () => Promise<unknown> } } })
    .archives.list.invalidate()
}
