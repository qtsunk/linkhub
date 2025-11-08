<script>
  import { createEventDispatcher } from 'svelte'
  import { onMount } from 'svelte'

  export let value = ''
  export let placeholder = 'Search...'
  export let allCategoriesData = [] // 所有分类数据
  export let onResultClick = () => {} // 点击搜索结果回调

  const dispatch = createEventDispatcher()

  // 搜索结果
  let searchResults = []
  let showDropdown = false
  let selectedIndex = -1

  // 响应式更新搜索结果 - 当数据或输入值变化时重新搜索
  $: if (value && value.trim() && allCategoriesData && allCategoriesData.length > 0) {
    const query = value.trim()
    if (query) {
      performSearch(query)
      // 显示下拉框（有结果或无结果都显示）
      showDropdown = true
    } else {
      searchResults = []
      showDropdown = false
    }
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
  }

  // 键盘导航
  function handleKeyDown(e) {
    if (!showDropdown || searchResults.length === 0) {
      if (e.key === 'Escape') {
        showDropdown = false
        selectedIndex = -1
      }
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
    } else if (e.key === 'Escape') {
      showDropdown = false
      selectedIndex = -1
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

  // 点击外部关闭下拉框
  function handleClickOutside(e) {
    if (!e.target.closest('.search-container')) {
      showDropdown = false
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  })
</script>

<div class="search-container relative flex-1">
  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <i class="fas fa-search text-gray-400 dark:text-gray-500"></i>
  </div>
  <input
    type="text"
    {value}
    {placeholder}
    on:input={handleInput}
    on:keydown={handleKeyDown}
    on:focus={() => {
      if (searchResults.length > 0) {
        showDropdown = true
      }
    }}
    class="w-full h-10 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent"
  />

  <!-- 搜索结果下拉框 -->
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
                // 如果图标加载失败，使用默认图标
                e.target.src = '/icons/default.svg'
                e.target.onerror = null
              }}
            />
            <!-- 内容 -->
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white truncate flex items-baseline gap-2">
                <span>{result.name}</span>
                {#if result.description}
                  <span class="text-sm font-normal text-gray-400 dark:text-gray-500">
                    {result.description}
                  </span>
                {/if}
              </div>
              <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {result.category} / {result.subcategory}
              </div>
            </div>
          </div>
        </button>
      {/each}
    </div>
  {/if}

  <!-- 无结果提示 -->
  {#if showDropdown && value.trim() && searchResults.length === 0}
    <div class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500 dark:text-gray-400">
      未找到匹配结果
    </div>
  {/if}
</div>
