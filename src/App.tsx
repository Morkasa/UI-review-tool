import {
  Accessibility,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Download,
  Eye,
  Gauge,
  ImageUp,
  Layers3,
  Monitor,
  MousePointer2,
  Plus,
  Search,
  Smartphone,
  Tablet,
  Trash2,
  XCircle,
  Zap,
} from 'lucide-react'
import {
  useMemo,
  useReducer,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { checklistItems, reviewCategories, seedFindings } from './data/reviewData'
import { useDebounce } from './hooks/useDebounce'
import type {
  CategoryId,
  Finding,
  FindingDraft,
  Severity,
  Viewport,
} from './types'

type SeverityFilter = Severity | 'all'

interface ReviewState {
  targetUrl: string
  viewport: Viewport
  activeCategory: CategoryId
  checklist: Record<string, boolean>
  findings: Finding[]
  query: string
  severityFilter: SeverityFilter
  screenshotDataUrl: string
}

type ReviewAction =
  | { type: 'set-target'; value: string }
  | { type: 'set-viewport'; viewport: Viewport }
  | { type: 'set-active-category'; category: CategoryId }
  | { type: 'toggle-checklist-item'; id: string }
  | { type: 'set-query'; value: string }
  | { type: 'set-severity-filter'; severity: SeverityFilter }
  | { type: 'set-screenshot'; dataUrl: string }
  | { type: 'add-finding'; finding: Finding }
  | { type: 'toggle-finding-status'; id: string }
  | { type: 'remove-finding'; id: string }

interface ReviewMetrics {
  readiness: number
  checkedCount: number
  checklistCount: number
  openCount: number
  resolvedCount: number
  criticalOpen: number
  majorOpen: number
  statusLabel: string
}

const starterCompleted = new Set([
  'a11y-labels',
  'layout-mobile',
  'layout-density',
  'interaction-controls',
  'content-hierarchy',
  'perf-assets',
])

const initialState: ReviewState = {
  targetUrl: 'https://app.example.com/review',
  viewport: 'desktop',
  activeCategory: 'accessibility',
  checklist: Object.fromEntries(
    checklistItems.map((item) => [item.id, starterCompleted.has(item.id)]),
  ),
  findings: seedFindings,
  query: '',
  severityFilter: 'all',
  screenshotDataUrl: '',
}

function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case 'set-target':
      return { ...state, targetUrl: action.value }
    case 'set-viewport':
      return { ...state, viewport: action.viewport }
    case 'set-active-category':
      return { ...state, activeCategory: action.category }
    case 'toggle-checklist-item':
      return {
        ...state,
        checklist: {
          ...state.checklist,
          [action.id]: !state.checklist[action.id],
        },
      }
    case 'set-query':
      return { ...state, query: action.value }
    case 'set-severity-filter':
      return { ...state, severityFilter: action.severity }
    case 'set-screenshot':
      return { ...state, screenshotDataUrl: action.dataUrl }
    case 'add-finding':
      return { ...state, findings: [action.finding, ...state.findings] }
    case 'toggle-finding-status':
      return {
        ...state,
        findings: state.findings.map((finding) =>
          finding.id === action.id
            ? {
                ...finding,
                status: finding.status === 'open' ? 'resolved' : 'open',
              }
            : finding,
        ),
      }
    case 'remove-finding':
      return {
        ...state,
        findings: state.findings.filter((finding) => finding.id !== action.id),
      }
    default:
      return state
  }
}

