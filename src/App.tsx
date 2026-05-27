import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Columns3,
  Copy,
  Download,
  Eye,
  FileImage,
  Globe2,
  ImageUp,
  Monitor,
  Palette,
  Ruler,
  ScanSearch,
  SlidersHorizontal,
  Smartphone,
  Tablet,
  Type,
  XCircle,
} from 'lucide-react'
import {
  useMemo,
  useReducer,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import type { Viewport } from './types'

type CanvasSide = 'design' | 'live'
type ComparisonCategory = 'typography' | 'spacing' | 'color' | 'layout'
type ComparisonStatus = 'pass' | 'review' | 'fail'

interface SourceState {
  label: string
  url: string
  imageDataUrl: string
}

interface ComparisonItem {
  id: string
  category: ComparisonCategory
  label: string
  designValue: string
  liveValue: string
  delta: string
  status: ComparisonStatus
}

interface CompareState {
  design: SourceState
  live: SourceState
  viewport: Viewport
  zoom: number
  guidesVisible: boolean
  selectedCategory: ComparisonCategory | 'all'
  items: ComparisonItem[]
}

type CompareAction =
  | { type: 'set-label'; side: CanvasSide; value: string }
  | { type: 'set-url'; side: CanvasSide; value: string }
  | { type: 'set-image'; side: CanvasSide; dataUrl: string }
  | { type: 'clear-image'; side: CanvasSide }
  | { type: 'set-viewport'; viewport: Viewport }
  | { type: 'set-zoom'; zoom: number }
  | { type: 'toggle-guides' }
  | { type: 'set-category'; category: ComparisonCategory | 'all' }

interface CompareMetrics {
  matchScore: number
  passCount: number
  reviewCount: number
  failCount: number
  sourceState: 'empty' | 'partial' | 'ready'
}

const comparisonItems: ComparisonItem[] = [
  {
    id: 'font-heading',
    category: 'typography',
    label: 'Primary heading',
    designValue: '32px / 700 / -',
    liveValue: '30px / 700 / -',
    delta: '-2px',
    status: 'review',
  },
  {
    id: 'font-body',
    category: 'typography',
    label: 'Body text',
    designValue: '16px / 400 / 24px',
    liveValue: '16px / 400 / 24px',
    delta: '0',
    status: 'pass',
  },
  {
    id: 'gap-section',
    category: 'spacing',
    label: 'Section gap',
    designValue: '32px',
    liveValue: '24px',
    delta: '-8px',
    status: 'fail',
  },
  {
    id: 'padding-card',
    category: 'spacing',
    label: 'Panel padding',
    designValue: '20px',
    liveValue: '18px',
    delta: '-2px',
    status: 'review',
  },
  {
    id: 'color-primary',
    category: 'color',
    label: 'Primary action',
    designValue: '#147D68',
    liveValue: '#15806A',
    delta: 'Delta E 1.8',
    status: 'pass',
  },
  {
    id: 'color-muted',
    category: 'color',
    label: 'Muted text',
    designValue: '#657168',
    liveValue: '#737D76',
    delta: 'Delta E 6.4',
    status: 'review',
  },
  {
    id: 'width-main',
    category: 'layout',
    label: 'Main content width',
    designValue: '760px',
    liveValue: '744px',
    delta: '-16px',
    status: 'review',
  },
  {
    id: 'radius-panel',
    category: 'layout',
    label: 'Panel radius',
    designValue: '8px',
    liveValue: '8px',
    delta: '0',
    status: 'pass',
  },
]

const initialState: CompareState = {
  design: {
    label: 'Design draft',
    url: '',
    imageDataUrl: '',
  },
  live: {
    label: 'Live build',
    url: '',
    imageDataUrl: '',
  },
  viewport: 'desktop',
  zoom: 82,
  guidesVisible: true,
  selectedCategory: 'all',
  items: comparisonItems,
}

function compareReducer(state: CompareState, action: CompareAction): CompareState {
  switch (action.type) {
    case 'set-label':
      return {
        ...state,
        [action.side]: {
          ...state[action.side],
          label: action.value,
        },
      }
    case 'set-url':
      return {
        ...state,
        [action.side]: {
          ...state[action.side],
          url: action.value,
        },
      }
    case 'set-image':
      return {
        ...state,
        [action.side]: {
          ...state[action.side],
          imageDataUrl: action.dataUrl,
        },
      }
    case 'clear-image':
      return {
        ...state,
        [action.side]: {
          ...state[action.side],
          imageDataUrl: '',
        },
      }
    case 'set-viewport':
      return { ...state, viewport: action.viewport }
    case 'set-zoom':
      return { ...state, zoom: action.zoom }
    case 'toggle-guides':
      return { ...state, guidesVisible: !state.guidesVisible }
    case 'set-category':
      return { ...state, selectedCategory: action.category }
    default:
      return state
  }
}

export function App() {
  const [state, dispatch] = useReducer(compareReducer, initialState)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  )

  const metrics = useMemo(() => getCompareMetrics(state), [state])
  const visibleItems = useMemo(
    () =>
      state.items.filter(
        (item) =>
          state.selectedCategory === 'all' ||
          item.category === state.selectedCategory,
      ),
    [state.items, state.selectedCategory],
  )
  const report = useMemo(
    () => ({
      generatedAt: new Date().toISOString(),
      design: {
        label: state.design.label,
        url: state.design.url,
        hasScreenshot: Boolean(state.design.imageDataUrl),
      },
      live: {
        label: state.live.label,
        url: state.live.url,
        hasScreenshot: Boolean(state.live.imageDataUrl),
      },
      viewport: state.viewport,
      zoom: state.zoom,
      metrics,
      items: state.items,
    }),
    [metrics, state],
  )

  const handleImageChange =
    (side: CanvasSide) => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file || !file.type.startsWith('image/')) {
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        dispatch({
          type: 'set-image',
          side,
          dataUrl: typeof reader.result === 'string' ? reader.result : '',
        })
      }
      reader.readAsDataURL(file)
      event.target.value = ''
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

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ui-comparison-report.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="app compare-app">
      <PageHeader
        copyState={copyState}
        metrics={metrics}
        onCopyReport={handleCopyReport}
        onExportJson={handleExportJson}
      />

      <section className="compare-toolbar" aria-label="Comparison controls">
        <ViewportSwitch
          viewport={state.viewport}
          onChange={(viewport) =>
            dispatch({ type: 'set-viewport', viewport })
          }
        />
        <label className="range-field">
          <span>Zoom</span>
          <input
            type="range"
            min="56"
            max="120"
            step="2"
            value={state.zoom}
            onChange={(event) =>
              dispatch({ type: 'set-zoom', zoom: Number(event.target.value) })
            }
          />
          <strong>{state.zoom}%</strong>
        </label>
        <button
          className="button secondary"
          type="button"
          aria-pressed={state.guidesVisible}
          onClick={() => dispatch({ type: 'toggle-guides' })}
        >
          <Ruler size={17} aria-hidden="true" />
          Guides
        </button>
      </section>

      <section className="canvas-grid" aria-label="Design and live comparison">
        <ComparisonCanvas
          imageDataUrl={state.design.imageDataUrl}
          label={state.design.label}
          side="design"
          url={state.design.url}
          viewport={state.viewport}
          zoom={state.zoom}
          guidesVisible={state.guidesVisible}
          onClearImage={() => dispatch({ type: 'clear-image', side: 'design' })}
          onImageChange={handleImageChange('design')}
          onLabelChange={(value) =>
            dispatch({ type: 'set-label', side: 'design', value })
          }
          onUrlChange={(value) =>
            dispatch({ type: 'set-url', side: 'design', value })
          }
        />
        <ComparisonCanvas
          imageDataUrl={state.live.imageDataUrl}
          label={state.live.label}
          side="live"
          url={state.live.url}
          viewport={state.viewport}
          zoom={state.zoom}
          guidesVisible={state.guidesVisible}
          onClearImage={() => dispatch({ type: 'clear-image', side: 'live' })}
          onImageChange={handleImageChange('live')}
          onLabelChange={(value) =>
            dispatch({ type: 'set-label', side: 'live', value })
          }
          onUrlChange={(value) =>
            dispatch({ type: 'set-url', side: 'live', value })
          }
        />
      </section>

      <section className="analysis-grid">
        <SummaryPanel metrics={metrics} />
        <ComparisonPanel
          items={visibleItems}
          selectedCategory={state.selectedCategory}
          onCategoryChange={(category) =>
            dispatch({ type: 'set-category', category })
          }
        />
      </section>
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
  metrics: CompareMetrics
  onCopyReport: () => void
  onExportJson: () => void
}) {
  return (
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          <Columns3 size={22} strokeWidth={2.2} />
        </div>
        <div>
          <p className="eyebrow">Morkasa</p>
          <h1>Design Compare Canvas</h1>
        </div>
      </div>

      <div className="header-actions">
        <div className="match-pill" aria-label="Current visual match score">
          <ScanSearch size={18} aria-hidden="true" />
          <span>{metrics.matchScore}%</span>
          <strong>{getSourceLabel(metrics.sourceState)}</strong>
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

function ComparisonCanvas({
  guidesVisible,
  imageDataUrl,
  label,
  onClearImage,
  onImageChange,
  onLabelChange,
  onUrlChange,
  side,
  url,
  viewport,
  zoom,
}: {
  guidesVisible: boolean
  imageDataUrl: string
  label: string
  onClearImage: () => void
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void
  onLabelChange: (value: string) => void
  onUrlChange: (value: string) => void
  side: CanvasSide
  url: string
  viewport: Viewport
  zoom: number
}) {
  const normalizedUrl = normalizeUrl(url)
  const canEmbedUrl = side === 'live' && normalizedUrl && !imageDataUrl

  return (
    <article className="canvas-panel">
      <div className="canvas-head">
        <SectionHeading
          icon={side === 'design' ? <FileImage size={18} /> : <Globe2 size={18} />}
          kicker={side === 'design' ? 'Design draft' : 'Live build'}
          title={label}
        />
        <span className={`source-badge ${side}`}>{side}</span>
      </div>

      <div className="source-controls">
        <label className="field">
          <span>Name</span>
          <input
            type="text"
            value={label}
            onChange={(event) => onLabelChange(event.target.value)}
          />
        </label>
        <label className="field">
          <span>{side === 'design' ? 'Figma or file note' : 'Production URL'}</span>
          <input
            type="text"
            value={url}
            placeholder={side === 'design' ? 'Figma frame, version, file name' : 'https://'}
            onChange={(event) => onUrlChange(event.target.value)}
          />
        </label>
        <div className="upload-row">
          <label className="button secondary upload-button">
            <ImageUp size={17} aria-hidden="true" />
            Upload image
            <input
              accept="image/*"
              className="visually-hidden"
              type="file"
              onChange={onImageChange}
            />
          </label>
          <button
            className="icon-button"
            type="button"
            aria-label={`Clear ${side} image`}
            title={`Clear ${side} image`}
            disabled={!imageDataUrl}
            onClick={onClearImage}
          >
            <XCircle size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={`canvas-stage ${viewport}`}>
        <div
          className={`review-frame ${guidesVisible ? 'with-guides' : ''}`}
          style={{ '--zoom': zoom / 100 } as React.CSSProperties}
        >
          {imageDataUrl ? (
            <img alt={`${label} screenshot`} src={imageDataUrl} />
          ) : canEmbedUrl ? (
            <iframe
              title={`${label} preview`}
              src={normalizedUrl}
              sandbox="allow-scripts allow-forms allow-same-origin"
            />
          ) : (
            <CanvasPlaceholder side={side} />
          )}
          {guidesVisible && <GuideOverlay />}
        </div>
      </div>
    </article>
  )
}

function CanvasPlaceholder({ side }: { side: CanvasSide }) {
  return (
    <div className={`canvas-placeholder ${side}`} aria-label={`${side} placeholder`}>
      <div className="placeholder-topline">
        <span />
        <span />
        <span />
      </div>
      <div className="placeholder-body">
        <div className="placeholder-sidebar" />
        <div className="placeholder-content">
          <span className="placeholder-kicker">
            {side === 'design' ? 'Spec' : 'Build'}
          </span>
          <strong>{side === 'design' ? 'Design surface' : 'Live surface'}</strong>
          <i />
          <i />
          <div className="placeholder-actions">
            <span />
            <span />
          </div>
        </div>
        <div className="placeholder-list">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index}>
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GuideOverlay() {
  return (
    <div className="guide-overlay" aria-hidden="true">
      <span className="guide vertical left" />
      <span className="guide vertical right" />
      <span className="guide horizontal top" />
      <span className="guide horizontal bottom" />
    </div>
  )
}

function ViewportSwitch({
  viewport,
  onChange,
}: {
  viewport: Viewport
  onChange: (viewport: Viewport) => void
}) {
  const options: Array<{ id: Viewport; label: string; icon: ReactNode }> = [
    { id: 'desktop', label: 'Desktop', icon: <Monitor size={18} /> },
    { id: 'tablet', label: 'Tablet', icon: <Tablet size={18} /> },
    { id: 'mobile', label: 'Mobile', icon: <Smartphone size={18} /> },
  ]

  return (
    <div className="segmented-control viewport-control" role="group" aria-label="Viewport">
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
  )
}

function SummaryPanel({ metrics }: { metrics: CompareMetrics }) {
  return (
    <section className="panel summary-panel">
      <SectionHeading
        icon={<Eye size={18} aria-hidden="true" />}
        kicker="Snapshot"
        title="Comparison status"
      />
      <div
        className="score-ring"
        style={{ '--score': `${metrics.matchScore}%` } as React.CSSProperties}
        aria-label={`Visual match score ${metrics.matchScore} percent`}
      >
        <strong>{metrics.matchScore}</strong>
        <span>match</span>
      </div>
      <div className="metric-grid">
        <Metric label="Pass" tone="good" value={String(metrics.passCount)} />
        <Metric label="Review" tone="warn" value={String(metrics.reviewCount)} />
        <Metric label="Fail" tone="danger" value={String(metrics.failCount)} />
        <Metric label="Sources" value={getSourceLabel(metrics.sourceState)} />
      </div>
    </section>
  )
}

function ComparisonPanel({
  items,
  onCategoryChange,
  selectedCategory,
}: {
  items: ComparisonItem[]
  onCategoryChange: (category: ComparisonCategory | 'all') => void
  selectedCategory: ComparisonCategory | 'all'
}) {
  const categories: Array<{
    id: ComparisonCategory | 'all'
    label: string
    icon: ReactNode
  }> = [
    { id: 'all', label: 'All', icon: <SlidersHorizontal size={17} /> },
    { id: 'typography', label: 'Type', icon: <Type size={17} /> },
    { id: 'spacing', label: 'Space', icon: <Ruler size={17} /> },
    { id: 'color', label: 'Color', icon: <Palette size={17} /> },
    { id: 'layout', label: 'Layout', icon: <Columns3 size={17} /> },
  ]

  return (
    <section className="panel comparison-panel">
      <SectionHeading
        icon={<ScanSearch size={18} aria-hidden="true" />}
        kicker="Diff queue"
        title="Parameters to compare"
      />
      <div className="tab-list compact" role="tablist" aria-label="Comparison categories">
        {categories.map((category) => (
          <button
            key={category.id}
            className={selectedCategory === category.id ? 'active' : ''}
            role="tab"
            type="button"
            aria-selected={selectedCategory === category.id}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.icon}
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      <div className="diff-table" role="table" aria-label="Comparison differences">
        <div className="diff-row header" role="row">
          <span role="columnheader">Parameter</span>
          <span role="columnheader">Design</span>
          <span role="columnheader">Live</span>
          <span role="columnheader">Delta</span>
          <span role="columnheader">Status</span>
        </div>
        {items.map((item) => (
          <div className="diff-row" role="row" key={item.id}>
            <span role="cell">
              <strong>{item.label}</strong>
              <em>{item.category}</em>
            </span>
            <span role="cell">{item.designValue}</span>
            <span role="cell">{item.liveValue}</span>
            <span role="cell">{item.delta}</span>
            <span role="cell">
              <StatusPill status={item.status} />
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function SectionHeading({
  icon,
  kicker,
  title,
}: {
  icon: ReactNode
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

function StatusPill({ status }: { status: ComparisonStatus }) {
  const icon =
    status === 'pass' ? (
      <CheckCircle2 size={15} aria-hidden="true" />
    ) : status === 'fail' ? (
      <XCircle size={15} aria-hidden="true" />
    ) : (
      <AlertTriangle size={15} aria-hidden="true" />
    )

  return (
    <span className={`status-pill ${status}`}>
      {icon}
      {status}
    </span>
  )
}

function getCompareMetrics(state: CompareState): CompareMetrics {
  const passCount = state.items.filter((item) => item.status === 'pass').length
  const reviewCount = state.items.filter((item) => item.status === 'review').length
  const failCount = state.items.filter((item) => item.status === 'fail').length
  const sourceCount = [
    Boolean(state.design.imageDataUrl || state.design.url.trim()),
    Boolean(state.live.imageDataUrl || state.live.url.trim()),
  ].filter(Boolean).length
  const matchScore = Math.max(0, 100 - reviewCount * 5 - failCount * 14)

  return {
    matchScore,
    passCount,
    reviewCount,
    failCount,
    sourceState:
      sourceCount === 2 ? 'ready' : sourceCount === 1 ? 'partial' : 'empty',
  }
}

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

function getSourceLabel(state: CompareMetrics['sourceState']) {
  switch (state) {
    case 'ready':
      return 'Ready'
    case 'partial':
      return 'Partial'
    default:
      return 'No sources'
  }
}

function formatMarkdownReport(report: {
  generatedAt: string
  design: { label: string; url: string; hasScreenshot: boolean }
  live: { label: string; url: string; hasScreenshot: boolean }
  viewport: Viewport
  zoom: number
  metrics: CompareMetrics
  items: ComparisonItem[]
}) {
  const flagged = report.items.filter((item) => item.status !== 'pass')

  return [
    '# UI Comparison Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Design: ${report.design.label}${report.design.url ? ` (${report.design.url})` : ''}`,
    `Live: ${report.live.label}${report.live.url ? ` (${report.live.url})` : ''}`,
    `Viewport: ${report.viewport}`,
    `Match: ${report.metrics.matchScore}%`,
    '',
    '## Flagged Differences',
    ...flagged.map(
      (item) =>
        `- [${item.status}] ${item.label}: design ${item.designValue}, live ${item.liveValue}, delta ${item.delta}`,
    ),
  ].join('\n')
}
