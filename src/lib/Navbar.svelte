<script>
  import ThemeToggle from './ThemeToggle.svelte'
  import Search from './Search.svelte'

  export let onMenuToggle = () => {}
  export let searchQuery = ''
  export let onSearch = (/** @type {string} */ value) => {}
  export let allCategoriesData = [] // 所有分类数据，用于搜索
  export let onSearchResultClick = () => {} // 搜索结果点击回调

  // 防抖搜索处理
  let searchValue = searchQuery
  let searchTimeout = null
  let searchComponent // Search 组件的引用
  
  // 防抖搜索函数，延迟 200ms 执行搜索
  function handleSearch(e) {
    searchValue = e.detail
    // 清除之前的定时器
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    // 设置新的定时器
    searchTimeout = setTimeout(() => {
      onSearch(searchValue)
    }, 200)
  }

  // 触发展开移动端搜索框
  function handleMobileSearchClick() {
    if (searchComponent && typeof searchComponent.expandMobileSearch === 'function') {
      searchComponent.expandMobileSearch()
    }
  }
</script>

<nav class="h-16 bg-gray-50 dark:bg-gray-900 px-4 flex items-center gap-4">
  <!-- 移动端菜单按钮 -->
  <button
    on:click={onMenuToggle}
    class="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors lg:hidden"
    aria-label="切换菜单"
  >
    <i class="fas fa-bars text-gray-700 dark:text-gray-300"></i>
  </button>

  <!-- Web 端菜单栏隐藏按钮 - 位于搜索框左侧，图标与移动端保持一致 -->
  <button
    on:click={onMenuToggle}
    class="hidden lg:flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    aria-label="切换菜单"
    title="切换菜单"
  >
    <i class="fas fa-bars text-gray-700 dark:text-gray-300"></i>
  </button>

  <!-- 搜索框组件（只创建一个实例，桌面端显示搜索框，移动端隐藏搜索框但保留组件在 DOM 中以便悬浮框可以正常显示） -->
  <!-- Search 组件内部已经处理了移动端和桌面端的显示逻辑，移动端的悬浮框使用固定定位，不受父容器影响 -->
  <div class="flex-1">
    <Search
      bind:this={searchComponent}
      value={searchValue}
      on:search={handleSearch}
      {allCategoriesData}
      onResultClick={onSearchResultClick}
    />
  </div>

  <!-- 右侧功能按钮 -->
  <div class="ml-auto flex items-center gap-2">
    <!-- 移动端搜索图标 -->
    <button
      on:click={handleMobileSearchClick}
      class="lg:hidden h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="搜索"
      title="搜索"
    >
      <i class="fas fa-search text-gray-700 dark:text-gray-300 text-lg"></i>
    </button>
    <a
      href="https://github.com/qtsunk/linkhub"
      target="_blank"
      rel="noopener noreferrer"
      class="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="GitHub"
      title="GitHub"
    >
      <i class="fab fa-github text-gray-700 dark:text-gray-300 text-lg"></i>
    </a>
    <ThemeToggle />
  </div>
</nav>

