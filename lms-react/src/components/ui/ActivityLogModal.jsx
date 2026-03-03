import React from 'react';
import Modal from './Modal';

export default function ActivityLogModal({ isOpen, onClose, logs, title }) {
    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const d = new Date(timestamp);
        return d.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title || "활동 내역 (History)"}>
            {logs && logs.length > 0 ? (
                <div style={listStyle}>
                    {logs.map((log) => (
                        <div key={log.id} style={itemStyle}>
                            <div style={timeStyle}>{formatDate(log.timestamp)}</div>
                            <div style={messageStyle}>{log.message}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={emptyStyle}>기록된 활동 내역이 없습니다.</div>
            )}
        </Modal>
    );
}

const listStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
};

const itemStyle = {
    display: 'flex',
    flexDirection: 'column',
    padding: '0.75rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
};

const timeStyle = {
    fontSize: '0.8rem',
    color: '#64748b',
    marginBottom: '0.25rem',
};

const messageStyle = {
    fontSize: '0.95rem',
    color: '#1e293b',
    fontWeight: '500',
};

const emptyStyle = {
    textAlign: 'center',
    color: '#64748b',
    padding: '2rem 0',
};
