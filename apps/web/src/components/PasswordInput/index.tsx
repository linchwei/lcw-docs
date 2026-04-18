import { useState, useRef, forwardRef } from 'react'
import styles from './PasswordInput.module.css'

interface PasswordInputProps {
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    name?: string
    onBlur?: () => void
    onFocus?: () => void
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ value, onChange, placeholder = '请输入密码', name, onBlur, onFocus }, ref) => {
        const [isVisible, setIsVisible] = useState(false)
        const [isPeeking, setIsPeeking] = useState(false)
        const [isFocused, setIsFocused] = useState(false)
        const containerRef = useRef<HTMLDivElement>(null)

        const handleToggleVisibility = () => {
            setIsPeeking(true)
            setIsVisible(!isVisible)
            
            // Reset peeking animation after it completes
            setTimeout(() => {
                setIsPeeking(false)
            }, 600)
        }

        const handleFocus = () => {
            setIsFocused(true)
            onFocus?.()
        }

        const handleBlur = () => {
            setIsFocused(false)
            onBlur?.()
        }

        return (
            <div 
                ref={containerRef}
                className={`${styles.container} ${isFocused ? styles.focused : ''}`}
            >
                <div className={styles.inputWrapper}>
                    <input
                        ref={ref}
                        type={isVisible ? 'text' : 'password'}
                        value={value}
                        name={name}
                        onChange={(e) => onChange?.(e.target.value)}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        className={styles.input}
                    />
                    <button
                        type="button"
                        onClick={handleToggleVisibility}
                        className={`${styles.toggleButton} ${isPeeking ? styles.peeking : ''}`}
                        aria-label={isVisible ? '隐藏密码' : '显示密码'}
                    >
                        <div className={styles.eyeContainer}>
                            {/* Left eye (closed) */}
                            <div className={`${styles.eye} ${styles.leftEye} ${isVisible ? styles.open : styles.closed}`}>
                                <div className={styles.eyelid}>
                                    <div className={styles.eyelidTop}></div>
                                    <div className={styles.eyelidBottom}></div>
                                </div>
                                <div className={styles.pupil}>
                                    <div className={styles.iris}></div>
                                </div>
                            </div>
                            {/* Right eye (open) */}
                            <div className={`${styles.eye} ${styles.rightEye} ${isVisible ? styles.closed : styles.open}`}>
                                <div className={styles.eyelid}>
                                    <div className={styles.eyelidTop}></div>
                                    <div className={styles.eyelidBottom}></div>
                                </div>
                                <div className={styles.pupil}>
                                    <div className={styles.iris}></div>
                                </div>
                            </div>
                        </div>
                        {/* Peeking animation overlay */}
                        <div className={styles.peekOverlay}>
                            <div className={styles.peekEye}>
                                <div className={styles.peekPupil}></div>
                            </div>
                        </div>
                    </button>
                </div>
                {/* Focus glow effect */}
                <div className={styles.glow}></div>
                {/* Password strength indicator (decorative) */}
                <div className={styles.strengthIndicator}>
                    <div className={`${styles.strengthBar} ${value && value.length > 0 ? styles.active : ''}`}></div>
                    <div className={`${styles.strengthBar} ${value && value.length > 4 ? styles.active : ''}`}></div>
                    <div className={`${styles.strengthBar} ${value && value.length > 8 ? styles.active : ''}`}></div>
                </div>
            </div>
        )
    }
)

PasswordInput.displayName = 'PasswordInput'
