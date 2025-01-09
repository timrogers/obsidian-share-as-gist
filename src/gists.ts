import { Octokit } from '@octokit/rest';
import { getBaseUrlForSharedGist, SharedGist } from './shared-gists';
import { getAccessTokenForBaseUrl, getTargetBaseUrl } from './storage';

export enum Target {
  Dotcom = 'dotcom',
  GitHubEnterpriseServer = 'github_enterprise_server',
}

export const DOTCOM_BASE_URL = 'https://api.github.com';

export enum CreateGistResultStatus {
  Succeeded = 'succeeded',
  Failed = 'failed',
}

export enum DeleteGistResultStatus {
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
  target: Target;
}

interface UpdateGistOptions {
  sharedGist: SharedGist;
  content: string;
}

interface DeleteGistOptions {
  sharedGist: SharedGist;
}

interface DeleteGistResult {
  status: DeleteGistResultStatus;
  errorMessage: string | null;
}

export const updateGist = async (
  opts: UpdateGistOptions,
): Promise<CreateGistResult> => {
  const { sharedGist, content } = opts;

  const baseUrl = getBaseUrlForSharedGist(sharedGist);
  const accessToken = getAccessTokenForBaseUrl(baseUrl);

  if (!accessToken) {
    return {
      status: CreateGistResultStatus.Failed,
      sharedGist: sharedGist,
      errorMessage: `No access token found for the ${baseUrl} target.`,
    };
  }

  try {
    const octokit = new Octokit({
      auth: accessToken,
      baseUrl,
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

export const deleteGist = async (
  opts: DeleteGistOptions,
): Promise<DeleteGistResult> => {
  const { sharedGist } = opts;

  const baseUrl = getBaseUrlForSharedGist(sharedGist);
  const accessToken = getAccessTokenForBaseUrl(baseUrl);

  if (!accessToken) {
    return {
      status: DeleteGistResultStatus.Failed,
      errorMessage: `No access token found for the ${baseUrl} target.`,
    };
  }

  try {
    const octokit = new Octokit({
      auth: accessToken,
      baseUrl,
    });

    await octokit.rest.gists.delete({
      gist_id: sharedGist.id,
    });

    return {
      status: DeleteGistResultStatus.Succeeded,
      errorMessage: null,
    };
  } catch (e) {
    let errorMessage = 'An unknown error occurred.';
    if (e instanceof Error) {
      errorMessage = e.message;
    }

    return {
      status: DeleteGistResultStatus.Failed,
      errorMessage,
    };
  }
};

export const createGist = async (
  opts: CreateGistOptions,
): Promise<CreateGistResult> => {
  try {
    const { content, description, filename, isPublic, target } = opts;

    const baseUrl = getTargetBaseUrl(target);
    const accessToken = getAccessTokenForBaseUrl(baseUrl);

    const octokit = new Octokit({
      auth: accessToken,
      baseUrl,
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
        baseUrl,
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
