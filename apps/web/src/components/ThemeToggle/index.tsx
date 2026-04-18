import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import styles from './ThemeToggle.module.css'

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark')
        }
        return false
    })
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [isDark])

    const toggleTheme = () => {
        if (isAnimating) return
        
        setIsAnimating(true)
        setIsDark(!isDark)
        
        setTimeout(() => {
            setIsAnimating(false)
        }, 600)
    }

    return (
        <button
            onClick={toggleTheme}
            className={`${styles.toggle} ${isAnimating ? styles.animating : ''} ${isDark ? styles.dark : styles.light}`}
            aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
        >
            <div className={styles.switch}>
                <div className={styles.handle}>
                    {isDark ? (
                        <Moon className={styles.icon} size={16} />
                    ) : (
                        <Sun className={styles.icon} size={16} />
                    )}
                </div>
            </div>
            <div className={styles.glow} />
            <div className={styles.sparks}>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </button>
    )
}
