import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@lcw-doc/shadcn-shared-ui/components/ui/form'
import { Input } from '@lcw-doc/shadcn-shared-ui/components/ui/input'
import { useToast } from '@lcw-doc/shadcn-shared-ui/hooks/use-toast'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import * as srv from '@/services'
import { CreateUserPayload } from '@/types/api'

import { ThemeToggle } from '@/components/ThemeToggle'
import { PasswordInput } from '@/components/PasswordInput'

import styles from './Login.module.css'

export function Login() {
    const form = useForm<CreateUserPayload>()
    const [inputType, setInputType] = useState<'login' | 'register'>('login')
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const { toast } = useToast()

    const handleSubmit = async (values: CreateUserPayload) => {
        setIsLoading(true)

        try {
            const res = await srv[inputType](values)

            if (!res.data) {
                toast({
                    variant: 'destructive',
                    title: '请稍后重试',
                })
                setIsLoading(false)
                return
            }

            if (inputType === 'login') {
                toast({
                    variant: 'success',
                    title: '登录成功',
                })

                localStorage.setItem('token', res.data.access_token)

                const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/doc'
                navigate(redirectUrl)
            }

            if (inputType === 'register') {
                toast({
                    title: '注册成功，请前往登录',
                })
                setInputType('login')
                setIsLoading(false)
            }
        } catch {
            toast({
                variant: 'destructive',
                title: '登录失败，请稍后重试',
            })
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.page}>
            {/* Background effects */}
            <div className={styles.background}>
                <div className={styles.gradientOrb}></div>
                <div className={styles.gradientOrb2}></div>
                <div className={styles.grid}></div>
            </div>

            {/* Theme toggle */}
            <div className={styles.themeToggle}>
                <ThemeToggle />
            </div>

            {/* Main content */}
            <div className={styles.container}>
                {/* Left side - Branding */}
                <div className={styles.branding}>
                    <div className={styles.brandingContent}>
                        <div className={styles.logo}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={styles.logoIcon}
                            >
                                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                            </svg>
                            <span className={styles.logoText}>协同文档</span>
                        </div>
                        <blockquote className={styles.quote}>
                            <p className={styles.quoteText}>天生我材必有用</p>
                            <footer className={styles.quoteAuthor}>@林一</footer>
                        </blockquote>
                    </div>
                </div>

                {/* Right side - Form */}
                <div className={styles.formSection}>
                    <div className={styles.formCard}>
                        <div className={styles.formHeader}>
                            <h1 className={styles.title}>{inputType === 'login' ? '欢迎回来' : '创建账号'}</h1>
                            <p className={styles.subtitle}>
                                {inputType === 'login' ? '登录以继续您的创作之旅' : '注册开始您的文档协作体验'}
                            </p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.form}>
                                <FormField
                                    control={form.control}
                                    rules={{ required: '请输入用户名' }}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel className={styles.label}>用户名</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="请输入用户名"
                                                    className={styles.input}
                                                    autoComplete="username"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    rules={{ required: '请输入密码' }}
                                    render={({ field }) => (
                                        <FormItem className={styles.formItem}>
                                            <FormLabel className={styles.label}>密码</FormLabel>
                                            <FormControl>
                                                <PasswordInput
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="请输入密码"
                                                    name={field.name}
                                                    onBlur={field.onBlur}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className={styles.submitButton} disabled={isLoading}>
                                    {isLoading ? (
                                        <span className={styles.loading}>
                                            <span className={styles.spinner}></span>
                                            处理中...
                                        </span>
                                    ) : inputType === 'login' ? (
                                        '登录'
                                    ) : (
                                        '注册'
                                    )}
                                </Button>
                            </form>
                        </Form>

                        <div className={styles.divider}>
                            <span className={styles.dividerText}>或</span>
                        </div>

                        {inputType === 'login' ? (
                            <div className={styles.switchText}>
                                还没有账号？{' '}
                                <Button
                                    variant="link"
                                    className={styles.switchButton}
                                    onClick={() => {
                                        form.clearErrors()
                                        setInputType('register')
                                    }}
                                >
                                    立即注册
                                </Button>
                            </div>
                        ) : (
                            <div className={styles.switchText}>
                                已有账号？{' '}
                                <Button
                                    variant="link"
                                    className={styles.switchButton}
                                    onClick={() => {
                                        form.clearErrors()
                                        setInputType('login')
                                    }}
                                >
                                    立即登录
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
