export interface Snippet {
  id: string
  title: string
  description?: string
  code: string
  language: string
  tags: string[]
  author: {
    name: string
    initials: string
    color: string
  }
  updatedAt: string
}