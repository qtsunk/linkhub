<script>
  import { favoritesStore } from "./utils.js";
  import { tick } from "svelte";

  export let site = {};
  export let onToggleFavorite = () => {};
  // 收藏页定制：控制收藏按钮是否仅在悬停时可见
  export let hideFavoriteButtonUntilHover = false;
  // 排序模式下可禁用点击和收藏按钮
  export let disableOpen = false;
  export let showFavoriteButton = true;

  // 本地收藏状态，用于立即更新 UI
  let localFavoriteState = favoritesStore.isFavorite(site.url);

  // 检查是否已收藏 - 使用响应式语句确保实时更新
  $: {
    const storedState = favoritesStore.isFavorite(site.url);
    if (storedState !== localFavoriteState) {
      localFavoriteState = storedState;
    }
  }

  // Tooltip 相关状态
  let showTooltip = false;
  let tooltipPosition = "bottom"; // 'top' 或 'bottom'
  let tooltipLeft = "0px"; // fixed定位的left坐标
  let tooltipTop = "0px"; // fixed定位的top坐标
  let tooltipWidth = "auto"; // tooltip宽度（与卡片一致）
  let descriptionElement;
  let tooltipElement;
  let cardElement; // 卡片元素引用;

  // 获取图标路径 - 优先级：本地图标 > Favicon.im/{domain} > 默认图标
  function getIconPath(favicon, url) {
    // 默认图标路径
    const defaultIcon = "/icons/default.svg";

    // 方式1：如果配置了本地图标，优先使用
    if (favicon) {
      // 如果是完整的URL（http:// 或 https://），直接使用
      if (favicon.startsWith("http://") || favicon.startsWith("https://")) {
        return favicon;
      }

      // 如果是本地路径（以 / 开头），直接使用
      if (favicon.startsWith("/")) {
        return favicon;
      }

      // 否则作为本地图标路径处理（相对于 icons 目录）
      return `/icons/${favicon}`;
    }

    // 方式2：如果没有配置本地图标，使用 Favicon.im API
    if (url) {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        return `https://favicon.im/${domain}`;
      } catch (e) {
        // URL 解析失败，使用默认图标
        return defaultIcon;
      }
    }

    // 方式3：都没有配置，使用默认图标
    return defaultIcon;
  }

  // 切换收藏状态
  function toggleFavorite(e) {
    e.stopPropagation();
    // 立即更新本地状态，实现即时 UI 反馈
    localFavoriteState = !localFavoriteState;

    if (!localFavoriteState) {
      favoritesStore.removeFavorite(site.url);
    } else {
      // 添加收藏时，需要保存完整的网站信息
      favoritesStore.addFavorite(site);
    }
    // 触发父组件更新
    onToggleFavorite();
  }

  // 使用本地状态作为显示状态
  $: isFavorite = localFavoriteState;

  // 打开链接
  function openLink() {
    window.open(site.url, "_blank", "noopener,noreferrer");
  }

  // 计算图标路径 - 优先级：本地图标 > Favicon.im/{domain} > 默认图标
  $: iconPath = getIconPath(site.favicon, site.url);

  // 计算 tooltip 位置 - 根据卡片位置显示在卡片正上方或正下方
  async function calculateTooltipPosition() {
    if (!cardElement) return;

    // 获取卡片的位置和宽度
    const cardRect = cardElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - cardRect.bottom;
    const spaceAbove = cardRect.top;
    const estimatedTooltipHeight = 60; // 预估 tooltip 高度

    // 如枟下方空间不足且上方空间足够，显示在上方
    if (spaceBelow < estimatedTooltipHeight && spaceAbove > spaceBelow) {
      tooltipPosition = "top";
    } else {
      tooltipPosition = "bottom";
    }

    // 等待 DOM 更新后，根据实际 tooltip 高度再次调整位置并计算坐标
    await tick();
    if (tooltipElement && cardElement) {
      const tooltipRect = tooltipElement.getBoundingClientRect();
      const actualTooltipHeight = tooltipRect.height;

      // 如枟实际高度导致位置不合适，重新调整
      if (
        tooltipPosition === "bottom" &&
        spaceBelow < actualTooltipHeight &&
        spaceAbove > spaceBelow
      ) {
        tooltipPosition = "top";
      } else if (
        tooltipPosition === "top" &&
        spaceAbove < actualTooltipHeight &&
        spaceBelow > spaceAbove
      ) {
        tooltipPosition = "bottom";
      }

      // 计算 tooltip 的绝对坐标（与卡片对齐）
      tooltipLeft = `${cardRect.left}px`; // 与卡片左侧对齐
      tooltipWidth = `${cardRect.width}px`; // 与卡片宽度一致

      if (tooltipPosition === "top") {
        tooltipTop = `${cardRect.top - actualTooltipHeight - 8}px`; // 卡片上方
      } else {
        tooltipTop = `${cardRect.bottom + 8}px`; // 卡片下方
      }
    }
  }

  // 鼠标进入描述区域
  async function handleMouseEnter(e) {
    // 只有当描述文本超出显示区域时才显示 tooltip
    if (
      descriptionElement &&
      descriptionElement.scrollWidth > descriptionElement.clientWidth
    ) {
      showTooltip = true;
      // 计算 tooltip 位置
      await calculateTooltipPosition();
    }
  }

  // 鼠标离开描述区域
  function handleMouseLeave() {
    showTooltip = false;
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  bind:this={cardElement}
  class="bg-white dark:bg-gray-800 rounded shadow hover:shadow-lg transition-all duration-250 p-3.5 will-change-transform {disableOpen
    ? 'cursor-default'
    : 'cursor-pointer'} hover:-translate-y-1 {hideFavoriteButtonUntilHover
    ? 'favorite-hover-card'
    : ''}"
  on:click={() => {
    if (!disableOpen) {
      openLink();
    }
  }}
  role={disableOpen ? undefined : "button"}
  tabindex={disableOpen ? undefined : 0}
  on:keydown={(e) => {
    if (!disableOpen && e.key === "Enter") {
      openLink();
    }
  }}
