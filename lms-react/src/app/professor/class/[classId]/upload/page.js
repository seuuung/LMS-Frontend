'use client';

import { use } from 'react';
import UploadForm from '@/components/ui/UploadForm';

/**
 * 교수자용 강의 업로드 페이지
 * 공통 UploadForm 컴포넌트를 사용하며, 교수자 권한과 경로를 전달합니다.
 */
export default function ProfessorUploadPage({ params }) {
    const { classId } = use(params);

    return (
        <UploadForm
            classId={classId}
            allowedRoles={['prof', 'admin']}
            basePath="/professor"
        />
    );
}
