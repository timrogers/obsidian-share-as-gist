import {
  App,
  Editor,
  MarkdownView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  SuggestModal,
} from 'obsidian';
import { CreateGistResultStatus, createGist, updateGist } from 'src/gists';
import { getAccessToken, setAccessToken } from './src/storage';
import {
  SharedGist,
  getSharedGistsForFile,
  upsertSharedGistForFile,
} from './src/shared-gists';

const shareGistEditorCallback =
  (isPublic: boolean, app: App) =>
  async (editor: Editor, view: MarkdownView) => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return new Notice(
        'You need to add your GitHub personal access token in Settings.',
      );
    }

    const content = editor.getValue();
    const filename = view.file.name;

    const existingSharedGists = getSharedGistsForFile(content).filter(
      (sharedGist) => sharedGist.isPublic === isPublic,
    );

    if (existingSharedGists.length) {
      new ShareAsGistSelectExistingGistModal(
        app,
        existingSharedGists,
        async (sharedGist) => {
          let result;

          if (sharedGist) {
            result = await updateGist({ sharedGist, accessToken, content });
          } else {
            result = await createGist({
              filename,
              content,
              accessToken,
              isPublic,
            });
          }

          if (result.status === CreateGistResultStatus.Succeeded) {
            navigator.clipboard.writeText(result.sharedGist.url);
            new Notice(
              `Copied ${isPublic ? 'public' : 'private'} gist URL to clipboard`,
            );
            const updatedContent = upsertSharedGistForFile(
              result.sharedGist,
              content,
            );
            editor.setValue(updatedContent);
          } else {
            new Notice(`GitHub API error: ${result.errorMessage}`);
          }
        },
      ).open();
    } else {
      const result = await createGist({
        filename,
        content,
        accessToken,
        isPublic,
      });

      if (result.status === CreateGistResultStatus.Succeeded) {
        navigator.clipboard.writeText(result.sharedGist.url);
        new Notice(
          `Copied ${isPublic ? 'public' : 'private'} gist URL to clipboard`,
        );
        const updatedContent = upsertSharedGistForFile(
          result.sharedGist,
          content,
        );
        editor.setValue(updatedContent);
      } else {
        new Notice(`GitHub API error: ${result.errorMessage}`);
      }
    }
  };
export default class ShareAsGistPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: 'share-as-public-dotcom-gist',
      name: 'Create public link on GitHub.com',
      editorCallback: shareGistEditorCallback(true, this.app),
    });

    this.addCommand({
      id: 'share-as-private-dotcom-gist',
      name: 'Create private link on GitHub.com',
      editorCallback: shareGistEditorCallback(false, this.app),
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new ShareAsGistSettingTab(this.app, this));
  }
}

class ShareAsGistSelectExistingGistModal extends SuggestModal<SharedGist> {
  sharedGists: SharedGist[];
  onSubmit: (sharedGist: SharedGist | null) => Promise<void>;

  constructor(
    app: App,
    sharedGists: SharedGist[],
    onSubmit: (sharedGist: SharedGist) => Promise<void>,
  ) {
    super(app);
    this.sharedGists = sharedGists;
    this.onSubmit = onSubmit;
  }

  getSuggestions(): Array<SharedGist | null> {
    return this.sharedGists.concat(null);
  }

  renderSuggestion(sharedGist: SharedGist | null, el: HTMLElement) {
    if (sharedGist === null) {
      el.createEl('div', { text: 'Create new gist' });
    } else {
      el.createEl('div', {
        text: sharedGist.isPublic ? 'Public gist' : 'Private gist',
      });
      el.createEl('small', { text: `Created at ${sharedGist.createdAt}` });
    }
  }

  onChooseSuggestion(sharedGist: SharedGist | null) {
    this.onSubmit(sharedGist).then(() => this.close());
  }
}

class ShareAsGistSettingTab extends PluginSettingTab {
  plugin: ShareAsGistPlugin;

  constructor(app: App, plugin: ShareAsGistPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    const accessToken = getAccessToken();

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Share as Gist' });

    new Setting(containerEl)
      .setName('GitHub.com personal access token')
      .setDesc(
        'An access token for GitHub.com with permission to write gists. You can create one from "Settings" in your GitHub account.',
      )
      .addText((text) =>
        text
          .setPlaceholder('Your personal access token')
          .setValue(accessToken)
          .onChange(setAccessToken),
      );
  }
}
