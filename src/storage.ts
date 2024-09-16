import { DOTCOM_BASE_URL, Target } from './gists';

const DOTCOM_ACCESS_TOKEN_LOCAL_STORAGE_KEY =
  'share_as_gist_dotcom_access_token';
const GHES_BASE_URL_LOCAL_STORAGE_KEY = 'share_as_gist_ghes_base_url';
const GHES_ACCESS_TOKEN_LOCAL_STORAGE_KEY = 'share_as_gist_ghes_access_token';

export const getDotcomAccessToken = (): string =>
  localStorage.getItem(DOTCOM_ACCESS_TOKEN_LOCAL_STORAGE_KEY);
export const setDotcomAccessToken = (accessToken: string): void =>
  localStorage.setItem(DOTCOM_ACCESS_TOKEN_LOCAL_STORAGE_KEY, accessToken);

export const isDotcomEnabled = (): boolean => !!getDotcomAccessToken();

export const getGhesBaseUrl = (): string =>
  localStorage.getItem(GHES_BASE_URL_LOCAL_STORAGE_KEY);
export const setGhesBaseUrl = (baseUrl: string): void =>
  localStorage.setItem(GHES_BASE_URL_LOCAL_STORAGE_KEY, baseUrl);

export const getGhesAccessToken = (): string =>
  localStorage.getItem(GHES_ACCESS_TOKEN_LOCAL_STORAGE_KEY);
export const setGhesAccessToken = (accessToken: string): void =>
  localStorage.setItem(GHES_ACCESS_TOKEN_LOCAL_STORAGE_KEY, accessToken);

export const isGhesEnabled = (): boolean =>
  !!getGhesBaseUrl() && !!getGhesAccessToken();

export const isTargetEnabled = (target: Target): boolean => {
  switch (target) {
    case Target.Dotcom:
      return isDotcomEnabled();
    case Target.GitHubEnterpriseServer:
      return isGhesEnabled();
  }
};

export const getTargetBaseUrl = (target: Target): string => {
  switch (target) {
    case Target.Dotcom:
      return DOTCOM_BASE_URL;
    case Target.GitHubEnterpriseServer:
      return getGhesBaseUrl();
  }
};

export const getTargetAccessToken = (target: Target): string => {
  switch (target) {
    case Target.Dotcom:
      return getDotcomAccessToken();
    case Target.GitHubEnterpriseServer:
      return getGhesAccessToken();
  }
};

export const getAccessTokenForBaseUrl = (baseUrl: string): string => {
  if (baseUrl === DOTCOM_BASE_URL) {
    return getDotcomAccessToken();
  } else {
    return getGhesAccessToken();
  }
};
