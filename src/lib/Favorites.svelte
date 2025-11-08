<script>
  import LinkCard from './LinkCard.svelte'
  import { favoritesStore } from '../lib/utils.js'

  export let favorites = []

  // 收藏状态更新触发器
  let favoriteUpdateTrigger = 0

  function handleFavoriteToggle() {
    favoriteUpdateTrigger++
    // 重新获取收藏列表
    favorites = favoritesStore.getFavorites()
  }

  // 响应式更新收藏列表
  $: if (favoriteUpdateTrigger >= 0) {
    favorites = favoritesStore.getFavorites()
  }

  // 按分类分组收藏 - 根据收藏的网站所属分类进行分组
  $: groupedFavorites = favorites.reduce((acc, site) => {
    // 从收藏的网站数据中获取分类信息，如果没有则使用"未分类"
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
  function importFavorites(e) {
    const file = e.target.files[0]
    if (file) {
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
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-normal text-gray-600 dark:text-gray-400">
      我的收藏
    </h1>
    <div class="flex gap-2">
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

  {#if favorites.length === 0}
    <div class="text-center py-12">
      <i class="fas fa-star text-4xl text-gray-400 dark:text-gray-600 mb-4"></i>
      <p class="text-gray-600 dark:text-gray-400 mb-2">
        还没有收藏任何网站
      </p>
      <!-- 数据存储提示 - 与网站风格协调的设计 -->
      <div class="max-w-2xl mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div class="flex items-start gap-4">
          <!-- 图标区域 -->
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <i class="fas fa-info-circle text-blue-500 dark:text-blue-400 text-lg"></i>
          </div>
          <!-- 内容区域 -->
          <div class="flex-1 text-left">
            <h3 class="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">提示</h3>
            <ul class="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
              <li class="flex items-start gap-2">
                <span class="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-2"></span>
                <span>本站服务器不存储用户数据，所有收藏数据仅保存在浏览器本地存储中。</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-2"></span>
                <span>清理浏览器缓存或更换设备前，请先使用"导出"功能备份数据。</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-2"></span>
                <span>建议定期导出收藏数据，避免数据丢失。</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  {:else}
    {#each Object.entries(groupedFavorites) as [category, sites]}
      <div>
        <h2 class="text-xl font-normal text-gray-600 dark:text-gray-400 mb-4">
          {category}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {#each sites as site}
            <LinkCard
              site={site}
              onToggleFavorite={handleFavoriteToggle}
            />
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</div>
