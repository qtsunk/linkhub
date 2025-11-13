<script>
  import { favoritesStore } from './utils.js'
  import { tick } from 'svelte'

  export let site = {}
  export let onToggleFavorite = () => {}

  // 本地收藏状态，用于立即更新 UI
  let localFavoriteState = favoritesStore.isFavorite(site.url)

  // 检查是否已收藏 - 使用响应式语句确保实时更新
  $: {
    const storedState = favoritesStore.isFavorite(site.url)
    if (storedState !== localFavoriteState) {
      localFavoriteState = storedState
    }
  }

  // Tooltip 相关状态
  let showTooltip = false
  let tooltipPosition = 'bottom' // 'top' 或 'bottom'
  let descriptionElement
  let tooltipElement

  // 获取图标路径 - 优先级：本地图标 > Favicon.im/{domain} > 默认图标
  function getIconPath(favicon, url) {
    // 默认图标路径
    const defaultIcon = '/icons/default.svg'

    // 方式1：如果配置了本地图标，优先使用
    if (favicon) {
      // 如果是完整的URL（http:// 或 https://），直接使用
      if (favicon.startsWith('http://') || favicon.startsWith('https://')) {
        return favicon
      }

      // 如果是本地路径（以 / 开头），直接使用
      if (favicon.startsWith('/')) {
        return favicon
      }

      // 否则作为本地图标路径处理（相对于 icons 目录）
      return `/icons/${favicon}`
    }

    // 方式2：如果没有配置本地图标，使用 Favicon.im API
    if (url) {
      try {
        const urlObj = new URL(url)
        const domain = urlObj.hostname
        return `https://favicon.im/${domain}`
      } catch (e) {
        // URL 解析失败，使用默认图标
        return defaultIcon
      }
    }

    // 方式3：都没有配置，使用默认图标
    return defaultIcon
  }

  // 切换收藏状态
  function toggleFavorite(e) {
    e.stopPropagation()
    // 立即更新本地状态，实现即时 UI 反馈
    localFavoriteState = !localFavoriteState

    if (!localFavoriteState) {
      favoritesStore.removeFavorite(site.url)
    } else {
      // 添加收藏时，需要保存完整的网站信息
      favoritesStore.addFavorite(site)
    }
    // 触发父组件更新
    onToggleFavorite()
  }

  // 使用本地状态作为显示状态
  $: isFavorite = localFavoriteState

  // 打开链接
  function openLink() {
    window.open(site.url, '_blank', 'noopener,noreferrer')
  }

  // 计算图标路径 - 优先级：本地图标 > Favicon.im/{domain} > 默认图标
  $: iconPath = getIconPath(site.favicon, site.url)

  // 计算 tooltip 位置 - 根据窗口位置决定显示在上方还是下方
  async function calculateTooltipPosition() {
    if (!descriptionElement) return

    const rect = descriptionElement.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const estimatedTooltipHeight = 60 // 预估 tooltip 高度（包含文本和间距）

    // 如果下方空间不足且上方空间足够，显示在上方
    if (spaceBelow < estimatedTooltipHeight && spaceAbove > spaceBelow) {
      tooltipPosition = 'top'
    } else {
      tooltipPosition = 'bottom'
    }

    // 等待 DOM 更新后，根据实际 tooltip 高度再次调整位置
    await tick()
    if (tooltipElement) {
      const tooltipRect = tooltipElement.getBoundingClientRect()
      const actualTooltipHeight = tooltipRect.height

      // 如果实际高度导致位置不合适，重新调整
      if (tooltipPosition === 'bottom' && spaceBelow < actualTooltipHeight && spaceAbove > spaceBelow) {
        tooltipPosition = 'top'
      } else if (tooltipPosition === 'top' && spaceAbove < actualTooltipHeight && spaceBelow > spaceAbove) {
        tooltipPosition = 'bottom'
      }
    }
  }

  // 鼠标进入描述区域
  async function handleMouseEnter(e) {
    // 只有当描述文本超出显示区域时才显示 tooltip
    if (descriptionElement && descriptionElement.scrollWidth > descriptionElement.clientWidth) {
      showTooltip = true
      // 计算 tooltip 位置
      await calculateTooltipPosition()
    }
  }

  // 鼠标离开描述区域
  function handleMouseLeave() {
    showTooltip = false
  }
</script>

<div
  class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-4 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
  on:click={openLink}
  role="button"
  tabindex="0"
  on:keydown={(e) => e.key === 'Enter' && openLink()}
>
  <div class="flex items-start gap-3">
    <!-- Favicon -->
    <div class="flex-shrink-0">
      <img
        src={iconPath}
        alt={site.name}
        class="w-8 h-8"
        on:error={(e) => {
          // 如果图标加载失败，使用默认图标
          const target = e.target
          if (target && target instanceof HTMLImageElement) {
            target.src = '/icons/default.svg'
            target.onerror = null // 防止再次触发错误
          }
        }}
      />
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 min-w-0">
      <h3 class="font-semibold text-gray-900 dark:text-white mb-1 truncate">
        {site.name}
      </h3>
      <!-- 描述文本容器 - 使用相对定位以便 tooltip 定位 -->
      <div class="relative">
        <p
          bind:this={descriptionElement}
          class="text-sm text-gray-600 dark:text-gray-400 truncate whitespace-nowrap overflow-hidden"
          on:mouseenter={handleMouseEnter}
          on:mouseleave={handleMouseLeave}
        >
          {site.description || '暂无描述'}
        </p>

        <!-- Tooltip - 根据位置显示在上方或下方 -->
        {#if showTooltip && (site.description || '暂无描述') !== '暂无描述'}
          <div
            bind:this={tooltipElement}
            class="absolute left-0 z-50 px-3 py-2 text-xs text-white bg-gray-700 dark:bg-gray-700 rounded shadow-lg whitespace-normal max-w-xs {tooltipPosition === 'top'
              ? 'bottom-full mb-1'
              : 'top-full mt-1'}"
            role="tooltip"
          >
            {site.description || '暂无描述'}
            <!-- Tooltip 箭头 -->
            <div
              class="absolute left-4 w-0 h-0 border-4 border-transparent {tooltipPosition === 'top'
                ? 'top-full border-t-gray-700 dark:border-t-gray-700'
                : 'bottom-full border-b-gray-700 dark:border-b-gray-700'}"
            ></div>
          </div>
        {/if}
      </div>
    </div>

    <!-- 收藏按钮 -->
    <button
      on:click={toggleFavorite}
      class="flex-shrink-0 p-1 transition-colors"
      aria-label={isFavorite ? '取消收藏' : '收藏'}
      title={isFavorite ? '取消收藏' : '收藏'}
    >
      <i
        class="fas fa-star {isFavorite
          ? 'text-yellow-400 dark:text-yellow-500'
          : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-500'}"
      ></i>
    </button>
  </div>
</div>

