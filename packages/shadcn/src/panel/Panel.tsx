import { assertEmpty } from '@lcw-doc/core'
import { ComponentProps } from '@lcw-doc/react'
import { forwardRef } from 'react'

import { cn } from '../lib/utils'
import { useShadCNComponentsContext } from '../ShadCNComponentsContext'

export const Panel = forwardRef<HTMLDivElement, ComponentProps['FilePanel']['Root']>((props, ref) => {
    const { className, tabs, defaultOpenTab, openTab, setOpenTab, loading, ...rest } = props

    assertEmpty(rest)

    const ShadCNComponents = useShadCNComponentsContext()!

    return (
        <ShadCNComponents.Tabs.Tabs
            className={cn(className, 'bn:bg-popover bn:p-2 bn:rounded-lg')}
            ref={ref}
            value={openTab}
            defaultValue={defaultOpenTab}
            onValueChange={setOpenTab}
        >
            <ShadCNComponents.Tabs.TabsList>
                {tabs.map(tab => (
                    <ShadCNComponents.Tabs.TabsTrigger value={tab.name} key={tab.name}>
                        {tab.name}
                    </ShadCNComponents.Tabs.TabsTrigger>
                ))}
            </ShadCNComponents.Tabs.TabsList>

            {tabs.map(tab => (
                <ShadCNComponents.Tabs.TabsContent value={tab.name} key={tab.name}>
                    <ShadCNComponents.Card.Card>
                        <ShadCNComponents.Card.CardContent className={'bn:p-4'}>{tab.tabPanel}</ShadCNComponents.Card.CardContent>
                    </ShadCNComponents.Card.Card>
                </ShadCNComponents.Tabs.TabsContent>
            ))}
        </ShadCNComponents.Tabs.Tabs>
    )
})
