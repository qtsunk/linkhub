<script>
  import { onMount } from 'svelte'
  import { dndzone } from 'svelte-dnd-action'
  import LinkCard from './LinkCard.svelte'
  import { favoritesStore } from '../lib/utils.js'

  export let favorites = []

  const CATEGORY_ORDER_STORAGE_KEY = 'linkhub-category-order'
  const CATEGORY_ITEM_ORDER_STORAGE_KEY = 'linkhub-category-item-order'

  // 收藏及排序相关状态
  let favoriteUpdateTrigger = 0
  let categoryOrder = []
  let categoryOrderHydrated = false
  let itemOrder = {}
  let itemOrderHydrated = false
  // 排序模式状态与临时卡片列表
  let reorderMode = false
  let reorderLists = {}

  onMount(() => {
    categoryOrder = loadCategoryOrder()
    categoryOrderHydrated = true
    itemOrder = loadItemOrder()
    itemOrderHydrated = true
  })

  // 收藏动作触发更新
  function handleFavoriteToggle() {
    favoriteUpdateTrigger++
    favorites = favoritesStore.getFavorites()
  }

  // 监听收藏变化
  $: if (favoriteUpdateTrigger >= 0) {
    favorites = favoritesStore.getFavorites()
  }

  // 按分类聚合收藏
  $: groupedFavorites = favorites.reduce((acc, site) => {
    const category = site.category || '未分类'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(site)
    return acc
  }, {})

  // 导出收藏
  function exportFavorites() {
    favoritesStore.exportFavorites()
  }

  // 导入收藏
  function importFavorites(event) {
    const file = event.target.files[0]
    if (!file) return
    favoritesStore
      .importFavorites(file)
      .then(data => {
        favorites = data
        alert('收藏导入成功！')
      })
      .catch(error => {
        alert('导入失败：' + error.message)
      })
  }

  // 加载分类排序
  function loadCategoryOrder() {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(CATEGORY_ORDER_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('读取分类排序失败', error)
      return []
    }
  }

  // 保存分类排序
  function persistCategoryOrder(order) {
    if (typeof window === 'undefined') return
    localStorage.setItem(CATEGORY_ORDER_STORAGE_KEY, JSON.stringify(order))
  }

  // 设置分类排序
  function setCategoryOrder(order, { persist = false } = {}) {
    categoryOrder = order
    if (persist && categoryOrderHydrated) {
      persistCategoryOrder(order)
    }
  }

  // 加载卡片排序
  function loadItemOrder() {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem(CATEGORY_ITEM_ORDER_STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.warn('读取卡片排序失败', error)
      return {}
    }
  }

  // 保存卡片排序
  function persistItemOrder(order) {
    if (typeof window === 'undefined') return
    localStorage.setItem(CATEGORY_ITEM_ORDER_STORAGE_KEY, JSON.stringify(order))
  }

  // 设置卡片排序
  function setItemOrder(order, { persist = false } = {}) {
    itemOrder = order
    if (persist && itemOrderHydrated) {
      persistItemOrder(order)
    }
  }

  // 合并分类排序，保持已存在分类顺序
  function mergeCategoryOrder(order, categories) {
    const existing = order.filter(category => categories.includes(category))
    const newOnes = categories.filter(category => !existing.includes(category))
    return [...existing, ...newOnes]
  }

  // 合并卡片排序，保持已存在卡片顺序
  function mergeItemOrderForCategory(existingOrder = [], urls = []) {
    const filtered = existingOrder.filter(url => urls.includes(url))
    const newOnes = urls.filter(url => !filtered.includes(url))
    return [...filtered, ...newOnes]
  }

  // 比较数组是否相等
  function arraysEqual(a = [], b = []) {
    return a.length === b.length && a.every((item, index) => item === b[index])
  }

  $: categoryKeys = Object.keys(groupedFavorites)

  $: if (categoryKeys.length > 0) {
    const mergedOrder = mergeCategoryOrder(categoryOrder, categoryKeys)
    if (!arraysEqual(mergedOrder, categoryOrder)) {
      setCategoryOrder(mergedOrder)
    }
  } else if (categoryOrder.length > 0) {
    setCategoryOrder([])
  }

  $: orderedCategories = categoryOrder.length > 0
    ? categoryOrder.filter(category => groupedFavorites[category])
    : categoryKeys

  $: if (!reorderMode && orderedCategories.length > 0) {
    const nextOrder = { ...itemOrder }
    let changed = false

    orderedCategories.forEach(category => {
      const urls = (groupedFavorites[category] || []).map(site => site.url)
      const merged = mergeItemOrderForCategory(nextOrder[category] || [], urls)
      if (!arraysEqual(merged, nextOrder[category] || [])) {
        nextOrder[category] = merged
        changed = true
      }
    })

    Object.keys(nextOrder).forEach(category => {
      if (!orderedCategories.includes(category)) {
        delete nextOrder[category]
        changed = true
      }
    })

    if (changed) {
      setItemOrder(nextOrder)
    }
  }

  // 普通模式渲染依据本地持久化顺序
  // 普通模式下根据 itemOrder 渲染排序结果
  $: orderedSitesByCategory = orderedCategories.reduce((acc, category) => {
    acc[category] = getOrderedSites(category, itemOrder[category])
    return acc
  }, {})

  // 依据指定顺序返回当前分类的卡片数组
  function getOrderedSites(category, orderList = itemOrder[category]) {
    const sites = groupedFavorites[category] || []
    const order = orderList && orderList.length > 0 ? orderList : null
    if (!order || order.length === 0) return sites

    const siteMap = new Map(sites.map(site => [site.url, site]))
    const ordered = []

    order.forEach(url => {
      if (siteMap.has(url)) {
        ordered.push(siteMap.get(url))
        siteMap.delete(url)
      }
    })

    sites.forEach(site => {
      if (siteMap.has(site.url)) {
        ordered.push(site)
        siteMap.delete(site.url)
      }
    })

    return ordered
  }

  // 进入排序模式前构建 dnd 专用列表
  // 排序模式使用的 dnd 列表（含唯一 id）
  function buildReorderLists() {
    reorderLists = orderedCategories.reduce((acc, category) => {
      acc[category] = (orderedSitesByCategory[category] || []).map(site => ({
        id: `${category}:${site.url}`,
        site
      }))
      return acc
    }, {})
  }

  // 拖拽完成后将顺序写回 itemOrder
  function persistReorderResults() {
    if (!reorderMode) return
    if (Object.keys(reorderLists).length === 0) return

    const nextOrder = { ...itemOrder }
    Object.entries(reorderLists).forEach(([category, items]) => {
      nextOrder[category] = items.map(item => item.site.url)
    })
    setItemOrder(nextOrder, { persist: true })
  }

  // 排序模式开关：退出时自动保存
  function toggleReorderMode() {
    if (reorderMode) {
      persistReorderResults()
      reorderLists = {}
      reorderMode = false
    } else {
      buildReorderLists()
      reorderMode = true
    }
  }

  // dnd 预览阶段，同步临时列表
  function handleDndConsider(category, event) {
    if (!reorderMode) return
    const { items } = event.detail
    reorderLists = { ...reorderLists, [category]: items }
  }

  // dnd 完成阶段，立即写入持久化顺序
  function handleDndFinalize(category, event) {
    if (!reorderMode) return
    const { items } = event.detail
    reorderLists = { ...reorderLists, [category]: items }
    persistReorderResults()
  }

  // 根据模式返回真实渲染源数据
  function getRenderSites(category) {
    return reorderMode
      ? reorderLists[category] || []
      : (orderedSitesByCategory[category] || []).map(site => ({ site, id: `${category}:${site.url}` }))
  }

  // 分类排序（上下移动按钮）
  function moveCategory(category, direction) {
    const currentIndex = orderedCategories.indexOf(category)
    if (currentIndex === -1) return
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= orderedCategories.length) return

    const updatedOrder = [...orderedCategories]
    const [moved] = updatedOrder.splice(currentIndex, 1)
    updatedOrder.splice(targetIndex, 0, moved)
    setCategoryOrder(updatedOrder, { persist: true })
  }

  // 卡片排序（上下移动按钮）
  function handleMoveButtonClick(event, category, direction) {
    moveCategory(category, direction)
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.blur()
    }
  }
