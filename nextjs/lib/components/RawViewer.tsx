"use client"

import { useMemo, useState } from "react"

type RawViewerProps = {
  raw: unknown
  defaultCollapsed?: boolean
  title?: string
}

export default function RawViewer({ raw, defaultCollapsed = true, title }: RawViewerProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [copied, setCopied] = useState(false)

  const rawText = useMemo(() => {
    if (typeof raw === "string") {
      return raw
    }
    try {
      return JSON.stringify(raw, null, 2)
    } catch {
      return "[unserializable raw data]"
    }
  }, [raw])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rawText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="raw-viewer">
      <div className="raw-viewer__header">
        <div className="raw-viewer__title">{title ?? "Raw"}</div>
        <div className="raw-viewer__actions">
          <button type="button" onClick={() => setCollapsed((prev) => !prev)}>
            {collapsed ? "Show" : "Hide"}
          </button>
          <button type="button" onClick={handleCopy}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      {!collapsed && (
        <pre className="raw-viewer__content">
          <code>{rawText}</code>
        </pre>
      )}
    </div>
  )
}
