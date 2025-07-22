import { RefObject } from "react"

export function useButtonMouseMove() {
  const handleMouseMove = (ref: RefObject<HTMLButtonElement | null>) => (e: React.MouseEvent) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      ref.current.style.setProperty("--mouse-x", `${x}%`)
      ref.current.style.setProperty("--mouse-y", `${y}%`)
    }
  }
  return handleMouseMove
}