/**
 * api.js
 * 
 * 애플리케이션의 모든 API 호출은 이 파일을 통해 이루어집니다.
 * USE_MOCK_API 플래그를 통해 디버깅용(Mock)과 실제 서버용(Real)을 전환할 수 있습니다.
 */

import { apiMock } from './api_mock.js';
import { apiReal as apiServer } from './api_server.js';

// true: localStorage 기반 디버깅용 API 사용
// false: 실제 백엔드 서버 연동 API 사용
const USE_MOCK_API = true;

export const api = USE_MOCK_API ? apiMock : apiServer;
