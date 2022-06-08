import matter from 'gray-matter';

export interface SharedGist {
  id: string;
  url: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  filename: string;
}

export const getSharedGistsForFile = (fileContents: string): SharedGist[] => {
  const { data } = matter(fileContents);

  const gists = data.gists || [];

  return gists as SharedGist[];
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
