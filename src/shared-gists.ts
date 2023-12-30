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
  
  // Initialize the gists data structure if it doesn't exist
  if (!data.gists) {
    data.gists = {};
  }

  // Extracting each sub-property of the shared gist
  const gistKey = `gist-${sharedGist.id}`;
  data.gists[gistKey] = {
    id: sharedGist.id,
    url: sharedGist.url,
    createdAt: sharedGist.createdAt,
    updatedAt: sharedGist.updatedAt,
    filename: sharedGist.filename,
    isPublic: sharedGist.isPublic
  };

  // Reconstructing the front matter with updated gist data
  const updatedData = { ...data };
  return matter.stringify(content, updatedData);
};