</script>

<div class="space-y-6">
  <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div class="w-full md:w-auto text-center md:text-left">
      <h1 class="text-2xl font-normal text-gray-600 dark:text-gray-400">
        我的收藏
      </h1>
    </div>
    <div class="w-full md:w-auto flex flex-wrap gap-2 justify-center md:justify-end">
      <div class="flex flex-wrap gap-2 justify-center">
        <button
          type="button"
          on:click={toggleReorderMode}
          class={`px-4 py-2 rounded-lg transition-colors border ${reorderMode
            ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-500'
            : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          aria-pressed={reorderMode}
        >
          <i class="fas fa-grip-vertical mr-2"></i>{reorderMode ? '完成' : '排序'}
        </button>
        <button
          on:click={exportFavorites}
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
        >
          <i class="fas fa-download mr-2"></i>导出
        </button>
        <label
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors cursor-pointer"
        >
          <i class="fas fa-upload mr-2"></i>导入
          <input
            type="file"
            accept=".json"
            on:change={importFavorites}
            class="hidden"
          />
        </label>
      </div>
    </div>
  </div>

  {#if favorites.length === 0}
    <div class="text-center py-12">
      <i class="fas fa-star text-4xl text-gray-400 dark:text-gray-600 mb-4"></i>
      <p class="text-gray-600 dark:text-gray-400 mb-8">
        还没有任何收藏
      </p>
      <div class="max-w-xl mx-auto text-sm text-gray-500 dark:text-gray-500 space-y-1.5">
        <p>收藏数据仅保存在浏览器本地，服务器不存储任何用户数据。</p>
        <p>清理缓存或更换设备前，请先导出备份数据。</p>
      </div>
    </div>
  {:else}
    {#each orderedCategories as category, index (category)}
      {#if groupedFavorites[category]}
        <div class="category-block">
          <div class="flex items-center justify-between mb-4 gap-2">
            <h2 class="text-xl font-normal text-gray-600 dark:text-gray-400">
              {category}
            </h2>
            <div class="flex items-center gap-1 text-gray-400 category-sort-controls">
              <button
                type="button"
                class="p-2 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-40"
                on:click={(event) => handleMoveButtonClick(event, category, 'up')}
                disabled={index === 0}
                aria-label="分类上移"
                title="分类上移"
              >
                <i class="fas fa-chevron-up"></i>
              </button>
              <button
                type="button"
                class="p-2 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-40"
                on:click={(event) => handleMoveButtonClick(event, category, 'down')}
                disabled={index === orderedCategories.length - 1}
                aria-label="分类下移"
                title="分类下移"
              >
                <i class="fas fa-chevron-down"></i>
              </button>
            </div>
          </div>

          {#if reorderMode}
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              use:dndzone={{
                items: reorderLists[category] || [],
                flipDurationMs: 150,
                dropFromOthersDisabled: true
              }}
              on:consider={(event) => handleDndConsider(category, event)}
              on:finalize={(event) => handleDndFinalize(category, event)}
            >
              {#each reorderLists[category] || [] as item (item.id)}
                <div class="reorder-card border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm">
                  <div class="flex justify-end mb-2">
                    <span class="favorite-drag-handle inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded cursor-grab active:cursor-grabbing">
                      <i class="fas fa-grip-lines"></i>
                      拖动
                    </span>
                  </div>
                  <LinkCard
                    site={item.site}
                    disableOpen={true}
                    showFavoriteButton={false}
                  />
                </div>
              {/each}
            </div>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {#each orderedSitesByCategory[category] || [] as site (site.url)}
                <LinkCard
                  site={site}
                  hideFavoriteButtonUntilHover={true}
                  onToggleFavorite={handleFavoriteToggle}
                />
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    {/each}
  {/if}
</div>

<style>
  :global(.category-block .category-sort-controls) {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  @media (hover: hover) and (pointer: fine) {
    :global(.category-block .category-sort-controls) {
      opacity: 0;
      pointer-events: none;
      transform: translateY(-2px);
    }

    :global(.category-block:hover .category-sort-controls),
    :global(.category-block:focus-within .category-sort-controls) {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }
  }

  :global(.reorder-card) {
    min-height: 9rem;
  }
</style>
