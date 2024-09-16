import matter from 'gray-matter';
import { DOTCOM_BASE_URL, Target } from './gists';

export interface SharedGist {
  id: string;
  url: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  filename: string;
  baseUrl: string;
}

export const getBaseUrlForSharedGist = (sharedGist: SharedGist): string =>
  sharedGist.baseUrl || DOTCOM_BASE_URL;

export const getTargetForSharedGist = (sharedGist: SharedGist): Target =>
  getBaseUrlForSharedGist(sharedGist) === DOTCOM_BASE_URL
    ? Target.Dotcom
    : Target.GitHubEnterpriseServer;

export const getSharedGistsForFile = (
  fileContents: string,
  target?: Target,
): SharedGist[] => {
  const { data } = matter(fileContents);

  const gists = data.gists || [];

  return (gists as SharedGist[]).filter((gist) => {
    if (typeof target === 'undefined') {
      return true;
    }

    return getTargetForSharedGist(gist) === target;
  });
};

export const upsertSharedGistForFile = (
  sharedGist: SharedGist,
  fileContents: string,
): string => {
  const { data, content } = matter(fileContents);
  const existingSharedGists = (data.gists || []) as SharedGist[];

  const matchingGist = existingSharedGists.find(
    (existingSharedGist) => existingSharedGist.id === sharedGist.id,
  );

  if (matchingGist) {
    const otherGists = existingSharedGists.filter(
      (existingSharedGist) => existingSharedGist !== matchingGist,
    );

    const gists = [...otherGists, sharedGist];
    const updatedData = { ...data, gists };
    return matter.stringify(content, updatedData);
  } else {
    const gists = [...existingSharedGists, sharedGist];
    const updatedData = { ...data, gists };
    return matter.stringify(content, updatedData);
  }
};
