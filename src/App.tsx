import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Columns3,
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
type Locale = 'zh' | 'en'

interface SourceState {
  labels: Record<Locale, string>
  url: string
  imageDataUrl: string
}

interface ComparisonItem {
  id: string
  category: ComparisonCategory
  labels: Record<Locale, string>
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
  | { type: 'set-label'; side: CanvasSide; locale: Locale; value: string }
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
    labels: { zh: '主标题', en: 'Primary heading' },
    designValue: '32px / 700 / -',
    liveValue: '30px / 700 / -',
    delta: '-2px',
    status: 'review',
  },
  {
    id: 'font-body',
    category: 'typography',
    labels: { zh: '正文文字', en: 'Body text' },
    designValue: '16px / 400 / 24px',
    liveValue: '16px / 400 / 24px',
    delta: '0',
    status: 'pass',
  },
  {
    id: 'gap-section',
    category: 'spacing',
    labels: { zh: '区块间距', en: 'Section gap' },
    designValue: '32px',
    liveValue: '24px',
    delta: '-8px',
    status: 'fail',
  },
  {
    id: 'padding-card',
    category: 'spacing',
    labels: { zh: '面板内边距', en: 'Panel padding' },
    designValue: '20px',
    liveValue: '18px',
    delta: '-2px',
    status: 'review',
  },
  {
    id: 'color-primary',
    category: 'color',
    labels: { zh: '主操作色', en: 'Primary action' },
    designValue: '#002FA7',
    liveValue: '#0838B8',
    delta: 'Delta E 3.2',
    status: 'pass',
  },
  {
    id: 'color-muted',
    category: 'color',
    labels: { zh: '弱化文字色', en: 'Muted text' },
    designValue: '#A8AFBF',
    liveValue: '#8E96A8',
    delta: 'Delta E 7.1',
    status: 'review',
  },
  {
    id: 'width-main',
    category: 'layout',
    labels: { zh: '主内容宽度', en: 'Main content width' },
    designValue: '760px',
    liveValue: '744px',
    delta: '-16px',
    status: 'review',
  },
  {
    id: 'radius-panel',
    category: 'layout',
    labels: { zh: '面板圆角', en: 'Panel radius' },
    designValue: '8px',
    liveValue: '8px',
    delta: '0',
    status: 'pass',
  },
]

const initialState: CompareState = {
  design: {
    labels: { zh: '设计稿', en: 'Design draft' },
    url: '',
    imageDataUrl: '',
  },
  live: {
    labels: { zh: '线上稿', en: 'Live build' },
    url: '',
    imageDataUrl: '',
  },
  viewport: 'desktop',
  zoom: 82,
  guidesVisible: true,
  selectedCategory: 'all',
  items: comparisonItems,
}

