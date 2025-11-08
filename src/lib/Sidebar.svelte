<script>
  import { fade, slide } from 'svelte/transition'
  
  export let categories = []
  export let currentCategory = null // 当前选中的分类
  export let currentSubcategory = null // 当前选中的二级分类
  export let showFavorites = false
  export let onCategoryChange = (category, subcategory) => {} // 接受分类和二级分类参数
  export let onFavoritesClick = () => {}
  export let isOpen = true
  export let onToggle = () => {}

  // 存储每个分类的展开状态和二级分类数据
  let expandedCategories = new Set()
  let categorySubcategories = {}

  // 加载分类的二级数据
  async function loadSubcategories(categoryId, categoryFile) {
    if (categorySubcategories[categoryId]) {
      return categorySubcategories[categoryId]
    }

    try {
      const response = await fetch(`/data/${categoryFile}`)
      const data = await response.json()
      categorySubcategories[categoryId] = data
      return data
    } catch (error) {
      console.error('加载二级分类失败:', error)
      return []
    }
  }

  // 切换分类展开/收起 - 点击父级菜单文字或箭头都可以展开/收起
  async function toggleCategoryExpand(category) {
    if (expandedCategories.has(category.id)) {
      expandedCategories.delete(category.id)
    } else {
      expandedCategories.add(category.id)
      // 如果还没有加载过二级分类数据，则加载
      if (!categorySubcategories[category.id]) {
        await loadSubcategories(category.id, category.file)
      }
    }
    // 创建新的 Set 以触发响应式更新
    expandedCategories = new Set(expandedCategories)
  }

  // 检查是否为当前选中的分类
  function isCurrentCategory(category) {
    return currentCategory !== null && currentCategory.id === category.id
  }

  // 检查是否为当前选中的二级分类
  function isCurrentSubcategory(category, subcategory) {
    if (!currentSubcategory || !currentCategory) {
      return false
    }
    // 比较二级分类名称和一级分类ID
    const subcategoryMatch = currentSubcategory.subcategory === subcategory.subcategory
    const categoryMatch = currentCategory.id === category.id
    return subcategoryMatch && categoryMatch
  }
  
  // 创建一个响应式变量来跟踪当前选中的二级分类
  // 使用方括号访问属性以绕过 TypeScript 类型检查
  $: activeSubcategoryKey = (() => {
    if (!currentSubcategory || !currentCategory) {
      return null
    }
    // 使用方括号访问属性，避免 TypeScript 类型推断问题
    const categoryId = currentCategory && currentCategory['id'] ? currentCategory['id'] : null
    const subcategoryName = currentSubcategory && currentSubcategory['subcategory'] ? currentSubcategory['subcategory'] : null
    return categoryId && subcategoryName ? `${categoryId}-${subcategoryName}` : null
  })()

  // 点击二级分类 - 传递二级分类信息给父组件
  async function handleSubcategoryClick(category, subcategory, e) {
    e.stopPropagation()
    // 确保父级分类已展开
    if (!expandedCategories.has(category.id)) {
      expandedCategories.add(category.id)
      // 如果还没有加载过二级分类数据，则加载
      if (!categorySubcategories[category.id]) {
        await loadSubcategories(category.id, category.file)
      }
      expandedCategories = new Set(expandedCategories)
    }
    // 传递分类和选中的二级分类信息
    onCategoryChange(category, subcategory)
  }
</script>

<!-- 移动端遮罩层 -->
{#if isOpen}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
    role="button"
    tabindex="0"
    on:click|stopPropagation={onToggle}
    on:keydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onToggle()
      }
    }}
    aria-label="关闭菜单"
    transition:fade={{ duration: 200 }}
  ></div>
{/if}

<!-- 侧边栏 -->
<aside
  class="fixed left-0 top-0 h-full w-64 bg-gray-100 dark:bg-gray-800 z-50 transform transition-transform duration-300 ease-in-out {isOpen
    ? 'translate-x-0'
    : '-translate-x-full'}"
>
  <div class="h-full flex flex-col">
    <!-- Logo 区域 -->
    <div class="h-16 flex items-center justify-center px-6 bg-gray-100 dark:bg-gray-800">
      <h1 class="text-xl font-bold text-gray-800 dark:text-gray-200">
        LinkHub
      </h1>
    </div>

    <!-- 导航菜单 -->
    <nav class="flex-1 overflow-y-auto px-4 py-2 sidebar-nav">
      <ul class="space-y-2">
        <!-- 收藏按钮（首页） -->
        <li>
          <button
            on:click={onFavoritesClick}
            class="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors {showFavorites
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'}"
          >
            <i class="fas fa-star"></i>
            <span>我的收藏</span>
          </button>
        </li>

        <!-- 分类列表 -->
        {#each categories as category}
          <li>
            <!-- 一级分类按钮 - 点击整个按钮展开/收起二级菜单 -->
            <button
              on:click={() => toggleCategoryExpand(category)}
              class="w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors {isCurrentCategory(category)
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'}"
            >
              <div class="flex items-center gap-3 flex-1">
                <i class="{category.icon} w-4"></i>
                <span>{category.category}</span>
              </div>
              <!-- 箭头图标：收起时向右，展开时向下 -->
              <i
                class="fas fa-chevron-right text-xs transition-transform duration-200 ease-in-out {expandedCategories.has(category.id)
                  ? 'rotate-90'
                  : ''}"
              ></i>
            </button>

            <!-- 二级分类列表 - 使用 slide 动画实现展开/收起效果 -->
            {#if expandedCategories.has(category.id)}
              {#await loadSubcategories(category.id, category.file) then subcategories}
                <ul 
                  class="mt-2 space-y-1"
                  transition:slide={{ duration: 200, axis: 'y' }}
                >
                  {#each subcategories as subcategory}
                    {@const subcategoryKey = `${category.id}-${subcategory.subcategory}`}
                    {@const isActive = activeSubcategoryKey === subcategoryKey}
                    <li>
                      <button
                        on:click={(e) => handleSubcategoryClick(category, subcategory, e)}
                        class="w-full text-left pl-11 py-2 rounded-lg transition-colors text-sm relative {isActive
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}"
                      >
                        <!-- 选中状态的小圆点 - 使用绝对定位，不影响文字位置，颜色较暗淡 -->
                        {#if isActive}
                          <span 
                            class="absolute left-7 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 pointer-events-none"
                          ></span>
                        {/if}
                        <span>{subcategory.subcategory}</span>
                      </button>
                    </li>
                  {/each}
                </ul>
              {/await}
            {/if}
          </li>
        {/each}
      </ul>
    </nav>

    <!-- 底部信息 -->
    <div class="px-4 py-3 bg-gray-100 dark:bg-gray-800">
      <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
        © {new Date().getFullYear()} LinkHub
      </p>
    </div>
  </div>
</aside>

<style>
  :global(.fade) {
    transition: opacity 200ms;
  }

</style>
