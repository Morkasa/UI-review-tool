import type { ChecklistItem, Finding, ReviewCategory } from '../types'

export const reviewCategories: ReviewCategory[] = [
  {
    id: 'accessibility',
    label: 'Accessibility',
    shortLabel: 'A11y',
    description: 'Semantic structure, focus order, contrast, labels.',
  },
  {
    id: 'layout',
    label: 'Responsive layout',
    shortLabel: 'Layout',
    description: 'Viewport fit, text wrapping, spacing, density.',
  },
  {
    id: 'interaction',
    label: 'Interaction',
    shortLabel: 'Flow',
    description: 'States, controls, keyboard paths, feedback.',
  },
  {
    id: 'content',
    label: 'Content quality',
    shortLabel: 'Content',
    description: 'Copy clarity, hierarchy, empty states, labels.',
  },
  {
    id: 'performance',
    label: 'Performance',
    shortLabel: 'Perf',
    description: 'Render cost, assets, perceived loading, motion.',
  },
]

export const checklistItems: ChecklistItem[] = [
  {
    id: 'a11y-focus',
    category: 'accessibility',
    label: 'Keyboard focus is visible and follows the task order',
    weight: 10,
  },
  {
    id: 'a11y-labels',
    category: 'accessibility',
    label: 'Inputs, buttons, and icon actions expose clear labels',
    weight: 8,
  },
  {
    id: 'a11y-contrast',
    category: 'accessibility',
    label: 'Text, controls, and status colors meet contrast expectations',
    weight: 9,
  },
  {
    id: 'layout-mobile',
    category: 'layout',
    label: 'Primary workflow fits phone, tablet, and desktop widths',
    weight: 10,
  },
  {
    id: 'layout-overflow',
    category: 'layout',
    label: 'Long words, labels, and data do not overflow containers',
    weight: 8,
  },
  {
    id: 'layout-density',
    category: 'layout',
    label: 'Spacing supports scanning without hiding core information',
    weight: 7,
  },
  {
    id: 'interaction-states',
    category: 'interaction',
    label: 'Hover, active, disabled, loading, and error states are present',
    weight: 9,
  },
  {
    id: 'interaction-feedback',
    category: 'interaction',
    label: 'Actions provide confirmation or useful recovery paths',
    weight: 8,
  },
  {
    id: 'interaction-controls',
    category: 'interaction',
    label: 'Controls match their job: toggles, tabs, inputs, menus, sliders',
    weight: 7,
  },
  {
    id: 'content-hierarchy',
    category: 'content',
    label: 'Headings, labels, and values form a clear hierarchy',
    weight: 8,
  },
  {
    id: 'content-empty',
    category: 'content',
    label: 'Empty, partial, and failed states are specific and calm',
    weight: 7,
  },
  {
    id: 'content-domain',
    category: 'content',
    label: 'On-screen copy matches the user workflow and domain language',
    weight: 7,
  },
  {
    id: 'perf-assets',
    category: 'performance',
    label: 'Images and media are sized for their display context',
    weight: 8,
  },
  {
    id: 'perf-render',
    category: 'performance',
    label: 'Lists, charts, and expensive regions avoid unnecessary rerenders',
    weight: 8,
  },
  {
    id: 'perf-motion',
    category: 'performance',
    label: 'Motion is purposeful and respects reduced-motion preferences',
    weight: 6,
  },
]

export const seedFindings: Finding[] = [
  {
    id: 'finding-empty-state',
    title: 'Empty-state copy competes with the primary action',
    category: 'content',
    severity: 'major',
    status: 'open',
    owner: 'Design',
    viewport: 'desktop',
    note: 'Tighten the headline and keep the action label task-based.',
    createdAt: '2026-05-27',
  },
  {
    id: 'finding-focus-ring',
    title: 'Keyboard focus is too subtle on secondary controls',
    category: 'accessibility',
    severity: 'critical',
    status: 'open',
    owner: 'Frontend',
    viewport: 'tablet',
    note: 'Use a visible focus ring that clears adjacent borders.',
    createdAt: '2026-05-27',
  },
  {
    id: 'finding-card-density',
    title: 'Issue cards wrap unevenly at narrow widths',
    category: 'layout',
    severity: 'minor',
    status: 'resolved',
    owner: 'Frontend',
    viewport: 'mobile',
    note: 'Confirmed after changing the grid minimum size.',
    createdAt: '2026-05-27',
  },
]
