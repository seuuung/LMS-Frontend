'use client';

import { use } from 'react';
import StudentDetail from '@/components/ui/StudentDetail';

/**
 * 교수자용 수강생 진도 상세 페이지
 * /professor/class/[classId]/student/[studentId]
 */
export default function ProfessorStudentDetailPage({ params }) {
    const { classId, studentId } = use(params);

    return (
        <StudentDetail
            classId={classId}
            studentId={studentId}
            backPath="/professor"
            allowedRoles={['prof', 'admin']}
        />
    );
}
