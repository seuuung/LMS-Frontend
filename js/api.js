/**
 * api.js
 * 
 * 애플리케이션의 모든 API 호출은 이 파일을 통해 이루어집니다.
 * USE_MOCK_API 플래그를 통해 디버깅용(Mock)과 실제 서버용(Real)을 전환할 수 있습니다.
 */

import { apiMock } from './api_mock.js';
import { apiReal as apiServer } from './api_server.js';
import { showLoading, hideLoading } from './common.js';

// true: localStorage 기반 디버깅용 API 사용
// false: 실제 백엔드 서버 연동 API 사용
const USE_MOCK_API = true;

const baseApi = USE_MOCK_API ? apiMock : apiServer;

// Proxy를 사용하여 모든 API 호출에 로딩 스피너 자동 적용
const createApiProxy = (target) => {
    return new Proxy(target, {
        get(obj, prop) {
            if (typeof obj[prop] === 'object' && obj[prop] !== null) {
                return createApiProxy(obj[prop]);
            }
            if (typeof obj[prop] === 'function') {
                return async (...args) => {
                    // 마지막 인수에 옵션(skipLoading)이 있는지 확인
                    const lastArg = args[args.length - 1];
                    const skipLoading = (lastArg && typeof lastArg === 'object' && lastArg.skipLoading === true);

                    if (!skipLoading) showLoading();

                    try {
                        // 원본 함수가 옵션 객체를 불필요하게 받더라도 
                        // api_mock/server 구현부에서는 사용하는 파라미터까지만 받으므로 기능상 무해
                        return await obj[prop](...args);
                    } finally {
                        if (!skipLoading) hideLoading();
                    }
                };
            }
            return obj[prop];
        }
    });
};

export const api = createApiProxy(baseApi);
