import axios from 'axios';
import { APP_CONFIG } from '@/constants';
import { getSessionKey } from '@/utils/sessionUtils';

/**
 *
 * @param {Object} [options]
 * @param {boolean} [options.useExceptionInterceptor] - Whether to use exception interceptor or not. Default is true.
 * @returns {import('axios').AxiosInstance} - The axios instance
 */
export default () => {
  const http = axios.create({
    baseURL: APP_CONFIG.apiUrl,
    withCredentials: true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getSessionKey()}`,
    },
  });
  return http;
};