const copy = {
  zh: {
    appTitle: '对稿画布',
    scoreLabel: '当前视觉匹配度',
    copied: '已复制',
    copyFailed: '复制失败',
    copyReport: '复制报告',
    exportJson: '导出 JSON',
    controlsAria: '比对控制',
    canvasAria: '设计稿和线上稿比对',
    viewportAria: '视口',
    desktop: '桌面',
    tablet: '平板',
    mobile: '手机',
    zoom: '缩放',
    guides: '参考线',
    designKicker: '设计稿',
    liveKicker: '线上稿',
    designBadge: '设计',
    liveBadge: '线上',
    name: '名称',
    designNote: 'Figma 或文件备注',
    liveUrl: '线上地址',
    designPlaceholder: 'Figma 页面、版本或文件名',
    uploadImage: '上传图片',
    clearImage: '清除图片',
    screenshot: '截图',
    preview: '预览',
    spec: '规范',
    build: '实现',
    designSurface: '设计稿画面',
    liveSurface: '线上画面',
    summaryKicker: '概览',
    summaryTitle: '比对状态',
    scoreAria: '视觉匹配度',
    match: '匹配度',
    pass: '通过',
    review: '待复查',
    fail: '不一致',
    sources: '素材',
    sourceReady: '已就绪',
    sourcePartial: '缺一侧',
    sourceEmpty: '未放入',
    diffKicker: '差异队列',
    diffTitle: '待比对参数',
    categoriesAria: '比对分类',
    differencesAria: '比对差异',
    all: '全部',
    typography: '字体',
    spacing: '间距',
    color: '颜色',
    layout: '布局',
    parameter: '参数',
    design: '设计稿',
    live: '线上稿',
    delta: '差异',
    status: '状态',
    reportTitle: '界面对稿报告',
    generated: '生成时间',
    viewport: '视口',
    matchReport: '匹配度',
    flagged: '需要复查的问题',
  },
  en: {
    appTitle: 'Design Compare Canvas',
    scoreLabel: 'Current visual match score',
    copied: 'Copied',
    copyFailed: 'Copy failed',
    copyReport: 'Copy report',
    exportJson: 'Export JSON',
    controlsAria: 'Comparison controls',
    canvasAria: 'Design and live comparison',
    viewportAria: 'Viewport',
    desktop: 'Desktop',
    tablet: 'Tablet',
    mobile: 'Mobile',
    zoom: 'Zoom',
    guides: 'Guides',
    designKicker: 'Design draft',
    liveKicker: 'Live build',
    designBadge: 'Design',
    liveBadge: 'Live',
    name: 'Name',
    designNote: 'Figma or file note',
    liveUrl: 'Production URL',
    designPlaceholder: 'Figma frame, version, file name',
    uploadImage: 'Upload image',
    clearImage: 'Clear image',
    screenshot: 'screenshot',
    preview: 'preview',
    spec: 'Spec',
    build: 'Build',
    designSurface: 'Design surface',
    liveSurface: 'Live surface',
    summaryKicker: 'Snapshot',
    summaryTitle: 'Comparison status',
    scoreAria: 'Visual match score',
    match: 'match',
    pass: 'Pass',
    review: 'Review',
    fail: 'Fail',
    sources: 'Sources',
    sourceReady: 'Ready',
    sourcePartial: 'Partial',
    sourceEmpty: 'No sources',
    diffKicker: 'Diff queue',
    diffTitle: 'Parameters to compare',
    categoriesAria: 'Comparison categories',
    differencesAria: 'Comparison differences',
    all: 'All',
    typography: 'Type',
    spacing: 'Space',
    color: 'Color',
    layout: 'Layout',
    parameter: 'Parameter',
    design: 'Design',
    live: 'Live',
    delta: 'Delta',
    status: 'Status',
    reportTitle: 'UI Comparison Report',
    generated: 'Generated',
    viewport: 'Viewport',
    matchReport: 'Match',
    flagged: 'Flagged Differences',
  },
} as const

