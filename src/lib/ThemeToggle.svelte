<script>
  import { onMount } from 'svelte'

  // 主题状态管理
  let darkMode = false

  // 初始化主题
  onMount(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('linkhub-theme')
      darkMode = stored === 'dark'
      updateTheme(darkMode)
    }
  })

  // 更新主题
  function updateTheme(isDark) {
    if (typeof window !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('linkhub-theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('linkhub-theme', 'light')
      }
    }
  }

  // 切换主题
  function toggleTheme() {
    darkMode = !darkMode
    updateTheme(darkMode)
  }
</script>

<button
  on:click={toggleTheme}
  class="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
  aria-label="切换主题"
  title={darkMode ? '切换到明亮模式' : '切换到暗黑模式'}
>
  {#if darkMode}
    <i class="fas fa-sun text-gray-700 dark:text-gray-300 text-lg"></i>
  {:else}
    <i class="fas fa-moon text-gray-700 dark:text-gray-300 text-lg"></i>
  {/if}
</button>

