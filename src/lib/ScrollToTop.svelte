<script>
  import { onMount, onDestroy } from 'svelte'
  import { slide } from 'svelte/transition'

  let showButton = false
  let lastScrollTop = 0 // 上次滚动位置，用于判断滚动方向

  // 监听滚动事件 - 监听 window 的滚动
  function handleScroll() {
    // 获取 window 的滚动位置
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0

    // 如果滚动到顶部，隐藏按钮
    if (scrollTop <= 0) {
      showButton = false
      lastScrollTop = 0
      return
    }

    // 判断滚动方向：向上滚动（scrollTop 减小）时显示按钮，否则隐藏
    const isScrollingUp = scrollTop < lastScrollTop
    showButton = isScrollingUp

    // 更新上次滚动位置
    lastScrollTop = scrollTop
  }

  // 滚动到顶部
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  onMount(() => {
    // 监听 window 的滚动事件
    window.addEventListener('scroll', handleScroll, { passive: true })
    // 初始化检查
    lastScrollTop = window.pageYOffset || document.documentElement.scrollTop || 0
    handleScroll()
  })

  onDestroy(() => {
    // 移除 window 的滚动事件监听
    window.removeEventListener('scroll', handleScroll)
  })
</script>

{#if showButton}
  <button
    on:click={scrollToTop}
    class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-12 h-12 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
    aria-label="回到顶部"
    title="回到顶部"
    transition:slide={{ axis: 'y', duration: 200 }}
  >
    <i class="fas fa-arrow-up text-lg"></i>
  </button>
{/if}
