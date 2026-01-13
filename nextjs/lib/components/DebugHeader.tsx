import type { ReactNode } from "react"

type DebugHeaderProps = {
  title: string
  eyebrow?: string
  meta?: ReactNode
  actions?: ReactNode
  containerClassName?: string
  titleClassName?: string
  eyebrowClassName?: string
  metaClassName?: string
  navClassName?: string
  navLinkClassName?: string
}

const NAV_LINKS = [
  { href: "/bright", label: "明るい表示" },
  { href: "/calm", label: "落ち着いた表示" },
  { href: "/test", label: "APIテスト結果" },
  { href: "/test/preview", label: "表示項目プレビュー" },
  { href: "/", label: "技術検証（交通）" },
  { href: "/weather", label: "技術検証（天気）" },
]

export default function DebugHeader({
  title,
  eyebrow,
  meta,
  actions,
  containerClassName,
  titleClassName,
  eyebrowClassName,
  metaClassName,
  navClassName,
  navLinkClassName,
}: DebugHeaderProps) {
  return (
    <header className={containerClassName ?? "page-header"}>
      <div>
        {eyebrow && <p className={eyebrowClassName ?? "page-eyebrow"}>{eyebrow}</p>}
        <h1 className={titleClassName ?? "page-title"}>{title}</h1>
        {meta && <div className={metaClassName ?? ""}>{meta}</div>}
        <nav className={navClassName ?? "page-actions"}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} className={navLinkClassName ?? ""} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  )
}
