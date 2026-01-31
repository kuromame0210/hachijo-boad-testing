"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./bright.module.css"

export default function RefreshButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      await fetch("/api/debug/refresh-bright", { method: "POST" })
    } finally {
      setIsLoading(false)
      router.refresh()
    }
  }

  return (
    <button
      type="button"
      className={styles.action}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? "更新中..." : "更新"}
    </button>
  )
}
