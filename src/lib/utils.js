// 工具函数：防抖
/**
 * @template T
 * @param {function(...T): void} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {function(...T): void} 防抖后的函数
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 收藏管理工具函数
export const favoritesStore = {
  // 获取所有收藏
  getFavorites() {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem('linkhub-favorites')
    return stored ? JSON.parse(stored) : []
  },

  // 添加收藏
  addFavorite(site) {
    const favorites = this.getFavorites()
    const exists = favorites.some(f => f.url === site.url)
    if (!exists) {
      favorites.push(site)
      localStorage.setItem('linkhub-favorites', JSON.stringify(favorites))
    }
    return favorites
  },

  // 移除收藏
  removeFavorite(url) {
    const favorites = this.getFavorites()
    const filtered = favorites.filter(f => f.url !== url)
    localStorage.setItem('linkhub-favorites', JSON.stringify(filtered))
    return filtered
  },

  // 检查是否已收藏
  isFavorite(url) {
    const favorites = this.getFavorites()
    return favorites.some(f => f.url === url)
  },

  // 导出收藏
  exportFavorites() {
    const favorites = this.getFavorites()
    const dataStr = JSON.stringify(favorites, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `linkhub-favorites-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  },

  // 导入收藏
  importFavorites(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (Array.isArray(data)) {
            localStorage.setItem('linkhub-favorites', JSON.stringify(data))
            resolve(data)
          } else {
            reject(new Error('无效的 JSON 格式'))
          }
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }
}

