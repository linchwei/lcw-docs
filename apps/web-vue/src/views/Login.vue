<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NInput, NButton, NAlert, useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { LogIn, UserPlus } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const message = useMessage()

const inputType = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
    if (!username.value || !password.value) {
        error.value = '请输入用户名和密码'
        return
    }
    loading.value = true
    error.value = ''
    try {
        if (inputType.value === 'login') {
            const { login: loginApi } = await import('@/services')
            const res = await loginApi({ username: username.value, password: password.value })
            if (!res.data) throw new Error('登录失败')
            localStorage.setItem('token', res.data.access_token)
            authStore.token = res.data.access_token
            message.success('登录成功')
            const redirect = new URLSearchParams(window.location.search).get('redirect') || '/doc'
            router.push(redirect)
        } else {
            const { register } = await import('@/services')
            await register({ username: username.value, password: password.value })
            message.success('注册成功，请登录')
            inputType.value = 'login'
            password.value = ''
        }
    } catch (e: any) {
        error.value = e?.response?.data?.message || e?.message || (inputType.value === 'login' ? '登录失败' : '注册失败')
    } finally {
        loading.value = false
    }
}

function toggleType() {
    error.value = ''
    inputType.value = inputType.value === 'login' ? 'register' : 'login'
}
</script>

<template>
    <div class="login-page">
        <!-- Background effects -->
        <div class="background">
            <div class="gradient-orb"></div>
            <div class="gradient-orb-2"></div>
            <div class="grid-pattern"></div>
        </div>

        <!-- Theme toggle -->
        <div class="theme-toggle">
            <button class="theme-btn" @click="themeStore.setTheme(themeStore.isDark ? 'light' : 'dark')" :title="themeStore.isDark ? '切换亮色模式' : '切换暗色模式'">
                <svg v-if="themeStore.isDark" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            </button>
        </div>

        <!-- Main content -->
        <div class="container">
            <!-- Left: Branding -->
            <div class="branding">
                <div class="branding-content">
                    <div class="logo">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="logo-icon">
                            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                        </svg>
                        <span class="logo-text">协同文档</span>
                    </div>
                    <blockquote class="quote">
                        <p class="quote-text">天生我材必有用</p>
                        <footer class="quote-author">@林一</footer>
                    </blockquote>
                </div>
            </div>

            <!-- Right: Form -->
            <div class="form-section">
                <div class="form-card">
                    <div class="form-header">
                        <h1 class="title">{{ inputType === 'login' ? '欢迎回来' : '创建账号' }}</h1>
                        <p class="subtitle">{{ inputType === 'login' ? '登录以继续您的创作之旅' : '注册开始您的文档协作体验' }}</p>
                    </div>

                    <NAlert v-if="error" type="error" closable class="error-alert" @close="error = ''">
                        {{ error }}
                    </NAlert>

                    <form class="form" @submit.prevent="handleSubmit">
                        <div class="form-item">
                            <label class="label">用户名</label>
                            <NInput
                                v-model:value="username"
                                placeholder="请输入用户名"
                                :input-props="{ autocomplete: 'username' }"
                                class="input-field"
                            />
                        </div>
                        <div class="form-item">
                            <label class="label">密码</label>
                            <NInput
                                v-model:value="password"
                                type="password"
                                placeholder="请输入密码"
                                show-password-on="click"
                                :input-props="{ autocomplete: inputType === 'login' ? 'current-password' : 'new-password' }"
                                class="input-field"
                            />
                        </div>

                        <NButton
                            type="primary"
                            block
                            :loading="loading"
                            attr-type="submit"
                            class="submit-btn"
                        >
                            <template #icon>
                                <LogIn v-if="inputType === 'login'" />
                                <UserPlus v-else />
                            </template>
                            {{ loading ? (inputType === 'login' ? '登录中...' : '注册中...') : (inputType === 'login' ? '登录' : '注册') }}
                        </NButton>
                    </form>

                    <div class="divider">
                        <span class="divider-text">或</span>
                    </div>

                    <div class="switch-text">
                        <template v-if="inputType === 'login'">
                            还没有账号？
                            <button type="button" class="switch-btn" @click="toggleType">立即注册</button>
                        </template>
                        <template v-else>
                            已有账号？
                            <button type="button" class="switch-btn" @click="toggleType">立即登录</button>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.login-page {
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    background: hsl(var(--background));
}

