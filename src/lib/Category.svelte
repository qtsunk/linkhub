<script>
  import LinkCard from './LinkCard.svelte'

  export let categoryData = []
  export let currentCategoryName = '' // 当前分类名称
  export let showSubcategoryTitle = true // 是否显示二级分类标题

  // 不再进行搜索过滤，搜索功能只在下拉菜单中显示
  $: filteredData = categoryData

  // 收藏状态更新触发器
  let favoriteUpdateTrigger = 0

  function handleFavoriteToggle() {
    favoriteUpdateTrigger++
  }

  // 为网站添加分类信息
  function enrichSite(site, subcategory) {
    return {
      ...site,
      category: currentCategoryName || subcategory.subcategory,
      subcategory: subcategory.subcategory
    }
  }
</script>

<div class="space-y-6">
  {#each filteredData as subcategory}
    <div>
      {#if showSubcategoryTitle}
        <h2 class="text-lg font-normal text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-2">
          <span>{subcategory.subcategory}</span>
          <span class="text-xs font-normal text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
            {subcategory.sites.length}
          </span>
        </h2>
      {/if}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each subcategory.sites as site}
          <LinkCard
            site={enrichSite(site, subcategory)}
            onToggleFavorite={handleFavoriteToggle}
          />
        {/each}
      </div>
    </div>
  {/each}

</div>

