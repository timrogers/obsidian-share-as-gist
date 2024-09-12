const ACCESS_TOKEN_LOCAL_STORAGE_KEY = 'share_as_gist_dotcom_access_token';
const BASE_URL_LOCAL_STORAGE_KEY = 'share_as_gist_dotcom_base_url';

export const getAccessToken = (): string =>
  localStorage.getItem(ACCESS_TOKEN_LOCAL_STORAGE_KEY);
export const setAccessToken = (accessToken: string): void =>
  localStorage.setItem(ACCESS_TOKEN_LOCAL_STORAGE_KEY, accessToken);

export const getBaseUrl = (): string =>
  localStorage.getItem(BASE_URL_LOCAL_STORAGE_KEY);
export const setBaseUrl = (baseUrl: string): void =>
  localStorage.setItem(BASE_URL_LOCAL_STORAGE_KEY, baseUrl);
