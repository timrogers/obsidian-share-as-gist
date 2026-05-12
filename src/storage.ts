import { App } from 'obsidian';
import { DOTCOM_BASE_URL, Target } from './gists';

const DOTCOM_ACCESS_TOKEN_LOCAL_STORAGE_KEY =
  'share_as_gist_dotcom_access_token';
const GHES_BASE_URL_LOCAL_STORAGE_KEY = 'share_as_gist_ghes_base_url';
const GHES_ACCESS_TOKEN_LOCAL_STORAGE_KEY = 'share_as_gist_ghes_access_token';

const loadString = (app: App, key: string): string | null => {
  const value = app.loadLocalStorage(key) as unknown;
  return typeof value === 'string' ? value : null;
};

export const getDotcomAccessToken = (app: App): string | null =>
  loadString(app, DOTCOM_ACCESS_TOKEN_LOCAL_STORAGE_KEY);
export const setDotcomAccessToken = (app: App, accessToken: string): void =>
  app.saveLocalStorage(DOTCOM_ACCESS_TOKEN_LOCAL_STORAGE_KEY, accessToken);

export const isDotcomEnabled = (app: App): boolean =>
  !!getDotcomAccessToken(app);

export const getGhesBaseUrl = (app: App): string | null =>
  loadString(app, GHES_BASE_URL_LOCAL_STORAGE_KEY);
export const setGhesBaseUrl = (app: App, baseUrl: string): void =>
  app.saveLocalStorage(GHES_BASE_URL_LOCAL_STORAGE_KEY, baseUrl);

export const getGhesAccessToken = (app: App): string | null =>
  loadString(app, GHES_ACCESS_TOKEN_LOCAL_STORAGE_KEY);
export const setGhesAccessToken = (app: App, accessToken: string): void =>
  app.saveLocalStorage(GHES_ACCESS_TOKEN_LOCAL_STORAGE_KEY, accessToken);

export const isGhesEnabled = (app: App): boolean =>
  !!getGhesBaseUrl(app) && !!getGhesAccessToken(app);

export const isTargetEnabled = (app: App, target: Target): boolean => {
  switch (target) {
    case Target.Dotcom:
      return isDotcomEnabled(app);
    case Target.GitHubEnterpriseServer:
      return isGhesEnabled(app);
  }
};

export const getTargetBaseUrl = (app: App, target: Target): string | null => {
  switch (target) {
    case Target.Dotcom:
      return DOTCOM_BASE_URL;
    case Target.GitHubEnterpriseServer:
      return getGhesBaseUrl(app);
  }
};

export const getTargetAccessToken = (
  app: App,
  target: Target,
): string | null => {
  switch (target) {
    case Target.Dotcom:
      return getDotcomAccessToken(app);
    case Target.GitHubEnterpriseServer:
      return getGhesAccessToken(app);
  }
};

export const getAccessTokenForBaseUrl = (
  app: App,
  baseUrl: string | null,
): string | null => {
  if (baseUrl === DOTCOM_BASE_URL) {
    return getDotcomAccessToken(app);
  } else {
    return getGhesAccessToken(app);
  }
};
