<script>
  import { createEventDispatcher } from 'svelte'
  import { onMount, onDestroy } from 'svelte'
  import { fade } from 'svelte/transition'

  export let value = ''
  export let placeholder = 'Search...'
  export let allCategoriesData = [] // 所有分类数据
  /** @type {(result: any) => void} */
  export let onResultClick = () => {} // 点击搜索结果回调

  const dispatch = createEventDispatcher()

  // 搜索结果
  let searchResults = []
  let showDropdown = false
  let selectedIndex = -1

  // 移动端悬浮模式
  let isMobileExpanded = false
  let isMobile = false
  let searchInputElement

  // 导出方法：外部可以触发展开移动端搜索框
  export function expandMobileSearch() {
    // 重新检测是否为移动端
    checkMobile()
    // 强制展开移动端搜索框
    isMobileExpanded = true
    // 阻止 body 滚动
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'
    }
    // 延迟聚焦输入框，确保 DOM 更新完成
    setTimeout(() => {
      if (searchInputElement) {
        searchInputElement.focus()
      }
    }, 100)
  }

  // 搜索输入处理
  function handleInput(e) {
    const newValue = e.target.value
    value = newValue
    dispatch('search', newValue)

    // 执行搜索 - 确保数据已加载
    if (newValue.trim()) {
      if (allCategoriesData && allCategoriesData.length > 0) {
        performSearch(newValue.trim())
        showDropdown = true
        // 移动端有输入时自动展开
        if (isMobile && !isMobileExpanded) {
          expandMobile()
        }
      } else {
        // 如果数据还没加载完成，清空结果但不显示下拉框
        searchResults = []
        showDropdown = false
      }
    } else {
      searchResults = []
      showDropdown = false
    }
  }

  // 执行搜索 - 在所有分类中搜索网站
  function performSearch(query) {
    const queryLower = query.toLowerCase()
    const results = []

    // 遍历所有分类数据
    if (allCategoriesData && allCategoriesData.length > 0) {
      allCategoriesData.forEach(categoryData => {
        if (categoryData && categoryData.data && Array.isArray(categoryData.data)) {
          categoryData.data.forEach(subcategory => {
            if (subcategory && subcategory.sites && Array.isArray(subcategory.sites)) {
              subcategory.sites.forEach(site => {
                // 搜索网站名称和描述
                if (site && site.name) {
                  const nameMatch = site.name.toLowerCase().includes(queryLower)
                  const descMatch = site.description && site.description.toLowerCase().includes(queryLower)

                  if (nameMatch || descMatch) {
                    results.push({
                      ...site,
                      category: categoryData.categoryName || '未分类',
                      subcategory: subcategory.subcategory || '未分类'
                    })
                  }
                }
              })
            }
          })
        }
      })
    }

    // 限制搜索结果数量并更新结果
    searchResults = results.slice(0, 10)
  }

  // 点击搜索结果
  function handleResultClick(result) {
    onResultClick(result)
    showDropdown = false
    value = ''
    dispatch('search', '')
    // 移动端点击结果后关闭悬浮框
    if (isMobileExpanded) {
      collapseMobile()
    }
  }

  // 鼠标悬停时更新选中索引
  function handleMouseEnter(index) {
    selectedIndex = index
  }

  // 获取图标路径 - 优先级：本地图标 > Favicon.im/{domain} > 默认图标（与 LinkCard.svelte 逻辑一致）
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

  // 检测是否为移动端
  function checkMobile() {
    if (typeof window !== 'undefined') {
      isMobile = window.innerWidth < 1024 // lg 断点
    }
  }

  // 展开移动端搜索框
  function expandMobile() {
    // 重新检测是否为移动端
    checkMobile()
    // 如果是移动端或者是通过外部调用触发的，都允许展开
    isMobileExpanded = true
    // 阻止 body 滚动
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'
    }
    // 延迟聚焦输入框，确保 DOM 更新完成
    setTimeout(() => {
      if (searchInputElement) {
        searchInputElement.focus()
      }
    }, 100)
  }

  // 收起移动端搜索框
  function collapseMobile() {
    isMobileExpanded = false
    showDropdown = false
    selectedIndex = -1
    // 恢复 body 滚动
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
    }
    // 失焦输入框
    if (searchInputElement) {
      searchInputElement.blur()
    }
  }

  // 处理搜索框焦点事件
  function handleFocus() {
    if (isMobile) {
      expandMobile()
    } else {
      if (searchResults.length > 0) {
        showDropdown = true
      }
    }
  }

  // 点击外部关闭下拉框（桌面端）
  function handleClickOutside(e) {
    // 桌面端：点击搜索容器外部关闭下拉框
    if (!isMobileExpanded && !e.target.closest('.search-container')) {
      showDropdown = false
    }
  }

  // 处理键盘事件
  function handleKeyDown(e) {
    // ESC 键：关闭移动端搜索框或下拉框
    if (e.key === 'Escape') {
      if (isMobileExpanded) {
        collapseMobile()
        return
      } else {
        showDropdown = false
        selectedIndex = -1
        return
      }
    }

    // 移动端悬浮模式下的键盘处理
    if (isMobileExpanded) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (searchResults.length > 0) {
          selectedIndex = Math.min(selectedIndex + 1, searchResults.length - 1)
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        selectedIndex = Math.max(selectedIndex - 1, -1)
      } else if (e.key === 'Enter' && selectedIndex >= 0 && searchResults.length > 0) {
        e.preventDefault()
        handleResultClick(searchResults[selectedIndex])
        collapseMobile()
      }
      return
    }

    // 桌面端的键盘导航
    if (!showDropdown || searchResults.length === 0) {
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedIndex = Math.min(selectedIndex + 1, searchResults.length - 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedIndex = Math.max(selectedIndex - 1, -1)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleResultClick(searchResults[selectedIndex])
    }
  }

  // 响应式更新搜索结果
  $: if (value && value.trim() && allCategoriesData && allCategoriesData.length > 0) {
    const query = value.trim()
    if (query) {
      performSearch(query)
      // 显示下拉框（有结果或无结果都显示）
      showDropdown = true
      // 移动端悬浮模式自动展开
      if (isMobile && !isMobileExpanded && query) {
        expandMobile()
      }
    } else {
      searchResults = []
      showDropdown = false
    }
  }

  onMount(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    document.addEventListener('click', handleClickOutside)

    return () => {
      window.removeEventListener('resize', checkMobile)
      document.removeEventListener('click', handleClickOutside)
      // 清理时恢复 body 滚动
      if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
      }
    }
  })

  onDestroy(() => {
    // 组件销毁时恢复 body 滚动
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
    }
  })
