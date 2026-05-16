import { createVueBlockSpec } from '@lcw-doc/vue'
import { defineComponent, h, ref } from 'vue'

const CALLOUT_CONFIG: Record<string, { icon: string; bg: string; color: string; label: string }> = {
    info: { icon: '💡', bg: '#eef4fc', color: '#097fe8', label: '信息' },
    warning: { icon: '⚠️', bg: '#fbf3db', color: '#cb912f', label: '警告' },
    error: { icon: '❌', bg: '#fbe4e4', color: '#eb5757', label: '错误' },
    success: { icon: '✅', bg: '#dbeddb', color: '#4dab6f', label: '成功' },
}

type CalloutType = keyof typeof CALLOUT_CONFIG

export const Callout = createVueBlockSpec(
    {
        type: 'callout',
        propSchema: {
            calloutType: { default: 'info', values: ['info', 'warning', 'error', 'success'] },
        },
        content: 'inline',
    },
    {
        render: defineComponent({
            props: ['block', 'editor', 'contentRef'],
            setup(props) {
                const showMenu = ref(false)

                const config = CALLOUT_CONFIG[((props.block as any)?.props?.calloutType || 'info') as CalloutType]

                function handleTypeChange(type: CalloutType) {
                    ;(props as any).editor.updateBlock((props as any).block.id, {
                        type: 'callout',
                        props: { calloutType: type },
                    })
                    showMenu.value = false
                }

                function toggleMenu() {
                    showMenu.value = !showMenu.value
                }

                return () => {
                    const calloutType = ((props.block as any)?.props?.calloutType || 'info') as CalloutType
                    const cfg = CALLOUT_CONFIG[calloutType]

                    const menuItems = showMenu.value
                        ? h(
                              'div',
                              {
                                  style: {
                                      position: 'absolute',
                                      top: '100%',
                                      left: '12px',
                                      zIndex: 100,
                                      backgroundColor: '#fff',
                                      borderRadius: '6px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                      border: '1px solid #e9e9e7',
                                      padding: '4px',
                                      minWidth: '120px',
                                  },
                              },
                              Object.entries(CALLOUT_CONFIG).map(([type, item]) =>
                                  h(
                                      'div',
                                      {
                                          key: type,
                                          onClick: () => handleTypeChange(type as CalloutType),
                                          style: {
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px',
                                              padding: '6px 8px',
                                              borderRadius: '4px',
                                              cursor: 'pointer',
                                              fontSize: '13px',
                                              color: '#37352f',
                                              backgroundColor:
                                                  type === calloutType ? '#f7f6f3' : 'transparent',
                                          },
                                      },
                                      [h('span', { innerHTML: item.icon }), h('span', item.label)],
                                  ),
                              ),
                          )
                        : null

                    return h(
                        'div',
                        {
                            style: {
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                                padding: '8px 12px',
                                backgroundColor: cfg.bg,
                                borderRadius: '4px',
                                border: `1px solid ${cfg.color}22`,
                                position: 'relative',
                            },
                        },
                        [
                            h(
                                'span',
                                {
                                    onClick: toggleMenu,
                                    style: {
                                        fontSize: '18px',
                                        lineHeight: '24px',
                                        flexShrink: 0,
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                    },
                                },
                                cfg.icon,
                            ),
                            h('div', { ref: props.contentRef, style: { flex: 1, outline: 'none' } }),
                            menuItems,
                        ].filter(Boolean),
                    )
                }
            },
        }),
    },
)
