/**
 * 탭 바 컴포넌트
 * 강의/자료/QnA 등 탭 전환 UI를 통일된 형태로 제공합니다.
 * 
 * @param {Array<{key: string, label: string}>} tabs - 표시할 탭 목록
 * @param {string} activeTab - 현재 활성화된 탭의 key
 * @param {function} onTabChange - 탭 변경 시 호출되는 콜백 (key를 인자로 전달)
 */
export default function TabBar({ tabs, activeTab, onTabChange }) {
    return (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    className={`btn btn-tab ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.key)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
