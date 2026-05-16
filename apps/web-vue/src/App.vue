<script setup lang="ts">
import { NConfigProvider, NNotificationProvider, NMessageProvider, NDialogProvider, zhCN, dateZhCN } from 'naive-ui'
import { useThemeStore } from './stores/theme'
import { setDefaultOptions } from 'date-fns'
import { zhCN as fnsZhCN } from 'date-fns/locale'

setDefaultOptions({ locale: fnsZhCN })

const themeStore = useThemeStore()
themeStore.applyInitialTheme()
</script>

<template>
    <NConfigProvider :theme="themeStore.naiveTheme" :locale="zhCN" :date-locale="dateZhCN">
        <NNotificationProvider>
            <NMessageProvider>
                <NDialogProvider>
                    <RouterView />
                </NDialogProvider>
            </NMessageProvider>
        </NNotificationProvider>
    </NConfigProvider>
</template>
