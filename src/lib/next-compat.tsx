import React from "react"

export function usePathname() {
  const [pathname, setPathname] = React.useState(window.location.pathname)

  React.useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  return pathname
}

export function Link({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault()
      window.history.pushState({}, "", href)
      window.dispatchEvent(new PopStateEvent("popstate"))
    }
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}

export default Link
