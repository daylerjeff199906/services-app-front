"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

interface PageHeaderContextType {
    title: string | null
    setTitle: (title: string | null) => void
}

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined)

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
    const [title, setInternalTitle] = useState<string | null>(null)

    const setTitle = useCallback((newTitle: string | null) => {
        setInternalTitle(newTitle)
    }, [])

    return (
        <PageHeaderContext.Provider value={{ title, setTitle }}>
            {children}
        </PageHeaderContext.Provider>
    )
}

export function usePageHeader() {
    const context = useContext(PageHeaderContext)
    if (context === undefined) {
        throw new Error("usePageHeader must be used within a PageHeaderProvider")
    }
    return context
}