function compareReducer(state: CompareState, action: CompareAction): CompareState {
  switch (action.type) {
    case 'set-label':
      return {
        ...state,
        [action.side]: {
          ...state[action.side],
          labels: {
            ...state[action.side].labels,
            [action.locale]: action.value,
          },
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
  const [locale, setLocale] = useState<Locale>('zh')
  const t = copy[locale]

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
        label: state.design.labels[locale],
        url: state.design.url,
        hasScreenshot: Boolean(state.design.imageDataUrl),
      },
      live: {
        label: state.live.labels[locale],
        url: state.live.url,
        hasScreenshot: Boolean(state.live.imageDataUrl),
      },
      locale,
      viewport: state.viewport,
      zoom: state.zoom,
      metrics,
      items: state.items,
    }),
    [locale, metrics, state],
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
      await navigator.clipboard.writeText(formatMarkdownReport(report, locale))
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
        locale={locale}
        metrics={metrics}
        onLocaleChange={setLocale}
        onCopyReport={handleCopyReport}
        onExportJson={handleExportJson}
      />

      <section className="compare-toolbar" aria-label={t.controlsAria}>
        <ViewportSwitch
          locale={locale}
          viewport={state.viewport}
          onChange={(viewport) =>
            dispatch({ type: 'set-viewport', viewport })
          }
        />
        <label className="range-field">
          <span>{t.zoom}</span>
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
          {t.guides}
        </button>
      </section>

      <section className="canvas-grid" aria-label={t.canvasAria}>
        <ComparisonCanvas
          imageDataUrl={state.design.imageDataUrl}
          label={state.design.labels[locale]}
          locale={locale}
          side="design"
          url={state.design.url}
          viewport={state.viewport}
          zoom={state.zoom}
          guidesVisible={state.guidesVisible}
          onClearImage={() => dispatch({ type: 'clear-image', side: 'design' })}
          onImageChange={handleImageChange('design')}
          onLabelChange={(value) =>
            dispatch({ type: 'set-label', side: 'design', locale, value })
          }
          onUrlChange={(value) =>
            dispatch({ type: 'set-url', side: 'design', value })
          }
        />
        <ComparisonCanvas
          imageDataUrl={state.live.imageDataUrl}
          label={state.live.labels[locale]}
          locale={locale}
          side="live"
          url={state.live.url}
          viewport={state.viewport}
          zoom={state.zoom}
          guidesVisible={state.guidesVisible}
          onClearImage={() => dispatch({ type: 'clear-image', side: 'live' })}
          onImageChange={handleImageChange('live')}
          onLabelChange={(value) =>
            dispatch({ type: 'set-label', side: 'live', locale, value })
          }
          onUrlChange={(value) =>
            dispatch({ type: 'set-url', side: 'live', value })
          }
        />
      </section>

      <section className="analysis-grid">
        <SummaryPanel locale={locale} metrics={metrics} />
        <ComparisonPanel
          items={visibleItems}
          locale={locale}
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
  locale,
  metrics,
  onLocaleChange,
  onCopyReport,
  onExportJson,
}: {
  copyState: 'idle' | 'copied' | 'failed'
  locale: Locale
  metrics: CompareMetrics
  onLocaleChange: (locale: Locale) => void
  onCopyReport: () => void
  onExportJson: () => void
}) {
  const t = copy[locale]

  return (
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          <Columns3 size={22} strokeWidth={2.2} />
        </div>
        <div>
          <p className="eyebrow">Morkasa</p>
          <h1>{t.appTitle}</h1>
        </div>
      </div>

      <div className="header-actions">
        <div className="match-pill" aria-label={t.scoreLabel}>
          <ScanSearch size={18} aria-hidden="true" />
          <span>{metrics.matchScore}%</span>
          <strong>{getSourceLabel(metrics.sourceState, locale)}</strong>
        </div>
        <div className="segmented-control locale-switch" role="group" aria-label="Language">
          <button
            className={locale === 'zh' ? 'active' : ''}
            type="button"
            aria-pressed={locale === 'zh'}
            onClick={() => onLocaleChange('zh')}
          >
            中文
          </button>
          <button
            className={locale === 'en' ? 'active' : ''}
            type="button"
            aria-pressed={locale === 'en'}
            onClick={() => onLocaleChange('en')}
          >
            EN
          </button>
        </div>
        <button className="button secondary" type="button" onClick={onCopyReport}>
          <ClipboardCheck size={17} aria-hidden="true" />
          {copyState === 'copied'
            ? t.copied
            : copyState === 'failed'
              ? t.copyFailed
              : t.copyReport}
        </button>
        <button className="button primary" type="button" onClick={onExportJson}>
          <Download size={17} aria-hidden="true" />
          {t.exportJson}
        </button>
      </div>
    </header>
  )
}

