import { memo } from 'react'

export interface AvatarListProps {
    remoteUsers: Map<
        number,
        {
            name: string
            color: string
        }
    >
}

export const AvatarList = memo((props: AvatarListProps) => {
    const { remoteUsers } = props
    return (
        remoteUsers && (
            <div className="flex flex-row gap-2">
                {Array.from(remoteUsers).map(
                    ([key, value]) =>
                        value && (
                            <div
                                key={key}
                                style={{ backgroundColor: value.color }}
                                className="size-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                            >
                                {value.name.charAt(0).toUpperCase()}
                            </div>
                        )
                )}
            </div>
        )
    )
})
