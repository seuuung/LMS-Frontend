import { ToastProvider } from '@/context/ToastContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { AuthProvider } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Providers({ children }) {
    return (
        <ToastProvider>
            <ConfirmProvider>
                <AuthProvider>
                    {children}
                    <LoadingSpinner />
                </AuthProvider>
            </ConfirmProvider>
        </ToastProvider>
    );
}
