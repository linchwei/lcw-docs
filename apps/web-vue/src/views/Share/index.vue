<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NInput, NSpin } from 'naive-ui'
import { Eye, PenLine } from 'lucide-vue-next'

import * as srv from '@/services'
import { LcwDocEditor } from '@lcw-doc/core'
import { LcwDocView } from '@lcw-doc/vue'

const route = useRoute()
const shareId = route.params.shareId as string

const shareInfo = ref<any>(null)
const pageContent = ref<any>(null)
const password = ref('')
const needPassword = ref(false)
const error = ref('')
const loading = ref(true)
const passwordError = ref('')
const editor = ref<LcwDocEditor<any, any, any> | null>(null)

const permissionLabels: Record<string, { label: string; icon: any; className: string }> = {
    view: { label: '只读', icon: Eye, className: 'view-perm' },
    comment: { label: '可评论', icon: Eye, className: 'comment-perm' },
    edit: { label: '可编辑', icon: PenLine, className: 'edit-perm' },
}

async function loadShareInfo(pwd?: string) {
    if (!shareId) return
    try {
        loading.value = true
        error.value = ''
        passwordError.value = ''
        const res: any = await srv.fetchShareInfo(shareId, pwd)
        shareInfo.value = res.data
        needPassword.value = false

        // Load content
        if (res.data?.pageId) {
            pageContent.value = res.data
        }
    } catch (err: any) {
        if (err?.response?.status === 401) {
            needPassword.value = true
            if (pwd) {
                passwordError.value = '密码错误，请重试'
            }
        } else if (err?.response?.status === 410) {
            error.value = '分享链接已过期'
        } else {
            error.value = '分享链接不存在或无效'
        }
    } finally {
        loading.value = false
    }
}

function handlePasswordSubmit() {
    loadShareInfo(password.value)
}

onMounted(() => {
    if (shareId) {
        loadShareInfo()
    }
})

const permInfo = computed(() => {
    if (!shareInfo.value) return permissionLabels.view
    return permissionLabels[shareInfo.value.permission] || permissionLabels.view
})

const PermIcon = computed(() => permInfo.value.icon)
</script>

<template>
    <div class="share-page">
        <!-- Loading state -->
        <div v-if="loading" class="share-center">
            <NSpin />
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="share-center">
            <div class="share-error">
                <p class="error-title">{{ error }}</p>
                <p class="error-desc">请联系分享者获取新的链接</p>
            </div>
        </div>

        <!-- Password prompt -->
        <div v-else-if="needPassword" class="share-center">
            <div class="password-box">
                <h2 class="password-title">此链接需要密码访问</h2>
                <NInput
                    v-model:value="password"
                    type="password"
                    placeholder="请输入访问密码"
                    @keyup.enter="handlePasswordSubmit"
                />
                <p v-if="passwordError" class="password-error">{{ passwordError }}</p>
                <NButton type="primary" class="password-btn" @click="handlePasswordSubmit">
                    确认
                </NButton>
            </div>
        </div>

        <!-- Share content -->
        <template v-else-if="shareInfo">
            <!-- Header bar -->
            <div class="share-header">
                <div class="share-header-inner">
                    <div class="share-header-left">
                        <div class="share-logo">
                            <div class="share-logo-icon" />
                        </div>
                        <span class="share-title-text">{{ shareInfo?.title || '共享文档' }}</span>
                    </div>
                    <div class="share-header-right">
                        <span :class="['perm-badge', permInfo.className]">
                            <component :is="PermIcon" size="12" />
                            {{ permInfo.label }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Editor content -->
            <div class="share-content">
                <div class="share-editor">
                    <div class="bn-default-styles">
                        <p class="share-placeholder">分享内容加载中...</p>
                    </div>
                </div>
                <div class="share-footer-text">
                    由 LcwDoc 提供支持
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
.share-page {
    min-height: 100vh;
    background: white;
}

.share-center {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
}

.share-error {
    text-align: center;
}

.error-title {
    font-size: 18px;
    font-weight: 600;
    color: #52525b;
    margin: 0 0 8px;
}

.error-desc {
    font-size: 14px;
    color: #a1a1aa;
    margin: 0;
}

.password-box {
    width: 320px;
    text-align: center;
}

.password-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px;
    color: #334155;
}

.password-error {
    color: #ef4444;
    font-size: 14px;
    margin: 8px 0;
}

.password-btn {
    width: 100%;
    margin-top: 12px;
}

/* Header */
.share-header {
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid #f1f5f9;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(8px);
}

.share-header-inner {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 24px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.share-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.share-logo-icon {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: #6B45FF;
    display: flex;
    align-items: center;
    justify-content: center;
}

.share-logo-icon::after {
    content: '';
    width: 12px;
    height: 14px;
    border-radius: 1px;
    background: rgba(255,255,255,0.9);
}

.share-title-text {
    font-size: 14px;
    font-weight: 500;
    color: #51525b;
}

.share-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.perm-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
}

.perm-badge.view-perm {
    background: #f4f4f5;
    color: #71717a;
}

.perm-badge.comment-perm {
    background: #fffbeb;
    color: #d97706;
}

.perm-badge.edit-perm {
    background: #eff6ff;
    color: #2563eb;
}

/* Content */
.share-content {
    max-width: 900px;
    margin: 0 auto;
    padding: 48px 24px;
}

.share-editor {
    min-height: 400px;
}

.share-placeholder {
    color: #a1a1aa;
    font-size: 16px;
    text-align: center;
    padding: 80px 0;
}

.share-footer-text {
    text-align: center;
    font-size: 12px;
    color: #a1a1aa;
    padding: 32px 0;
}
</style>