</script>

<!-- 移动端悬浮搜索框遮罩层 -->
{#if isMobileExpanded}
  <div
    class="mobile-search-overlay fixed inset-0 bg-black bg-opacity-50 z-[49] lg:hidden"
    role="button"
    tabindex="0"
    on:click={collapseMobile}
    on:keydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        collapseMobile()
      }
    }}
    aria-label="关闭搜索"
    transition:fade={{ duration: 200 }}
  ></div>
{/if}

<!-- 移动端悬浮搜索框 -->
{#if isMobileExpanded}
  <div
    class="mobile-search-content fixed top-0 left-0 right-0 z-50 bg-gray-50 dark:bg-gray-900 lg:hidden"
    transition:fade={{ duration: 200 }}
  >
    <div class="px-4 py-3 flex items-center gap-3">
      <!-- 搜索输入框 -->
      <div class="flex-1 relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i class="fas fa-search text-gray-400 dark:text-gray-500"></i>
        </div>
        <input
          bind:this={searchInputElement}
          type="text"
          {value}
          {placeholder}
          on:input={handleInput}
          on:keydown={handleKeyDown}
          class="w-full h-12 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent text-base"
        />
      </div>
      <!-- 关闭按钮 -->
      <button
        on:click={collapseMobile}
        class="h-12 w-12 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        aria-label="关闭搜索"
      >
        <i class="fas fa-times text-lg"></i>
      </button>
    </div>

    <!-- 移动端搜索结果 -->
    {#if showDropdown && searchResults.length > 0}
      <div class="px-4 pb-4 max-h-[calc(100vh-80px)] overflow-y-auto">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          {#each searchResults as result, index}
            <button
              on:click={() => handleResultClick(result)}
              on:mouseenter={() => handleMouseEnter(index)}
              class="w-full text-left px-4 py-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 {selectedIndex === index
                ? 'bg-gray-100 dark:bg-gray-700'
                : ''}"
            >
              <div class="flex items-start gap-4">
                <!-- Favicon -->
                <div class="flex-shrink-0">
                  <img
                    src={getIconPath(result.favicon, result.url)}
                    alt={result.name}
                    class="w-10 h-10 rounded"
                    on:error={(e) => {
                      const target = e.target
                      if (target && target instanceof HTMLImageElement) {
                        target.src = '/icons/default.svg'
                        target.onerror = null
                      }
                    }}
                  />
                </div>
                <!-- 内容 -->
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-gray-900 dark:text-white mb-1 text-base">
                    {result.name}
                  </div>
                  {#if result.description}
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {result.description}
                    </div>
                  {/if}
                  <div class="text-xs text-gray-400 dark:text-gray-500">
                    {result.category} / {result.subcategory}
                  </div>
                </div>
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- 移动端无结果提示 -->
    {#if showDropdown && value.trim() && searchResults.length === 0}
      <div class="px-4 pb-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          未找到匹配结果
        </div>
      </div>
    {/if}
  </div>
{/if}

<!-- 桌面端搜索框（原有样式） -->
<div class="search-container relative flex-1 hidden lg:block">
  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <i class="fas fa-search text-gray-400 dark:text-gray-500"></i>
  </div>
  <input
    type="text"
    {value}
    {placeholder}
    on:input={handleInput}
    on:keydown={handleKeyDown}
    on:focus={handleFocus}
    class="w-full h-10 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent"
  />

  <!-- 桌面端搜索结果下拉框 -->
  {#if showDropdown && searchResults.length > 0}
    <div class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {#each searchResults as result, index}
        <button
          on:click={() => handleResultClick(result)}
          on:mouseenter={() => handleMouseEnter(index)}
          class="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors {selectedIndex === index
            ? 'bg-gray-100 dark:bg-gray-700'
            : ''}"
        >
          <div class="flex items-start gap-3">
            <!-- Favicon -->
            <img
              src={getIconPath(result.favicon, result.url)}
              alt={result.name}
              class="w-6 h-6 flex-shrink-0"
              on:error={(e) => {
                const target = e.target
                if (target && target instanceof HTMLImageElement) {
                  target.src = '/icons/default.svg'
                  target.onerror = null
                }
              }}
            />
            <!-- 内容 -->
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white truncate flex items-baseline gap-2">
                <span>{result.name}</span>
                <span class="text-xs font-normal text-gray-400 dark:text-gray-500">
                  {result.category} / {result.subcategory}
                </span>
              </div>
              {#if result.description}
                <div class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                  {result.description}
                </div>
              {/if}
            </div>
          </div>
        </button>
      {/each}
    </div>
  {/if}

  <!-- 桌面端无结果提示 -->
  {#if showDropdown && value.trim() && searchResults.length === 0}
    <div class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500 dark:text-gray-400">
      未找到匹配结果
    </div>
  {/if}
</div>