>
  <div class="flex items-center gap-2.5">
    <!-- Favicon -->
    <div class="flex-shrink-0">
      <img
        src={iconPath}
        alt={site.name}
        class="w-6 h-6"
        on:error={(e) => {
          // 如果图标加载失败，使用默认图标
          const target = e.target;
          if (target && target instanceof HTMLImageElement) {
            target.src = "/icons/default.svg";
            target.onerror = null; // 防止再次触发错误
          }
        }}
      />
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 min-w-0">
      <h3
        class="font-semibold text-sm text-gray-900 dark:text-white mb-0.5 truncate leading-tight"
      >
        {site.name}
      </h3>
      <!-- 描述文本容器 -->
      <div class="relative">
        <p
          bind:this={descriptionElement}
          class="text-xs text-gray-500 dark:text-gray-400 truncate whitespace-nowrap overflow-hidden leading-tight"
          on:mouseenter={handleMouseEnter}
          on:mouseleave={handleMouseLeave}
        >
          {site.description || "暂无描述"}
        </p>
      </div>
    </div>

    {#if showFavoriteButton}
      <button
        on:click={toggleFavorite}
        class="flex-shrink-0 p-1 transition-colors duration-200 favorite-star-button"
        aria-label={isFavorite ? "取消收藏" : "收藏"}
        title={isFavorite ? "取消收藏" : "收藏"}
      >
        <i
          class="fas fa-star {isFavorite
            ? 'text-yellow-400 dark:text-yellow-500'
            : 'text-gray-200 dark:text-gray-700 hover:text-gray-300 dark:hover:text-gray-600'} {hideFavoriteButtonUntilHover
            ? 'favorite-star-icon'
            : ''}"
        ></i>
      </button>
    {/if}
  </div>
</div>

<!-- Tooltip 移到卡片外部，宽度与卡片一致，显示在卡片正上方/下方，箭头居中 -->
{#if showTooltip && (site.description || "暂无描述") !== "暂无描述"}
  <div
    bind:this={tooltipElement}
    class="fixed z-[9999] px-3 py-2 text-xs text-white bg-gray-700 dark:bg-gray-600 rounded shadow-lg pointer-events-none"
    style="left: {tooltipLeft}; top: {tooltipTop}; width: {tooltipWidth};"
    role="tooltip"
  >
    <p class="whitespace-normal break-words">
      {site.description || "暂无描述"}
    </p>
    <!-- Tooltip 箭头 - 居中显示 -->
    <div
      class="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent {tooltipPosition ===
      'top'
        ? 'top-full border-t-gray-700 dark:border-t-gray-600'
        : 'bottom-full border-b-gray-700 dark:border-b-gray-600'}"
    ></div>
  </div>
{/if}

<style>
  /* 收藏页专用：收藏图标默认很淡，悬停时正常颜色 */
  @media (hover: hover) and (pointer: fine) {
    /* 未收藏状态 - 默认非常淡 */
    :global(.favorite-hover-card .favorite-star-icon) {
      opacity: 0.3;
      transition: opacity 0.2s ease;
    }

    /* 卡片悬停时，图标显示正常颜色 */
    :global(.favorite-hover-card:hover .favorite-star-icon),
    :global(.favorite-hover-card:focus-within .favorite-star-icon) {
      opacity: 1;
    }
  }

  /* 移动端始终显示正常颜色 */
  @media (hover: none), (pointer: coarse) {
    :global(.favorite-hover-card .favorite-star-icon) {
      opacity: 1;
    }
  }
</style>
