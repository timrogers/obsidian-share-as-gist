import { Octokit } from '@octokit/rest';
import { SharedGist } from './shared-gists';

export enum CreateGistResultStatus {
  Succeeded = 'succeeded',
  Failed = 'failed',
}

export interface CreateGistResult {
  status: CreateGistResultStatus;
  sharedGist: SharedGist | null;
  errorMessage: string | null;
}

interface CreateGistOptions {
  filename: string;
  description: string | null;
  content: string;
  isPublic: boolean;
  accessToken: string;
}

interface UpdateGistOptions {
  sharedGist: SharedGist;
  content: string;
  accessToken: string;
}

export const updateGist = async (
  opts: UpdateGistOptions,
): Promise<CreateGistResult> => {
  const { accessToken, sharedGist, content } = opts;

  try {
    const octokit = new Octokit({
      auth: accessToken,
    });

    const response = await octokit.rest.gists.update({
      gist_id: sharedGist.id,
      files: {
        [sharedGist.filename]: { content },
      },
    });

    return {
      status: CreateGistResultStatus.Succeeded,
      sharedGist: { ...sharedGist, updatedAt: response.data.updated_at },
      errorMessage: null,
    };
  } catch (e) {
    return {
      status: CreateGistResultStatus.Failed,
      sharedGist: sharedGist,
      errorMessage: e.message,
    };
  }
};

export const createGist = async (
  opts: CreateGistOptions,
): Promise<CreateGistResult> => {
  try {
    const { accessToken, content, description, filename, isPublic } = opts;

    const octokit = new Octokit({
      auth: accessToken,
    });

    const response = await octokit.rest.gists.create({
      description: description || filename,
      public: isPublic,
      files: {
        [filename]: { content },
      },
    });

    return {
      status: CreateGistResultStatus.Succeeded,
      sharedGist: {
        id: response.data.id as string,
        url: response.data.html_url as string,
        createdAt: response.data.created_at as string,
        updatedAt: response.data.updated_at as string,
        filename,
        isPublic,
      },
      errorMessage: null,
    };
  } catch (e) {
    return {
      status: CreateGistResultStatus.Failed,
      sharedGist: null,
      errorMessage: e.message,
    };
  }
};