export function App() {
  const [state, dispatch] = useReducer(reviewReducer, initialState)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  )
  const debouncedQuery = useDebounce(state.query, 180)

  const metrics = useMemo(
    () => getReviewMetrics(state.checklist, state.findings),
    [state.checklist, state.findings],
  )

  const activeChecklistItems = useMemo(
    () =>
      checklistItems.filter((item) => item.category === state.activeCategory),
    [state.activeCategory],
  )

  const filteredFindings = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase()

    return state.findings.filter((finding) => {
      const matchesSeverity =
        state.severityFilter === 'all' ||
        finding.severity === state.severityFilter
      const matchesQuery =
        query.length === 0 ||
        [finding.title, finding.note, finding.owner]
          .join(' ')
          .toLowerCase()
          .includes(query)

      return matchesSeverity && matchesQuery
    })
  }, [debouncedQuery, state.findings, state.severityFilter])

  const report = useMemo(
    () => buildReport(state, metrics),
    [metrics, state],
  )

  const handleScreenshotChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      dispatch({
        type: 'set-screenshot',
        dataUrl: typeof reader.result === 'string' ? reader.result : '',
      })
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ui-review-report.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(formatMarkdownReport(report))
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1800)
    } catch {
      setCopyState('failed')
      window.setTimeout(() => setCopyState('idle'), 2200)
    }
  }

  return (
    <main className="app">
      <PageHeader
        copyState={copyState}
        metrics={metrics}
        onCopyReport={handleCopyReport}
        onExportJson={handleExportJson}
      />

      <div className="workspace-grid">
        <aside className="side-stack" aria-label="Review setup">
          <TargetPanel
            screenshotAttached={Boolean(state.screenshotDataUrl)}
            targetUrl={state.targetUrl}
            onClearScreenshot={() =>
              dispatch({ type: 'set-screenshot', dataUrl: '' })
            }
            onScreenshotChange={handleScreenshotChange}
            onTargetChange={(value) =>
              dispatch({ type: 'set-target', value })
            }
          />
          <ScorePanel metrics={metrics} />
          <ViewportSwitch
            viewport={state.viewport}
            onChange={(viewport) =>
              dispatch({ type: 'set-viewport', viewport })
            }
          />
        </aside>

        <PreviewPanel
          activeCategory={state.activeCategory}
          screenshotDataUrl={state.screenshotDataUrl}
          viewport={state.viewport}
        />

        <section className="inspector-stack" aria-label="Review findings">
          <ChecklistPanel
            activeCategory={state.activeCategory}
            items={activeChecklistItems}
            selectedItems={state.checklist}
            onCategoryChange={(category) =>
              dispatch({ type: 'set-active-category', category })
            }
            onToggleItem={(id) =>
              dispatch({ type: 'toggle-checklist-item', id })
            }
          />
          <FindingsPanel
            activeCategory={state.activeCategory}
            findings={filteredFindings}
            query={state.query}
            severityFilter={state.severityFilter}
            viewport={state.viewport}
            onAddFinding={(finding) =>
              dispatch({ type: 'add-finding', finding })
            }
            onQueryChange={(value) =>
              dispatch({ type: 'set-query', value })
            }
            onRemoveFinding={(id) =>
              dispatch({ type: 'remove-finding', id })
            }
            onSeverityChange={(severity) =>
              dispatch({ type: 'set-severity-filter', severity })
            }
            onToggleStatus={(id) =>
              dispatch({ type: 'toggle-finding-status', id })
            }
          />
        </section>
      </div>
    </main>
  )
}

function PageHeader({
  copyState,
  metrics,
  onCopyReport,
  onExportJson,
}: {
  copyState: 'idle' | 'copied' | 'failed'
  metrics: ReviewMetrics
  onCopyReport: () => void
  onExportJson: () => void
}) {
  return (
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          <Eye size={22} strokeWidth={2.2} />
        </div>
        <div>
          <p className="eyebrow">Morkasa</p>
          <h1>UI Review Tool</h1>
        </div>
      </div>

      <div className="header-actions">
        <div className="readiness-pill" aria-label="Current readiness score">
          <Gauge size={18} aria-hidden="true" />
          <span>{metrics.readiness}%</span>
          <strong>{metrics.statusLabel}</strong>
        </div>
        <button className="button secondary" type="button" onClick={onCopyReport}>
          <ClipboardCheck size={17} aria-hidden="true" />
          {copyState === 'copied'
            ? 'Copied'
            : copyState === 'failed'
              ? 'Copy failed'
              : 'Copy report'}
        </button>
        <button className="button primary" type="button" onClick={onExportJson}>
          <Download size={17} aria-hidden="true" />
          Export JSON
        </button>
      </div>
    </header>
  )
}

