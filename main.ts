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
import matter from 'gray-matter';
import { CreateGistResultStatus, createGist, updateGist } from 'src/gists';
import { getAccessToken, setAccessToken } from './src/storage';
import {
  SharedGist,
  getSharedGistsForFile,
  upsertSharedGistForFile,
} from './src/shared-gists';

interface ShareAsGistSettings {
  enableUpdatingGistsAfterCreation: boolean;
  enableAutoSaving: boolean;
  showAutoSaveNotice: boolean;
  autoSaveDelaySeconds: number;
  includeFrontMatter: boolean;
}

const DEFAULT_SETTINGS: ShareAsGistSettings = {
  includeFrontMatter: false,
  enableUpdatingGistsAfterCreation: true,
  enableAutoSaving: true,
  autoSaveDelaySeconds: 10,
  showAutoSaveNotice: false,
};

interface ShareGistEditorCallbackParams {
  isPublic: boolean;
  app: App;
  plugin: ShareAsGistPlugin;
}

interface DocumentChangedAutoSaveCallbackParams {
  app: App;
  plugin: ShareAsGistPlugin;
  editor: Editor;
}

const getLatestSettings = async (
  plugin: ShareAsGistPlugin,
): Promise<ShareAsGistSettings> => {
  await plugin.loadSettings();
  return plugin.settings;
};

const stripFrontMatter = (content: string): string => matter(content).content;

const shareGistEditorCallback =
  (opts: ShareGistEditorCallbackParams) => async () => {
    const { isPublic, app, plugin } = opts;

    const accessToken = getAccessToken();

    const { enableUpdatingGistsAfterCreation, includeFrontMatter } =
      await getLatestSettings(plugin);

    if (!accessToken) {
      return new Notice(
        'You need to add your GitHub personal access token in Settings.',
      );
    }

    const view = app.workspace.getActiveViewOfType(MarkdownView);

    if (!view) {
      return new Notice('No active file');
    }

    const editor = view.editor;
    const rawContent = editor.getValue();
    const filename = view.file.name;

    const existingSharedGists = getSharedGistsForFile(rawContent).filter(
      (sharedGist) => sharedGist.isPublic === isPublic,
    );

    const content = includeFrontMatter
      ? rawContent
      : stripFrontMatter(rawContent);

    if (enableUpdatingGistsAfterCreation && existingSharedGists.length) {
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
              rawContent,
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

        if (enableUpdatingGistsAfterCreation) {
          const updatedContent = upsertSharedGistForFile(
            result.sharedGist,
            rawContent,
          );

          app.vault.modify(view.file, updatedContent);
          editor.refresh();
        } else {
          app.vault.modify(view.file, content);
          editor.refresh();
        }
      } else {
        new Notice(`GitHub API error: ${result.errorMessage}`);
      }
    }
  };

const documentChangedAutoSaveCallback = async (
  opts: DocumentChangedAutoSaveCallbackParams,
) => {
  const { plugin, editor } = opts;
  const rawContent = editor.getValue();
  const accessToken = getAccessToken();

  const { includeFrontMatter, showAutoSaveNotice } =
    await getLatestSettings(plugin);

  if (!accessToken) {
    return new Notice(
      'You need to add your GitHub personal access token in Settings.',
    );
  }

  const existingSharedGists = getSharedGistsForFile(rawContent);

  const content = includeFrontMatter
    ? rawContent
    : stripFrontMatter(rawContent);

  if (existingSharedGists.length) {
    for (const sharedGist of existingSharedGists) {
      const result = await updateGist({ sharedGist, accessToken, content });
      if (result.status === CreateGistResultStatus.Succeeded) {
        const updatedContent = upsertSharedGistForFile(
          result.sharedGist,
          rawContent,
        );
        editor.setValue(updatedContent);

        if (showAutoSaveNotice) {
          new Notice('Gist updated');
        }
      } else {
        new Notice(`GitHub API error: ${result.errorMessage}`);
      }
    }
  }
};

export default class ShareAsGistPlugin extends Plugin {
  settings: ShareAsGistSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'share-as-public-dotcom-gist',
      name: 'Share as public gist on GitHub.com',
      editorCallback: shareGistEditorCallback({
        plugin: this,
        app: this.app,
        isPublic: true,
      }),
    });

    this.addCommand({
      id: 'share-as-private-dotcom-gist',
      name: 'Share as private gist on GitHub.com',
      callback: shareGistEditorCallback({
        plugin: this,
        app: this.app,
        isPublic: false,
      }),
    });

    this.addTimeoutUpdater();

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new ShareAsGistSettingTab(this.app, this));
  }

  addTimeoutUpdater() {
    let timeout: number | null = null;
    let previousContent = '';

    this.app.workspace.on('editor-change', async (editor, _info) => {
      // Frontmatter is stripped here because it is updated when the gist is updated,
      // so there would be an infinite loop of updating if it wasn't.
      if (stripFrontMatter(editor.getValue()) === previousContent) {
        return;
      }

      previousContent = stripFrontMatter(editor.getValue());

      if (timeout) {
        window.clearTimeout(timeout);
      }

      const { enableAutoSaving, autoSaveDelaySeconds } =
        await getLatestSettings(this);

      if (enableAutoSaving) {
        timeout = window.setTimeout(async () => {
          await documentChangedAutoSaveCallback({
            plugin: this,
            app: this.app,
            editor: editor.getDoc(),
          });
        }, autoSaveDelaySeconds * 1000);
      }
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
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

    new Setting(containerEl)
      .setName('Enable updating gists after creation')
      .setDesc(
        'Whether gists should be updateable through this plugin after creation. ' +
          'If this is turned on, when you create a gist, you will be able to choose ' +
          'to update an existing gist (if one exists) or create a brand new one. ' +
          'To make this possible, front matter will be added to your notes to track ' +
          'gists that you have created. If this is turned off, a brand new gist will ' +
          'always be created.',
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableUpdatingGistsAfterCreation)
          .onChange(async (value) => {
            this.plugin.settings.enableUpdatingGistsAfterCreation = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Include front matter in gists')
      .setDesc(
        'Whether the front matter should be included or stripped away when a note is shared as a gist',
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.includeFrontMatter)
          .onChange(async (value) => {
            this.plugin.settings.includeFrontMatter = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Enable auto-saving Gists after edit')
      .setDesc('Whether to update linked gists when the document is updated')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableAutoSaving)
          .onChange(async (value) => {
            this.plugin.settings.enableAutoSaving = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Enable auto-save notice')
      .setDesc('Whether to show a notice when a linked gist is auto-saved')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showAutoSaveNotice)
          .onChange(async (value) => {
            this.plugin.settings.showAutoSaveNotice = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Auto-save delay seconds')
      .setDesc(
        'The delay after a document is updated after which the Gist is updated, in seconds',
      )
      .addSlider((slider) =>
        slider
          .setValue(this.plugin.settings.autoSaveDelaySeconds)
          .setLimits(5, 120, 5)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.autoSaveDelaySeconds = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
