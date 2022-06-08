const ACCESS_TOKEN_LOCAL_STORAGE_KEY = 'share_as_gist_dotcom_access_token';

export const getAccessToken = (): string =>
  localStorage.getItem(ACCESS_TOKEN_LOCAL_STORAGE_KEY);
export const setAccessToken = (accessToken: string): void =>
  localStorage.setItem(ACCESS_TOKEN_LOCAL_STORAGE_KEY, accessToken);