function ComparisonCanvas({
  guidesVisible,
  imageDataUrl,
  label,
  locale,
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
  locale: Locale
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
  const t = copy[locale]
  const sideLabel = side === 'design' ? t.designKicker : t.liveKicker
  const badgeLabel = side === 'design' ? t.designBadge : t.liveBadge

  return (
    <article className="canvas-panel">
      <div className="canvas-head">
        <SectionHeading
          icon={side === 'design' ? <FileImage size={18} /> : <Globe2 size={18} />}
          kicker={sideLabel}
          title={label}
        />
        <span className={`source-badge ${side}`}>{badgeLabel}</span>
      </div>

      <div className="source-controls">
        <label className="field">
          <span>{t.name}</span>
          <input
            type="text"
            value={label}
            onChange={(event) => onLabelChange(event.target.value)}
          />
        </label>
        <label className="field">
          <span>{side === 'design' ? t.designNote : t.liveUrl}</span>
          <input
            type="text"
            value={url}
            placeholder={side === 'design' ? t.designPlaceholder : 'https://'}
            onChange={(event) => onUrlChange(event.target.value)}
          />
        </label>
        <div className="upload-row">
          <label className="button secondary upload-button">
            <ImageUp size={17} aria-hidden="true" />
            {t.uploadImage}
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
            aria-label={`${t.clearImage}: ${sideLabel}`}
            title={`${t.clearImage}: ${sideLabel}`}
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
            <img alt={`${label} ${t.screenshot}`} src={imageDataUrl} />
          ) : canEmbedUrl ? (
            <iframe
              title={`${label} ${t.preview}`}
              src={normalizedUrl}
              sandbox="allow-scripts allow-forms allow-same-origin"
            />
          ) : (
            <CanvasPlaceholder locale={locale} side={side} />
          )}
          {guidesVisible && <GuideOverlay />}
        </div>
      </div>
    </article>
  )
}