function TargetPanel({
  screenshotAttached,
  targetUrl,
  onClearScreenshot,
  onScreenshotChange,
  onTargetChange,
}: {
  screenshotAttached: boolean
  targetUrl: string
  onClearScreenshot: () => void
  onScreenshotChange: (event: ChangeEvent<HTMLInputElement>) => void
  onTargetChange: (value: string) => void
}) {
  return (
    <section className="panel">
      <SectionHeading
        icon={<ClipboardList size={18} aria-hidden="true" />}
        kicker="Target"
        title="Review source"
      />
      <label className="field">
        <span>URL or screen name</span>
        <input
          type="text"
          value={targetUrl}
          onChange={(event) => onTargetChange(event.target.value)}
        />
      </label>

      <div className="upload-row">
        <label className="button secondary upload-button">
          <ImageUp size={17} aria-hidden="true" />
          Upload screenshot
          <input
            accept="image/*"
            className="visually-hidden"
            type="file"
            onChange={onScreenshotChange}
          />
        </label>
        <button
          className="icon-button"
          type="button"
          aria-label="Clear screenshot"
          title="Clear screenshot"
          disabled={!screenshotAttached}
          onClick={onClearScreenshot}
        >
          <XCircle size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

function ScorePanel({ metrics }: { metrics: ReviewMetrics }) {
  return (
    <section className="panel">
      <SectionHeading
        icon={<Gauge size={18} aria-hidden="true" />}
        kicker="Readiness"
        title="Review score"
      />

      <div
        className="score-ring"
        style={{ '--score': `${metrics.readiness}%` } as React.CSSProperties}
        aria-label={`Readiness score ${metrics.readiness} percent`}
      >
        <strong>{metrics.readiness}</strong>
        <span>percent</span>
      </div>

      <div className="metric-grid">
        <Metric label="Checklist" value={`${metrics.checkedCount}/${metrics.checklistCount}`} />
        <Metric label="Open" value={String(metrics.openCount)} tone="warn" />
        <Metric label="Resolved" value={String(metrics.resolvedCount)} tone="good" />
        <Metric label="Critical" value={String(metrics.criticalOpen)} tone="danger" />
      </div>
    </section>
  )
}

function ViewportSwitch({
  viewport,
  onChange,
}: {
  viewport: Viewport
  onChange: (viewport: Viewport) => void
}) {
  const options: Array<{ id: Viewport; label: string; icon: React.ReactNode }> = [
    { id: 'desktop', label: 'Desktop', icon: <Monitor size={18} /> },
    { id: 'tablet', label: 'Tablet', icon: <Tablet size={18} /> },
    { id: 'mobile', label: 'Mobile', icon: <Smartphone size={18} /> },
  ]

  return (
    <section className="panel">
      <SectionHeading
        icon={<Layers3 size={18} aria-hidden="true" />}
        kicker="Viewport"
        title="Review frame"
      />
      <div className="segmented-control" role="group" aria-label="Viewport">
        {options.map((option) => (
          <button
            key={option.id}
            className={option.id === viewport ? 'active' : ''}
            type="button"
            aria-pressed={option.id === viewport}
            onClick={() => onChange(option.id)}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function PreviewPanel({
  activeCategory,
  screenshotDataUrl,
  viewport,
}: {
  activeCategory: CategoryId
  screenshotDataUrl: string
  viewport: Viewport
}) {
  const category = getCategory(activeCategory)

  return (
    <section className="preview-shell" aria-label="Screenshot review preview">
      <div className="preview-toolbar">
        <SectionHeading
          icon={getCategoryIcon(activeCategory)}
          kicker={category.label}
          title="Visual pass"
        />
        <span className={`viewport-badge ${viewport}`}>{viewport}</span>
      </div>

      <div className={`device-frame ${viewport}`}>
        {screenshotDataUrl ? (
          <img
            alt="Uploaded UI screenshot for review"
            src={screenshotDataUrl}
          />
        ) : (
          <div className="mock-screen" aria-label="Default UI review preview">
            <div className="mock-bar" />
            <div className="mock-content">
              <div className="mock-nav" />
              <div className="mock-main">
                <span className="mock-kicker">{category.shortLabel}</span>
                <strong>Review target</strong>
                <div className="mock-line wide" />
                <div className="mock-line" />
                <div className="mock-actions">
                  <span />
                  <span />
                </div>
              </div>
              <div className="mock-table">
                {Array.from({ length: 5 }, (_, index) => (
                  <div className="mock-row" key={index}>
                    <span />
                    <span />
                    <span />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function ChecklistPanel({
  activeCategory,
  items,
  selectedItems,
  onCategoryChange,
  onToggleItem,
}: {
  activeCategory: CategoryId
  items: typeof checklistItems
  selectedItems: Record<string, boolean>
  onCategoryChange: (category: CategoryId) => void
  onToggleItem: (id: string) => void
}) {
  return (
    <section className="panel">
      <SectionHeading
        icon={<CheckCircle2 size={18} aria-hidden="true" />}
        kicker="Checklist"
        title="Review criteria"
      />
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
      />
      <div
        className="checklist"
        id="checklist-panel"
        role="tabpanel"
        aria-label={`${getCategory(activeCategory).label} checklist`}
      >
        {items.map((item) => (
          <label className="check-row" key={item.id}>
            <input
              type="checkbox"
              checked={selectedItems[item.id]}
              onChange={() => onToggleItem(item.id)}
            />
            <span>{item.label}</span>
            <em>{item.weight}</em>
          </label>
        ))}
      </div>
    </section>
  )
}

function CategoryTabs({
  activeCategory,
  onCategoryChange,
}: {
  activeCategory: CategoryId
  onCategoryChange: (category: CategoryId) => void
}) {
  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    category: CategoryId,
  ) => {
    const currentIndex = reviewCategories.findIndex((item) => item.id === category)
    const offset =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0

    if (offset === 0) {
      return
    }

    event.preventDefault()
    const nextIndex =
      (currentIndex + offset + reviewCategories.length) % reviewCategories.length
    const nextCategory = reviewCategories[nextIndex].id
    onCategoryChange(nextCategory)
    window.requestAnimationFrame(() => {
      document.getElementById(`tab-${nextCategory}`)?.focus()
    })
  }

  return (
    <div className="tab-list" role="tablist" aria-label="Review categories">
      {reviewCategories.map((category) => (
        <button
          key={category.id}
          className={category.id === activeCategory ? 'active' : ''}
          id={`tab-${category.id}`}
          role="tab"
          type="button"
          aria-controls="checklist-panel"
          aria-selected={category.id === activeCategory}
          onClick={() => onCategoryChange(category.id)}
          onKeyDown={(event) => handleKeyDown(event, category.id)}
        >
          {getCategoryIcon(category.id)}
          <span>{category.shortLabel}</span>
        </button>
      ))}
    </div>
  )
}

function FindingsPanel({
  activeCategory,
  findings,
  query,
  severityFilter,
  viewport,
  onAddFinding,
  onQueryChange,
  onRemoveFinding,
  onSeverityChange,
  onToggleStatus,
}: {
  activeCategory: CategoryId
  findings: Finding[]
  query: string
  severityFilter: SeverityFilter
  viewport: Viewport
  onAddFinding: (finding: Finding) => void
  onQueryChange: (value: string) => void
  onRemoveFinding: (id: string) => void
  onSeverityChange: (severity: SeverityFilter) => void
  onToggleStatus: (id: string) => void
}) {
  return (
    <section className="panel findings-panel">
      <SectionHeading
        icon={<AlertTriangle size={18} aria-hidden="true" />}
        kicker="Findings"
        title="Issue queue"
      />

      <div className="filter-row">
        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <span className="visually-hidden">Search findings</span>
          <input
            type="search"
            value={query}
            placeholder="Search findings"
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
        <label className="select-field">
          <span className="visually-hidden">Filter by severity</span>
          <select
            value={severityFilter}
            onChange={(event) =>
              onSeverityChange(event.target.value as SeverityFilter)
            }
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>
        </label>
      </div>

      <AddFindingForm
        activeCategory={activeCategory}
        viewport={viewport}
        onAddFinding={onAddFinding}
      />

      <div className="finding-list" aria-live="polite">
        {findings.length > 0 ? (
          findings.map((finding) => (
            <article className="finding-card" key={finding.id}>
              <div className="finding-main">
                <div>
                  <div className="finding-meta">
                    <span className={`severity ${finding.severity}`}>
                      {finding.severity}
                    </span>
                    <span>{getCategory(finding.category).shortLabel}</span>
                    <span>{finding.viewport}</span>
                  </div>
                  <h3>{finding.title}</h3>
                  <p>{finding.note}</p>
                </div>
                <div className="finding-actions">
                  <button
                    className={`status-button ${finding.status}`}
                    type="button"
                    onClick={() => onToggleStatus(finding.id)}
                  >
                    {finding.status === 'open' ? (
                      <AlertTriangle size={16} aria-hidden="true" />
                    ) : (
                      <CheckCircle2 size={16} aria-hidden="true" />
                    )}
                    {finding.status}
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Remove finding: ${finding.title}`}
                    title="Remove finding"
                    onClick={() => onRemoveFinding(finding.id)}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <footer>
                <span>{finding.owner}</span>
                <time dateTime={finding.createdAt}>{finding.createdAt}</time>
              </footer>
            </article>
          ))
        ) : (
          <div className="empty-state compact">
            <strong>No matching findings</strong>
          </div>
        )}
      </div>
    </section>
  )
}

function AddFindingForm({
  activeCategory,
  viewport,
  onAddFinding,
}: {
  activeCategory: CategoryId
  viewport: Viewport
  onAddFinding: (finding: Finding) => void
}) {
  const [draft, setDraft] = useState<FindingDraft>({
    title: '',
    category: activeCategory,
    severity: 'major',
    owner: 'Frontend',
    note: '',
  })
  const [error, setError] = useState('')

  const updateDraft = <Key extends keyof FindingDraft>(
    key: Key,
    value: FindingDraft[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = draft.title.trim()

    if (title.length < 4) {
      setError('Use a specific finding title.')
      return
    }

    onAddFinding({
      id: createId(),
      title,
      category: draft.category,
      severity: draft.severity,
      status: 'open',
      owner: draft.owner.trim() || 'Unassigned',
      viewport,
      note: draft.note.trim() || 'No note added.',
      createdAt: new Date().toISOString().slice(0, 10),
    })

    setDraft({
      title: '',
      category: activeCategory,
      severity: 'major',
      owner: draft.owner,
      note: '',
    })
    setError('')
  }

  return (
    <form className="add-finding" onSubmit={handleSubmit}>
      <div className="field-grid">
        <label className="field wide">
          <span>Finding title</span>
          <input
            type="text"
            value={draft.title}
            onChange={(event) => updateDraft('title', event.target.value)}
          />
        </label>
        <label className="field">
          <span>Category</span>
          <select
            value={draft.category}
            onChange={(event) =>
              updateDraft('category', event.target.value as CategoryId)
            }
          >
            {reviewCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Severity</span>
          <select
            value={draft.severity}
            onChange={(event) =>
              updateDraft('severity', event.target.value as Severity)
            }
          >
            <option value="critical">Critical</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>
        </label>
        <label className="field">
          <span>Owner</span>
          <input
            type="text"
            value={draft.owner}
            onChange={(event) => updateDraft('owner', event.target.value)}
          />
        </label>
        <label className="field wide">
          <span>Note</span>
          <textarea
            rows={3}
            value={draft.note}
            onChange={(event) => updateDraft('note', event.target.value)}
          />
        </label>
      </div>
      <div className="form-footer">
        <span className="form-error" role="alert">
          {error}
        </span>
        <button className="button primary" type="submit">
          <Plus size={17} aria-hidden="true" />
          Add finding
        </button>
      </div>
    </form>
  )
}

function SectionHeading({
  icon,
  kicker,
  title,
}: {
  icon: React.ReactNode
  kicker: string
  title: string
}) {
  return (
    <div className="section-heading">
      <div className="section-icon">{icon}</div>
      <div>
        <span>{kicker}</span>
        <h2>{title}</h2>
      </div>
    </div>
  )
}

function Metric({
  label,
  tone = 'neutral',
  value,
}: {
  label: string
  tone?: 'neutral' | 'good' | 'warn' | 'danger'
  value: string
}) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function getReviewMetrics(
  checklist: Record<string, boolean>,
  findings: Finding[],
): ReviewMetrics {
  const totalWeight = checklistItems.reduce((sum, item) => sum + item.weight, 0)
  const checkedWeight = checklistItems.reduce(
    (sum, item) => sum + (checklist[item.id] ? item.weight : 0),
    0,
  )
  const checklistRatio = checkedWeight / totalWeight
  const openFindings = findings.filter((finding) => finding.status === 'open')
  const resolvedCount = findings.length - openFindings.length
  const findingRatio = findings.length === 0 ? 1 : resolvedCount / findings.length
  const criticalOpen = openFindings.filter(
    (finding) => finding.severity === 'critical',
  ).length
  const majorOpen = openFindings.filter(
    (finding) => finding.severity === 'major',
  ).length

  const rawScore =
    checklistRatio * 72 + findingRatio * 28 - criticalOpen * 8 - majorOpen * 3
  const readiness = Math.max(0, Math.min(100, Math.round(rawScore)))

  return {
    readiness,
    checkedCount: Object.values(checklist).filter(Boolean).length,
    checklistCount: checklistItems.length,
    openCount: openFindings.length,
    resolvedCount,
    criticalOpen,
    majorOpen,
    statusLabel:
      criticalOpen > 0
        ? 'Needs repair'
        : readiness >= 90
          ? 'Ready'
          : readiness >= 70
            ? 'Close'
            : 'At risk',
  }
}

function buildReport(state: ReviewState, metrics: ReviewMetrics) {
  return {
    targetUrl: state.targetUrl,
    viewport: state.viewport,
    activeCategory: state.activeCategory,
    generatedAt: new Date().toISOString(),
    screenshotAttached: Boolean(state.screenshotDataUrl),
    metrics,
    checklist: checklistItems.map((item) => ({
      ...item,
      checked: state.checklist[item.id],
    })),
    findings: state.findings,
  }
}

function formatMarkdownReport(report: ReturnType<typeof buildReport>) {
  const openFindings = report.findings.filter((finding) => finding.status === 'open')
  const checklistDone = report.checklist.filter((item) => item.checked)

  return [
    `# UI Review Report`,
    ``,
    `Target: ${report.targetUrl}`,
    `Viewport: ${report.viewport}`,
    `Readiness: ${report.metrics.readiness}% (${report.metrics.statusLabel})`,
    `Checklist: ${checklistDone.length}/${report.checklist.length}`,
    `Open findings: ${openFindings.length}`,
    ``,
    `## Open Findings`,
    ...openFindings.map(
      (finding) =>
        `- [${finding.severity}] ${finding.title} (${getCategory(finding.category).label}, ${finding.owner})`,
    ),
  ].join('\n')
}

function getCategory(id: CategoryId) {
  return reviewCategories.find((category) => category.id === id) ?? reviewCategories[0]
}

function getCategoryIcon(category: CategoryId) {
  const iconProps = { size: 18, 'aria-hidden': true as const }

  switch (category) {
    case 'accessibility':
      return <Accessibility {...iconProps} />
    case 'layout':
      return <Layers3 {...iconProps} />
    case 'interaction':
      return <MousePointer2 {...iconProps} />
    case 'content':
      return <ClipboardList {...iconProps} />
    case 'performance':
      return <Zap {...iconProps} />
    default:
      return <CheckCircle2 {...iconProps} />
  }
}

function createId() {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `finding-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
