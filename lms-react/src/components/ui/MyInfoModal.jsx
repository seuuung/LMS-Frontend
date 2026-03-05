import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api/api';

export default function MyInfoModal({ isOpen, onClose }) {
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();

    const [infoName, setInfoName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [infoPassword, setInfoPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentPasswordError, setCurrentPasswordError] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            setInfoName(user.name || '');
            setCurrentPassword('');
            setInfoPassword('');
            setConfirmPassword('');
            setCurrentPasswordError('');
        }
    }, [isOpen, user]);

    const handleSaveInfo = async (e) => {
        e.preventDefault();
        setCurrentPasswordError('');

        try {
            if (infoName.trim() && infoName !== user.name) {
                await api.users.update(user.id, { name: infoName.trim() });
            }
            if (infoPassword.trim()) {
                if (!currentPassword.trim()) {
                    showToast('기존 비밀번호를 입력해주세요.', 'error');
                    return;
                }
                if (infoPassword !== confirmPassword) {
                    showToast('새 비밀번호가 일치하지 않습니다.', 'error');
                    return;
                }
                await api.users.updatePassword(user.id, currentPassword.trim(), infoPassword.trim());
            }

            showToast('내 정보가 성공적으로 수정되었습니다.', 'success');

            if (infoName.trim() && infoName !== user.name) {
                updateUser({ name: infoName.trim() });
            }

            onClose();
        } catch (err) {
            if (err.message && err.message.includes('기존 비밀번호')) {
                setCurrentPasswordError(err.message);
            } else {
                showToast(err.message || '오류가 발생했습니다.', 'error');
            }
        }
    };

    if (!user) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="내 정보 수정">
            <div style={{ marginTop: '0.5rem' }}>
                <form onSubmit={handleSaveInfo}>
                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#334155' }}>
                            아이디
                        </label>
                        <input type="text" className="form-control" value={user.username} disabled style={{ backgroundColor: '#f1f5f9', width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                        <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>아이디는 변경할 수 없습니다.</small>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#334155' }}>
                            이름
                        </label>
                        <input type="text" className="form-control" value={infoName} onChange={e => setInfoName(e.target.value)} required style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#334155' }}>
                            기존 비밀번호
                        </label>
                        <input type="password" className="form-control" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setCurrentPasswordError(''); }} placeholder="현재 비밀번호를 입력하세요" style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                        {currentPasswordError && (
                            <small style={{ color: '#ef4444', fontWeight: 600, marginTop: '0.4rem', display: 'block' }}>
                                ❌ {currentPasswordError}
                            </small>
                        )}
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#334155' }}>
                            새 비밀번호
                        </label>
                        <input type="password" className="form-control" value={infoPassword} onChange={e => setInfoPassword(e.target.value)} placeholder="새 비밀번호를 입력하세요" style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#334155' }}>
                            새 비밀번호 확인
                        </label>
                        <input type="password" className="form-control" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="새 비밀번호를 다시 입력하세요" style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                        {confirmPassword && (
                            <small style={{ color: infoPassword === confirmPassword ? '#22c55e' : '#ef4444', fontWeight: 600, marginTop: '0.4rem', display: 'block' }}>
                                {infoPassword === confirmPassword ? '✅ 비밀번호가 일치합니다.' : '❌ 비밀번호가 일치하지 않습니다.'}
                            </small>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '0.55rem 1.25rem' }}>
                            취소
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
                            정보 업데이트
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
