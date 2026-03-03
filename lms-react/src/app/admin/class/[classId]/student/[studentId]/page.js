'use client';

import { use } from 'react';
import StudentDetail from '@/components/ui/StudentDetail';

/**
 * 관리자용 수강생 진도 상세 페이지
 * /admin/class/[classId]/student/[studentId]
 */
export default function AdminStudentDetailPage({ params }) {
    const { classId, studentId } = use(params);

    return (
        <StudentDetail
            classId={classId}
            studentId={studentId}
            backPath="/admin"
            allowedRoles={['admin']}
        />
    );
}
