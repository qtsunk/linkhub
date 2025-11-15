<script>
  import { onMount } from 'svelte'
  import Sidebar from './lib/Sidebar.svelte'
  import Navbar from './lib/Navbar.svelte'
  import Category from './lib/Category.svelte'
  import Favorites from './lib/Favorites.svelte'
  import LinkCard from './lib/LinkCard.svelte'
  import ScrollToTop from './lib/ScrollToTop.svelte'
  import { favoritesStore } from './lib/utils.js'

  // 侧边栏状态键名
  const SIDEBAR_STATE_KEY = 'linkhub-sidebar-open'

  // 初始化侧边栏状态（移动端默认关闭）
  function getInitialSidebarState() {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem(SIDEBAR_STATE_KEY)
    if (stored !== null) {
      return stored === 'true'
    }
    const isMobile = window.matchMedia('(max-width: 1023px)').matches
    const initial = !isMobile
    localStorage.setItem(SIDEBAR_STATE_KEY, initial ? 'true' : 'false')
    return initial
  }

  // 状态管理
  let categories = []
  let currentCategory = null
  let currentSubcategory = null // 当前选中的二级分类
  let categoryData = []
  let allCategoriesData = [] // 所有分类数据，用于全局搜索
  let searchQuery = ''
  let sidebarOpen = getInitialSidebarState()
  let showFavorites = true // 默认显示收藏页面（首页）
  let loading = false

  // 初始化：加载分类数据
  onMount(async () => {
    try {
      const response = await fetch('/data/data.json')
      categories = await response.json()

      // 加载所有分类数据用于全局搜索
      await loadAllCategoriesData()
    } catch (error) {
      console.error('加载分类数据失败:', error)
    }
  })

  // 加载所有分类数据用于全局搜索
  async function loadAllCategoriesData() {
    const allData = []
    for (const category of categories) {
      try {
        const response = await fetch(`/data/${category.file}`)
        const data = await response.json()
        allData.push({
          categoryName: category.category,
          data: data
        })
      } catch (error) {
        console.error(`加载分类 ${category.category} 数据失败:`, error)
      }
    }
    allCategoriesData = allData
  }

  // 切换分类 - 支持传入二级分类参数
  async function handleCategoryChange(category, subcategory = null) {
    if (!category) {
      // 返回收藏页面（首页）
      currentCategory = null
      currentSubcategory = null
      categoryData = []
      searchQuery = ''
      showFavorites = true
      return
    }

    currentCategory = category
    currentSubcategory = subcategory // 设置选中的二级分类
    showFavorites = false
    loading = true

    try {
      const response = await fetch(`/data/${category.file}`)
      const allData = await response.json()

      // 如果指定了二级分类，只显示该二级分类的数据
      if (subcategory) {
        categoryData = allData.filter(sub => sub.subcategory === subcategory.subcategory)
      } else {
        // 否则显示所有二级分类
        categoryData = allData
      }
    } catch (error) {
      console.error('加载分类数据失败:', error)
      categoryData = []
    } finally {
      loading = false
    }
  }

  // 切换侧边栏
  function handleSidebarToggle() {
    sidebarOpen = !sidebarOpen
    persistSidebarState(sidebarOpen)
  }

  function persistSidebarState(state) {
    if (typeof window === 'undefined') return
    localStorage.setItem(SIDEBAR_STATE_KEY, state ? 'true' : 'false')
  }

  // 搜索处理
  function handleSearch(query) {
    searchQuery = query
  }

  // 处理搜索结果点击 - 跳转到对应网站
  function handleSearchResultClick(result) {
    window.open(result.url, '_blank', 'noopener,noreferrer')
  }

  // 显示收藏页面
  function showFavoritesPage() {
    showFavorites = true
    currentCategory = null
    searchQuery = ''
    // 更新收藏列表
    favorites = favoritesStore.getFavorites()
  }

  // 获取收藏列表
  $: favorites = favoritesStore.getFavorites()

  // 当收藏发生变化时更新
  function handleFavoriteUpdate() {
    favorites = favoritesStore.getFavorites()
  }
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
  <!-- 侧边栏 -->
  <Sidebar
    {categories}
    {currentCategory}
    currentSubcategory={currentSubcategory}
    {showFavorites}
    onCategoryChange={handleCategoryChange}
    onFavoritesClick={showFavoritesPage}
    isOpen={sidebarOpen}
    onToggle={handleSidebarToggle}
  />

  <!-- 主内容区 -->
  <div class="flex-1 transition-all duration-300 flex flex-col {sidebarOpen ? 'lg:ml-64' : ''}">
    <!-- 顶部导航栏 -->
    <Navbar
      onMenuToggle={handleSidebarToggle}
      {searchQuery}
      onSearch={handleSearch}
      allCategoriesData={allCategoriesData}
      onSearchResultClick={handleSearchResultClick}
    />

    <!-- 主内容 -->
    <main class="flex-1 p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 overflow-auto">
      {#if showFavorites}
        <!-- 收藏页面（首页） -->
        <Favorites favorites={favorites} />
      {:else if currentCategory}
        <!-- 分类内容 -->
        {#if loading}
          <div class="flex justify-center items-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-gray-400 dark:text-gray-600"></i>
          </div>
        {:else}
          <div class="mb-6">
            <h1 class="text-2xl font-normal text-gray-600 dark:text-gray-400 mb-2 flex items-baseline gap-2">
              <span>{currentSubcategory ? currentSubcategory.subcategory : currentCategory.category}</span>
              {#if currentSubcategory}
                <span class="text-xs font-normal text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {categoryData.reduce((sum, sub) => sum + sub.sites.length, 0)}
                </span>
              {/if}
            </h1>
          </div>
          <Category {categoryData} currentCategoryName={currentCategory?.category || ''} showSubcategoryTitle={!currentSubcategory} />
        {/if}
      {/if}
    </main>

    <!-- 回到顶部按钮 -->
    <ScrollToTop />
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
