export type CursorUser = {
    name: string
    color: string
    iconUrl: string
}

export const cursorRender = (user: CursorUser) => {
    const cursor = document.createElement('span')
    cursor.style.position = 'relative'
    cursor.style.backgroundColor = user.color

    const cursorAvatar = document.createElement('span')
    cursorAvatar.textContent = user.name.charAt(0).toUpperCase()
    cursorAvatar.style.backgroundColor = user.color
    cursorAvatar.style.color = '#fff'
    cursorAvatar.style.border = '2px solid #f2f2f2'
    cursorAvatar.style.position = 'absolute'
    cursorAvatar.style.width = '36px'
    cursorAvatar.style.maxWidth = '36px'
    cursorAvatar.style.height = '36px'
    cursorAvatar.style.borderRadius = '50%'
    cursorAvatar.style.left = '0'
    cursorAvatar.style.top = '-36px'
    cursorAvatar.style.display = 'flex'
    cursorAvatar.style.alignItems = 'center'
    cursorAvatar.style.justifyContent = 'center'
    cursorAvatar.style.fontSize = '14px'
    cursorAvatar.style.fontWeight = '600'
    cursorAvatar.style.lineHeight = '1'
    cursor.appendChild(cursorAvatar)

    const cursorTail = document.createElement('span')
    cursorTail.style.position = 'absolute'
    cursorTail.style.width = '2px'
    cursorTail.style.height = '100%'
    cursorTail.style.backgroundColor = user.color
    cursorTail.style.left = '-1px'
    cursorTail.style.top = '0'
    cursor.appendChild(cursorTail)
    return cursor
}
