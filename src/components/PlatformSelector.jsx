import './PlatformSelector.css'

function PlatformSelector({ platforms, selectedPlatforms, platformStatus, onToggle, onSelectAllNotLoggedIn, onRelogin }) {
    // 全选/取消全选所有平台
    const handleSelectAll = () => {
        const allPlatformIds = platforms.map(p => p.id)
        const allSelected = selectedPlatforms.length === platforms.length

        if (allSelected) {
            // 取消所有选中 - 需要通过父组件处理
            if (onSelectAllNotLoggedIn) {
                onSelectAllNotLoggedIn([])
            }
        } else {
            // 全选所有平台
            if (onSelectAllNotLoggedIn) {
                onSelectAllNotLoggedIn(allPlatformIds)
            }
        }
    }

    const loggedInCount = platforms.filter(p => platformStatus[p.id]?.loggedIn).length

    // 处理重新登录
    const handleRelogin = (e, platformId) => {
        e.stopPropagation() // 阻止触发卡片点击
        if (onRelogin) {
            onRelogin(platformId)
        }
    }

    return (
        <div className="platform-selector">
            <div className="selector-header">
                <span className="selector-count">
                    已选 {selectedPlatforms.length}/{platforms.length} 个平台
                </span>
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleSelectAll}
                >
                    {selectedPlatforms.length === platforms.length ? '取消全选' : '全选'}
                </button>
            </div>

            <div className="platforms-grid">
                {platforms.map(platform => {
                    const status = platformStatus[platform.id]
                    const isSelected = selectedPlatforms.includes(platform.id)
                    const isLoggedIn = status?.loggedIn

                    return (
                        <div
                            key={platform.id}
                            className={`platform-card ${isSelected ? 'selected' : ''} ${!isLoggedIn ? 'not-logged-in' : ''}`}
                            onClick={() => onToggle(platform.id)}
                            style={{ '--platform-color': platform.color }}
                        >
                            <div className="platform-icon">{platform.icon}</div>
                            <div className="platform-info">
                                <div className="platform-name">{platform.name}</div>
                                <div className="platform-status">
                                    {isLoggedIn ? (
                                        <span className="status-logged-in">✓ 已登录</span>
                                    ) : (
                                        <span className="status-not-logged-in">点击登录</span>
                                    )}
                                </div>
                            </div>
                            <div className="platform-actions">
                                {isLoggedIn && (
                                    <button
                                        className="btn-relogin"
                                        onClick={(e) => handleRelogin(e, platform.id)}
                                        title="重新登录"
                                    >
                                        🔄
                                    </button>
                                )}
                                {isSelected && (
                                    <div className="platform-check">✓</div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default PlatformSelector

