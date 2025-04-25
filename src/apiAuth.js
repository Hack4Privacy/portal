import { APP_CONFIG } from '@/constants';
import { getSessionKey } from '@/utils/sessionUtils';
import axios from 'axios';

/**
 *
 * @param {Object} [options]
 * @param {boolean} [options.useExceptionInterceptor] - Whether to use exception interceptor or not. Default is true.
 * @param {boolean} [options.allowAnonymous] - Whether to allow anonymous requests or not. Default is false.
 */
export const apiAuth = () => {
  const http = axios.create({
    baseURL: APP_CONFIG.authUrl,
    withCredentials: false,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getSessionKey()}`,
    },
  });
  return http;
};
