import { useState, useMemo, useEffect } from 'react';

export function usePagination(data, itemsPerPage = 10) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

    // 데이터의 크기가 다 작아져서 전체 페이지 수가 줄어든 경우 넘는 페이지 보호
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [data.length, totalPages, currentPage]);

    const currentData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return data.slice(start, start + itemsPerPage);
    }, [data, currentPage, itemsPerPage]);

    const goToPage = (page) => {
        setCurrentPage(Math.min(Math.max(1, page), totalPages));
    };

    const nextPage = () => goToPage(currentPage + 1);
    const prevPage = () => goToPage(currentPage - 1);

    return {
        currentPage,
        totalPages,
        currentData,
        goToPage,
        nextPage,
        prevPage,
        setCurrentPage // 필터 변경 시 등 강제 리셋을 위해 노출
    };
}
