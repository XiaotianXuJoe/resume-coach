import { describe, expect, it } from 'vitest'
import { parseRewrite, splitAnswerPoints } from './parsers'

describe('splitAnswerPoints', () => {
  it('按 1) 2) 3) 编号 + 中文分号拆分', () => {
    expect(splitAnswerPoints('1) 先讲项目背景；2) 再说技术选型；3) 最后谈结果')).toEqual([
      '先讲项目背景',
      '再说技术选型',
      '最后谈结果',
    ])
  })

  it('兼容 1. 编号与英文分号', () => {
    expect(splitAnswerPoints('1. JVM 内存模型; 2. GC 算法; 3. 类加载机制')).toEqual([
      'JVM 内存模型',
      'GC 算法',
      '类加载机制',
    ])
  })

  it('兼容（1）与 ① 编号', () => {
    expect(splitAnswerPoints('（1）第一点 （2）第二点')).toEqual(['第一点', '第二点'])
    expect(splitAnswerPoints('① 甲 ② 乙 ③ 丙')).toEqual(['甲', '乙', '丙'])
  })

  it('无编号时仅按分号/换行拆分', () => {
    expect(splitAnswerPoints('先说思路；再讲细节')).toEqual(['先说思路', '再讲细节'])
    expect(splitAnswerPoints('第一行\n第二行')).toEqual(['第一行', '第二行'])
  })

  it('单句不分拆，且不误伤小数', () => {
    expect(splitAnswerPoints('围绕项目展开即可')).toEqual(['围绕项目展开即可'])
    expect(splitAnswerPoints('熟悉 Java 8.0 特性')).toEqual(['熟悉 Java 8.0 特性'])
  })

  it('空文本返回空数组', () => {
    expect(splitAnswerPoints('   ')).toEqual([])
  })
})

describe('parseRewrite', () => {
  it('解析「修改前：xxx → 修改后：yyy」', () => {
    expect(parseRewrite('修改前：负责了后端开发 → 修改后：独立负责订单系统后端开发与联调')).toEqual({
      before: '负责了后端开发',
      after: '独立负责订单系统后端开发与联调',
    })
  })

  it('解析裸箭头「xxx → yyy」', () => {
    expect(parseRewrite('旧表述 → 新表述')).toEqual({ before: '旧表述', after: '新表述' })
  })

  it('解析无箭头但有成对标签（空白相隔）', () => {
    expect(parseRewrite('修改前：旧表述\n修改后：新表述')).toEqual({
      before: '旧表述',
      after: '新表述',
    })
  })

  it('不含该模式时返回 null（回退整段显示）', () => {
    expect(parseRewrite('把「熟悉」改成「精通」更稳妥')).toBeNull()
    expect(parseRewrite('')).toBeNull()
  })
})