.background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
}

.gradient-orb {
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, hsla(var(--accent) / 0.08) 0%, transparent 70%);
    top: -200px;
    right: -200px;
    animation: float 20s ease-in-out infinite;
}

.gradient-orb-2 {
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, hsla(var(--foreground) / 0.04) 0%, transparent 70%);
    bottom: -100px;
    left: -100px;
    animation: float 15s ease-in-out infinite reverse;
}

.grid-pattern {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image:
        linear-gradient(hsl(var(--border)) 1px, transparent 1px),
        linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px);
    background-size: 50px 50px;
    opacity: 0.4;
}

@keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -30px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
}

.theme-toggle {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 100;
}

.theme-btn {
    width: 38px;
    height: 38px;
    border-radius: 9px;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--card) / 0.8);
    color: hsl(var(--foreground));
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    backdrop-filter: blur(8px);
}

.theme-btn:hover {
    background: hsl(var(--muted));
}

.container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    max-width: 1000px;
    min-height: 560px;
    background: hsl(var(--card));
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px hsl(var(--foreground) / 0.15), 0 0 0 1px hsl(var(--border));
    overflow: hidden;
    z-index: 1;
    margin: 24px;
    animation: slideUp 0.5s ease;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.branding {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
    background: linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(222 47% 16%) 100%);
    color: hsl(210 40% 98%);
    position: relative;
    overflow: hidden;
}

.branding::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background:
        radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%);
}

.branding-content {
    position: relative;
    z-index: 1;
    text-align: center;
}

.logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 48px;
}

.logo-icon { width: 44px; height: 44px; }

.logo-text {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.5px;
}

.quote { margin: 0; }

.quote-text {
    font-size: 30px;
    font-weight: 600;
    line-height: 1.35;
    margin-bottom: 14px;
    opacity: 0.95;
}

.quote-author { font-size: 15px; opacity: 0.65; }

.form-section {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
}

.form-card {
    width: 100%;
    max-width: 380px;
}

.form-header {
    text-align: center;
    margin-bottom: 32px;
}

.title {
    font-size: 28px;
    font-weight: 700;
    color: hsl(var(--foreground));
    margin: 0 0 6px 0;
    letter-spacing: -0.03em;
}

.subtitle {
    font-size: 15px;
    color: hsl(var(--muted-foreground));
    margin: 0;
}

.error-alert { margin-bottom: 20px; }

.form :deep(.n-input) { --n-height: 46px; }
.form :deep(.n-input .n-input-wrapper) { border-radius: 10px; }
.form :deep(.n-input__input) { font-size: 15px; }

.submit-btn {
    height: 46px !important;
    border-radius: 10px !important;
    font-size: 15px !important;
    font-weight: 600 !important;
    margin-top: 8px;
}

.form-item { margin-bottom: 18px; }

.label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: hsl(var(--foreground));
    margin-bottom: 6px;
}

.input-field { width: 100%; }

.divider {
    display: flex;
    align-items: center;
    margin: 22px 0;
    color: hsl(var(--muted-foreground));
}

.divider::before,
.divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: hsl(var(--border));
}

.divider-text { padding: 0 16px; font-size: 13px; }

.switch-text {
    text-align: center;
    font-size: 14px;
    color: hsl(var(--muted-foreground));
}

.switch-btn {
    background: none;
    border: none;
    color: hsl(var(--accent));
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    font-size: 14px;
}

.switch-btn:hover { text-decoration: underline; }

@media (max-width: 900px) {
    .container { grid-template-columns: 1fr; max-width: 440px; }
    .branding { display: none; }
    .form-section { padding: 36px; }
}

@media (max-width: 480px) {
    .container { margin: 0; border-radius: 0; min-height: 100vh; }
    .form-section { padding: 28px; }
    .theme-toggle { top: 16px; right: 16px; }
}
</style>
