/**
 * api.js
 * 
 * 애플리케이션의 모든 백엔드 교신(API 호출)은 이 리졸버 객체(`api`)를 통해 이루어집니다.
 * 이 모듈은 Mock API와 실서버 API 간의 의존성을 스위칭 제어하고,
 * 전역 로딩 스피너 이벤트를 자동화하는 Proxy 패턴을 활용합니다.
 */

import { apiMock } from './api_mock';
import { apiReal as apiServer } from './api_server';

/**
 * 전역 API 동작 모드 제어 플래그
 * - true : localStorage를 활용한 클라이언트 Mock DB 사용
 * - false: 백엔드 REST API 서버(`api_server.js`) 사용
 * @type {boolean}
 */
const USE_MOCK_API = true;

// 플래그에 따라 주입되는 최종 API 구현체 (Mock 또는 Real)
const baseApi = USE_MOCK_API ? apiMock : apiServer;

/**
 * API 호출 전 구간에 로딩 상태를 주입하는 프록시 팩토리 함수
 * Proxy를 사용하여 객체 내 모든 비동기 메서드 호출 전후로 Custom Event를 발생시킵니다.
 *
 * @param {Object} target - 타겟 API 구현체 (apiMock 또는 apiServer)
 * @returns {Proxy} 로딩 처리 로직이 래핑된 API 객체 프록시
 */
const createApiProxy = (target) => {
    return new Proxy(target, {
        get(obj, prop) {
            // 자식 객체(auth, users 등)에 접근할 경우 재귀적으로 Proxy 적용
            if (typeof obj[prop] === 'object' && obj[prop] !== null) {
                return createApiProxy(obj[prop]);
            }
            // 최종 실행 함수(login, getAll 등) 접근 시 Proxy 래퍼 함수 반환
            if (typeof obj[prop] === 'function') {
                return async (...args) => {
                    // API 마지막 인자로 { skipLoading: true } 객체를 주입하면 로딩 스피너 우회 가능
                    const lastArg = args[args.length - 1];
                    const skipLoading = (lastArg && typeof lastArg === 'object' && lastArg.skipLoading === true);

                    // API 호출 직전: 전역 로딩 시작 이벤트 발송
                    // 이 이벤트는 Header.jsx나 전역 LoadingSpinner 컴포넌트에서 수신하여 스피너를 표시합니다.
                    if (!skipLoading && typeof window !== 'undefined') {
                        window.dispatchEvent(new Event('api-load-start'));
                    }

                    try {
                        // 실제 API 메서드 호출 (await 대기)
                        return await obj[prop](...args);
                    } finally {
                        // API 호출 직후 (성공/에러 무관): 전역 로딩 종료 이벤트 발송
                        // 이벤트를 통해 전역 로딩 상태를 해제하여 스피너를 숨깁니다.
                        if (!skipLoading && typeof window !== 'undefined') {
                            window.dispatchEvent(new Event('api-load-end'));
                        }
                    }
                };
            }
            return obj[prop];
        }
    });
};

/**
 * 애플리케이션 프론트엔드 코드 전역에서 import 후 사용하는 API 핵심 인스턴스.
 * 예: api.auth.login(), api.classes.getAll() 등
 */
export const api = createApiProxy(baseApi);
