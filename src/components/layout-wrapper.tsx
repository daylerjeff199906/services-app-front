"use client"

import { usePageHeader } from "@/components/providers/page-header-provider"
import { useEffect } from "react"

import { DynamicBreadcrumbs } from "./dynamic-breadcrumbs"

interface LayoutWrapperProps {
    children: React.ReactNode
    sectionTitle?: string
}

export const LayoutWrapper = ({
    children,
    sectionTitle,
}: LayoutWrapperProps) => {
    const { setTitle } = usePageHeader()

    useEffect(() => {
        if (sectionTitle) {
            setTitle(sectionTitle)
        }
    }, [sectionTitle, setTitle])

    return (
        <div className="flex flex-col gap-6">
            <div>
                <DynamicBreadcrumbs />
            </div>
            {children}
        </div>
    )
}
