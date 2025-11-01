import { NextRequest, NextResponse } from 'next/server'
import { CustomTagService } from '@/lib/database/custom-tags'

export async function GET() {
  try {
    const tags = await CustomTagService.findAll()
    return NextResponse.json({ tags })
  } catch (error) {
    console.error('获取自定义标签失败:', error)
    return NextResponse.json({ error: '获取自定义标签失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: '标签内容不能为空' }, { status: 400 })
    }

    const existing = await CustomTagService.findByContent(content.trim())
    if (existing) {
      return NextResponse.json({ error: '标签内容已存在' }, { status: 409 })
    }

    const tag = await CustomTagService.create(content.trim())
    return NextResponse.json({ tag }, { status: 201 })
  } catch (error) {
    console.error('创建自定义标签失败:', error)
    return NextResponse.json({ error: '创建自定义标签失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, content } = await request.json()

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: '缺少标签ID' }, { status: 400 })
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: '标签内容不能为空' }, { status: 400 })
    }

    const existing = await CustomTagService.findByContent(content.trim())
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: '标签内容已存在' }, { status: 409 })
    }

    const tag = await CustomTagService.update(id, content.trim())
    return NextResponse.json({ tag })
  } catch (error) {
    console.error('更新自定义标签失败:', error)
    return NextResponse.json({ error: '更新自定义标签失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少标签ID' }, { status: 400 })
    }

    await CustomTagService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除自定义标签失败:', error)
    return NextResponse.json({ error: '删除自定义标签失败' }, { status: 500 })
  }
}

