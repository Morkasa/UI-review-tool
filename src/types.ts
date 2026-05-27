export type CategoryId =
  | 'accessibility'
  | 'layout'
  | 'interaction'
  | 'content'
  | 'performance'

export type Severity = 'critical' | 'major' | 'minor'

export type FindingStatus = 'open' | 'resolved'

export type Viewport = 'desktop' | 'tablet' | 'mobile'

export interface ReviewCategory {
  id: CategoryId
  label: string
  shortLabel: string
  description: string
}

export interface ChecklistItem {
  id: string
  category: CategoryId
  label: string
  weight: number
}

export interface Finding {
  id: string
  title: string
  category: CategoryId
  severity: Severity
  status: FindingStatus
  owner: string
  viewport: Viewport
  note: string
  createdAt: string
}

export interface FindingDraft {
  title: string
  category: CategoryId
  severity: Severity
  owner: string
  note: string
}
