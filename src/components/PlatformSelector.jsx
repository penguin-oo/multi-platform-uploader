import './PlatformSelector.css'

function PlatformSelector({ platforms, selectedPlatforms, platformStatus, onToggle, onSelectAllNotLoggedIn, onRelogin, accountSet, onAccountSetChange }) {
    // 全选/取消全选所有平台
    const handleSelectAll = () => {
        const allPlatformIds = platforms.map(p => p.id)
        const allSelected = selectedPlatforms.length === platforms.length

        if (allSelected) {
            if (onSelectAllNotLoggedIn) {
                onSelectAllNotLoggedIn([])
            }
        } else {
            if (onSelectAllNotLoggedIn) {
                onSelectAllNotLoggedIn(allPlatformIds)
            }
        }
    }

    // 处理重新登录
    const handleRelogin = (e, platformId) => {
        e.stopPropagation()
        if (onRelogin) {
            onRelogin(platformId, accountSet)
        }
    }

    return (
        <div className="platform-selector">
            {/* 账号组切换 */}
            <div className="account-set-toggle">
                <span className="toggle-label">使用账号组：</span>
                <div className="toggle-buttons">
                    <button
                        className={`toggle-btn ${accountSet === 1 ? 'active' : ''}`}
                        onClick={() => onAccountSetChange(1)}
                    >
                        账号组 1
                    </button>
                    <button
                        className={`toggle-btn ${accountSet === 2 ? 'active' : ''}`}
                        onClick={() => onAccountSetChange(2)}
                    >
                        账号组 2
                    </button>
                </div>
            </div>

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

                    // 根据当前账号组检查登录状态
                    const currentAccountStatus = accountSet === 1 ? status?.account1 : status?.account2
                    const isLoggedIn = currentAccountStatus?.loggedIn || false

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
                                        <span className="status-logged-in">✓ 账号{accountSet}已登录</span>
                                    ) : (
                                        <span className="status-not-logged-in">账号{accountSet}未登录</span>
                                    )}
                                </div>
                            </div>
                            <div className="platform-actions">
                                <button
                                    className="btn-relogin"
                                    onClick={(e) => handleRelogin(e, platform.id)}
                                    title={`登录账号${accountSet}`}
                                >
                                    🔄
                                </button>
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
