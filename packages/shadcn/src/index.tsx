// @ts-ignore
import './style.css'

import { mergeCSSClasses } from '@lcw-doc/core'
import { Components, ComponentsContext, LcwDocViewRaw } from '@lcw-doc/react'
import { useMemo } from 'react'

import { Form } from './form/Form'
import { TextInput } from './form/TextInput'
import { Menu, MenuDivider, MenuDropdown, MenuItem, MenuLabel, MenuTrigger } from './menu/Menu'
import { Panel } from './panel/Panel'
import { PanelButton } from './panel/PanelButton'
import { PanelFileInput } from './panel/PanelFileInput'
import { PanelTab } from './panel/PanelTab'
import { PanelTextInput } from './panel/PanelTextInput'
import { Popover, PopoverContent, PopoverTrigger } from './popover/popover'
import { ShadCNComponents, ShadCNComponentsContext, ShadCNDefaultComponents } from './ShadCNComponentsContext'
import { SideMenu } from './sideMenu/SideMenu'
import { SideMenuButton } from './sideMenu/SideMenuButton'
import { GridSuggestionMenu } from './suggestionMenu/gridSuggestionMenu/GridSuggestionMenu'
import { GridSuggestionMenuEmptyItem } from './suggestionMenu/gridSuggestionMenu/GridSuggestionMenuEmptyItem'
import { GridSuggestionMenuItem } from './suggestionMenu/gridSuggestionMenu/GridSuggestionMenuItem'
import { GridSuggestionMenuLoader } from './suggestionMenu/gridSuggestionMenu/GridSuggestionMenuLoader'
import { SuggestionMenu } from './suggestionMenu/SuggestionMenu'
import { SuggestionMenuEmptyItem } from './suggestionMenu/SuggestionMenuEmptyItem'
import { SuggestionMenuItem } from './suggestionMenu/SuggestionMenuItem'
import { SuggestionMenuLabel } from './suggestionMenu/SuggestionMenuLabel'
import { SuggestionMenuLoader } from './suggestionMenu/SuggestionMenuLoader'
import { ExtendButton } from './tableHandle/ExtendButton'
import { TableHandle } from './tableHandle/TableHandle'
import { Toolbar, ToolbarButton, ToolbarSelect } from './toolbar/Toolbar'

/**
 * 将 ForwardRefExoticComponent 转换为 ComponentType
 * 这是为了解决 React 18 和 React 19 类型不兼容的问题
 */
function asComponent<T>(component: T): T {
    return component
}

export const components: Components = {
    FormattingToolbar: {
        Root: asComponent(Toolbar),
        Button: asComponent(ToolbarButton),
        Select: asComponent(ToolbarSelect),
    },
    FilePanel: {
        Root: asComponent(Panel),
        Button: asComponent(PanelButton),
        FileInput: asComponent(PanelFileInput),
        TabPanel: asComponent(PanelTab),
        TextInput: asComponent(PanelTextInput),
    },
    LinkToolbar: {
        Root: asComponent(Toolbar),
        Button: asComponent(ToolbarButton),
    },
    SideMenu: {
        Root: asComponent(SideMenu),
        Button: asComponent(SideMenuButton),
    },
    SuggestionMenu: {
        Root: asComponent(SuggestionMenu),
        Item: asComponent(SuggestionMenuItem),
        EmptyItem: asComponent(SuggestionMenuEmptyItem),
        Label: asComponent(SuggestionMenuLabel),
        Loader: asComponent(SuggestionMenuLoader),
    },
    GridSuggestionMenu: {
        Root: asComponent(GridSuggestionMenu),
        Item: asComponent(GridSuggestionMenuItem),
        EmptyItem: asComponent(GridSuggestionMenuEmptyItem),
        Loader: asComponent(GridSuggestionMenuLoader),
    },
    TableHandle: {
        Root: asComponent(TableHandle),
        ExtendButton: asComponent(ExtendButton),
    },
    Generic: {
        Form: {
            Root: asComponent(Form),
            TextInput: asComponent(TextInput),
        },
        Menu: {
            Root: asComponent(Menu),
            Trigger: asComponent(MenuTrigger),
            Dropdown: asComponent(MenuDropdown),
            Divider: asComponent(MenuDivider),
            Label: asComponent(MenuLabel),
            Item: asComponent(MenuItem),
        },
        Popover: {
            Root: asComponent(Popover),
            Trigger: asComponent(PopoverTrigger),
            Content: asComponent(PopoverContent),
        },
    },
}

export const LcwDocView = (
    props: {
        shadCNComponents?: Partial<ShadCNComponents>
        className?: string
        editor: any
        [key: string]: any
    }
) => {
    const { className, shadCNComponents, ...rest } = props

    const componentsValue = useMemo(() => {
        return {
            ...ShadCNDefaultComponents,
            ...shadCNComponents,
        }
    }, [shadCNComponents])

    return (
        <ShadCNComponentsContext.Provider value={componentsValue}>
            <ComponentsContext.Provider value={components}>
                {/* @ts-ignore - LcwDocViewRaw is typed as any but TS still checks props */}
                <LcwDocViewRaw {...rest} className={mergeCSSClasses('bn-shadcn', className || '')} />
            </ComponentsContext.Provider>
        </ShadCNComponentsContext.Provider>
    )
}