function CanvasPlaceholder({ locale, side }: { locale: Locale; side: CanvasSide }) {
  const t = copy[locale]

  return (
    <div className={`canvas-placeholder ${side}`} aria-label={side === 'design' ? t.designSurface : t.liveSurface}>
      <div className="placeholder-topline">
        <span />
        <span />
        <span />
      </div>
      <div className="placeholder-body">
        <div className="placeholder-sidebar" />
        <div className="placeholder-content">
          <span className="placeholder-kicker">
            {side === 'design' ? t.spec : t.build}
          </span>
          <strong>{side === 'design' ? t.designSurface : t.liveSurface}</strong>
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
  locale,
  viewport,
  onChange,
}: {
  locale: Locale
  viewport: Viewport
  onChange: (viewport: Viewport) => void
}) {
  const t = copy[locale]
  const options: Array<{ id: Viewport; label: string; icon: ReactNode }> = [
    { id: 'desktop', label: t.desktop, icon: <Monitor size={18} /> },
    { id: 'tablet', label: t.tablet, icon: <Tablet size={18} /> },
    { id: 'mobile', label: t.mobile, icon: <Smartphone size={18} /> },
  ]

  return (
    <div className="segmented-control viewport-control" role="group" aria-label={t.viewportAria}>
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

function SummaryPanel({ locale, metrics }: { locale: Locale; metrics: CompareMetrics }) {
  const t = copy[locale]

  return (
    <section className="panel summary-panel">
      <SectionHeading
        icon={<Eye size={18} aria-hidden="true" />}
        kicker={t.summaryKicker}
        title={t.summaryTitle}
      />
      <div
        className="score-ring"
        style={{ '--score': `${metrics.matchScore}%` } as React.CSSProperties}
        aria-label={`${t.scoreAria} ${metrics.matchScore}%`}
      >
        <strong>{metrics.matchScore}</strong>
        <span>{t.match}</span>
      </div>
      <div className="metric-grid">
        <Metric label={t.pass} tone="good" value={String(metrics.passCount)} />
        <Metric label={t.review} tone="warn" value={String(metrics.reviewCount)} />
        <Metric label={t.fail} tone="danger" value={String(metrics.failCount)} />
        <Metric label={t.sources} value={getSourceLabel(metrics.sourceState, locale)} />
      </div>
    </section>
  )
}

function ComparisonPanel({
  items,
  locale,
  onCategoryChange,
  selectedCategory,
}: {
  items: ComparisonItem[]
  locale: Locale
  onCategoryChange: (category: ComparisonCategory | 'all') => void
  selectedCategory: ComparisonCategory | 'all'
}) {
  const t = copy[locale]
  const categories: Array<{
    id: ComparisonCategory | 'all'
    label: string
    icon: ReactNode
  }> = [
    { id: 'all', label: t.all, icon: <SlidersHorizontal size={17} /> },
    { id: 'typography', label: t.typography, icon: <Type size={17} /> },
    { id: 'spacing', label: t.spacing, icon: <Ruler size={17} /> },
    { id: 'color', label: t.color, icon: <Palette size={17} /> },
    { id: 'layout', label: t.layout, icon: <Columns3 size={17} /> },
  ]

  return (
    <section className="panel comparison-panel">
      <SectionHeading
        icon={<ScanSearch size={18} aria-hidden="true" />}
        kicker={t.diffKicker}
        title={t.diffTitle}
      />
      <div className="tab-list compact" role="tablist" aria-label={t.categoriesAria}>
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

      <div className="diff-table" role="table" aria-label={t.differencesAria}>
        <div className="diff-row header" role="row">
          <span role="columnheader">{t.parameter}</span>
          <span role="columnheader">{t.design}</span>
          <span role="columnheader">{t.live}</span>
          <span role="columnheader">{t.delta}</span>
          <span role="columnheader">{t.status}</span>
        </div>
        {items.map((item) => (
          <div className="diff-row" role="row" key={item.id}>
            <span role="cell">
              <strong>{item.labels[locale]}</strong>
              <em>{getCategoryLabel(item.category, locale)}</em>
            </span>
            <span role="cell" data-label={t.design}>{item.designValue}</span>
            <span role="cell" data-label={t.live}>{item.liveValue}</span>
            <span role="cell" data-label={t.delta}>{item.delta}</span>
            <span role="cell" data-label={t.status}>
              <StatusPill locale={locale} status={item.status} />
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

function StatusPill({ locale, status }: { locale: Locale; status: ComparisonStatus }) {
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
      {getStatusLabel(status, locale)}
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

function getSourceLabel(state: CompareMetrics['sourceState'], locale: Locale) {
  const t = copy[locale]
  switch (state) {
    case 'ready':
      return t.sourceReady
    case 'partial':
      return t.sourcePartial
    default:
      return t.sourceEmpty
  }
}

function getCategoryLabel(category: ComparisonCategory, locale: Locale) {
  return copy[locale][category]
}

function getStatusLabel(status: ComparisonStatus, locale: Locale) {
  return copy[locale][status]
}

function getViewportLabel(viewport: Viewport, locale: Locale) {
  return copy[locale][viewport]
}

function formatMarkdownReport(report: {
  generatedAt: string
  design: { label: string; url: string; hasScreenshot: boolean }
  live: { label: string; url: string; hasScreenshot: boolean }
  locale: Locale
  viewport: Viewport
  zoom: number
  metrics: CompareMetrics
  items: ComparisonItem[]
}, locale: Locale) {
  const t = copy[locale]
  const flagged = report.items.filter((item) => item.status !== 'pass')

  return [
    `# ${t.reportTitle}`,
    '',
    `${t.generated}: ${report.generatedAt}`,
    `${t.design}: ${report.design.label}${report.design.url ? ` (${report.design.url})` : ''}`,
    `${t.live}: ${report.live.label}${report.live.url ? ` (${report.live.url})` : ''}`,
    `${t.viewport}: ${getViewportLabel(report.viewport, locale)}`,
    `${t.matchReport}: ${report.metrics.matchScore}%`,
    '',
    `## ${t.flagged}`,
    ...flagged.map(
      (item) =>
        `- [${getStatusLabel(item.status, locale)}] ${item.labels[locale]}: ${t.design} ${item.designValue}, ${t.live} ${item.liveValue}, ${t.delta} ${item.delta}`,
    ),
  ].join('\n')
}
