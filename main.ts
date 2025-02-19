import {
  App,
  Debouncer,
  Editor,
  MarkdownFileInfo,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  SuggestModal,
  TFile,
  debounce,
} from 'obsidian';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkToc from 'remark-toc';
import {
  CreateGistResultStatus,
  DeleteGistResultStatus,
  Target,
  createGist,
  updateGist,
  deleteGist,
} from 'src/gists';
import {
  getDotcomAccessToken,
  getGhesAccessToken,
  getGhesBaseUrl,
  isDotcomEnabled,
  isGhesEnabled,
  setDotcomAccessToken,
  setGhesAccessToken,
  setGhesBaseUrl,
} from './src/storage';
import {
  SharedGist,
  getSharedGistsForFile,
  getTargetForSharedGist,
  removeSharedGistForFile,
  upsertSharedGistForFile,
} from './src/shared-gists';

interface ShareAsGistSettings {
  enableUpdatingGistsAfterCreation: boolean;
  enableAutoSaving: boolean;
  showAutoSaveNotice: boolean;
  includeFrontMatter: boolean;
  includeTableOfContents: boolean;
}

const DEFAULT_SETTINGS: ShareAsGistSettings = {
  includeFrontMatter: false,
  enableUpdatingGistsAfterCreation: true,
  enableAutoSaving: false,
  showAutoSaveNotice: false,
  includeTableOfContents: false,
};

interface ShareGistEditorCallbackParams {
  app: App;
  isPublic: boolean;
  plugin: ShareAsGistPlugin;
  target: Target;
}

interface CopyGistUrlEditorCallbackParams {
  app: App;
  plugin: ShareAsGistPlugin;
}

interface OpenGistEditorCallbackParams {
  app: App;
  plugin: ShareAsGistPlugin;
}

interface DeleteGistEditorCallbackParams {
  app: App;
  plugin: ShareAsGistPlugin;
}

interface DocumentChangedAutoSaveCallbackParams {
  app: App;
  plugin: ShareAsGistPlugin;
  content: string;
  file: TFile;
}

const getLatestSettings = async (
  plugin: ShareAsGistPlugin,
): Promise<ShareAsGistSettings> => {
  await plugin.loadSettings();
  return plugin.settings;
};

const addTableOfContents = async (content: string): Promise<string> => {
  const resultAsVFile = await remark().use(remarkToc).process(content);
  return String(resultAsVFile);
};

const stripFrontMatter = (content: string): string => matter(content).content;

/*
Take an action with an existing gist, shared from the current note.

If the note has exactly one gist, the callback will be called with that gist.
If the note has more than one gist, the user will be prompted to select one, and the callback will be called with the selected gist.
If the note has no gists, `noGistNotice` will be shown as an error message.
If the "Enable updating gists after creation" setting is turned off, an error message will be shown.
*/
const withExistingSharedGist = async (
  app: App,
  plugin: ShareAsGistPlugin,
  callback: (sharedGist: SharedGist) => Promise<void>,
  noGistNotice: string,
): Promise<void> => {
  const view = app.workspace.getActiveViewOfType(MarkdownView);

  if (!view) {
    new Notice('No active file');
    return;
  }

  const editor = view.editor;
  const originalContent = editor.getValue();

  const existingSharedGists = getSharedGistsForFile(originalContent);

  if (existingSharedGists.length === 0) {
    const { enableUpdatingGistsAfterCreation } =
      await getLatestSettings(plugin);

    if (!enableUpdatingGistsAfterCreation) {
      new Notice(
        "You need to enable 'Update gists after creation' in Settings to use this command.",
      );
      return;
    } else {
      new Notice(noGistNotice);
    }
  } else if (existingSharedGists.length > 1) {
    new SelectExistingGistModal(
      app,
      existingSharedGists,
      false,
      callback,
    ).open();
  } else {
    await callback(existingSharedGists[0]);
  }
};

const copyGistUrlEditorCallback =
  (opts: CopyGistUrlEditorCallbackParams) => async () => {
    const { app, plugin } = opts;

    await withExistingSharedGist(
      app,
      plugin,
      async (sharedGist) => {
        navigator.clipboard.writeText(sharedGist.url);
        new Notice('Copied gist URL to clipboard.');
      },
      'You must share this note as a gist before you can copy its URL to the clipboard.',
    );
  };

const openGistEditorCallback =
  (opts: OpenGistEditorCallbackParams) => async () => {
    const { app, plugin } = opts;

    await withExistingSharedGist(
      app,
      plugin,
      async (sharedGist) => {
        window.open(sharedGist.url, '_blank');
      },
      'You must share this note as a gist before you can open its gist.',
    );
  };

const deleteGistEditorCallback =
  (opts: DeleteGistEditorCallbackParams) => async () => {
    const { app, plugin } = opts;

    const view = app.workspace.getActiveViewOfType(MarkdownView);

    if (!view) {
      return new Notice('No active file');
    }

    const editor = view.editor;
    const originalContent = editor.getValue();

    await withExistingSharedGist(
      app,
      plugin,
      async (sharedGist) => {
        const result = await deleteGist({ sharedGist });

        if (result.status === DeleteGistResultStatus.Succeeded) {
          const updatedContent = removeSharedGistForFile(
            sharedGist,
            originalContent,
          );
          editor.setValue(updatedContent);
          new Notice('Gist deleted');
        } else {
          new Notice(`Error: ${result.errorMessage}`);
        }
      },
      'There are no gists associated with this note.',
    );
  };

const shareGistEditorCallback =
  (opts: ShareGistEditorCallbackParams) => async () => {
    const { isPublic, app, plugin, target } = opts;

    const {
      enableUpdatingGistsAfterCreation,
      includeFrontMatter,
      includeTableOfContents,
    } = await getLatestSettings(plugin);

    const view = app.workspace.getActiveViewOfType(MarkdownView);

    if (!view) {
      return new Notice('No active file');
    }

    const editor = view.editor;
    const originalContent = editor.getValue();
    const filename = view.file.name;

    const existingSharedGists = getSharedGistsForFile(
      originalContent,
      target,
    ).filter((sharedGist) => sharedGist.isPublic === isPublic);

    const baseContent = includeFrontMatter
      ? originalContent
      : stripFrontMatter(originalContent);

    const content = includeTableOfContents
      ? await addTableOfContents(baseContent)
      : baseContent;

    if (enableUpdatingGistsAfterCreation && existingSharedGists.length) {
      new SelectExistingGistModal(
        app,
        existingSharedGists,
        true,
        async (sharedGist) => {
          if (sharedGist) {
            const result = await updateGist({
              sharedGist,
              content,
            });

            if (result.status === CreateGistResultStatus.Succeeded) {
              navigator.clipboard.writeText(result.sharedGist.url);
              new Notice(
                `Copied ${isPublic ? 'public' : 'private'} gist URL to clipboard`,
              );
              const updatedContent = upsertSharedGistForFile(
                result.sharedGist,
                originalContent,
              );
              editor.setValue(updatedContent);
            } else {
              new Notice(`Error: ${result.errorMessage}`);
            }
          } else {
            new SetGistDescriptionModal(app, filename, async (description) => {
              const result = await createGist({
                target,
                content,
                description,
                filename,
                isPublic,
              });

              if (result.status === CreateGistResultStatus.Succeeded) {
                navigator.clipboard.writeText(result.sharedGist.url);
                new Notice(
                  `Copied ${isPublic ? 'public' : 'private'} gist URL to clipboard`,
                );
                const updatedContent = upsertSharedGistForFile(
                  result.sharedGist,
                  originalContent,
                );
                editor.setValue(updatedContent);
              } else {
                new Notice(`Error: ${result.errorMessage}`);
              }
            }).open();
          }
        },
      ).open();
    } else {
      new SetGistDescriptionModal(app, filename, async (description) => {
        const result = await createGist({
          target,
          content,
          description,
          filename,
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
              originalContent,
            );

            app.vault.modify(view.file, updatedContent);
            editor.refresh();
          }
        } else {
          new Notice(`GitHub API error: ${result.errorMessage}`);
        }
      }).open();
    }
  };

const documentChangedAutoSaveCallback = async (
  opts: DocumentChangedAutoSaveCallbackParams,
) => {
  const { plugin, file, content: rawContent } = opts;

  const { includeFrontMatter, showAutoSaveNotice, includeTableOfContents } =
    await getLatestSettings(plugin);

  const existingSharedGists = getSharedGistsForFile(rawContent);

  const baseContent = includeFrontMatter
    ? rawContent
    : stripFrontMatter(rawContent);

  const content = includeTableOfContents
    ? await addTableOfContents(baseContent)
    : baseContent;

  if (existingSharedGists.length) {
    for (const sharedGist of existingSharedGists) {
      const result = await updateGist({
        sharedGist,
        content,
      });
      if (result.status === CreateGistResultStatus.Succeeded) {
        const updatedContent = upsertSharedGistForFile(
          result.sharedGist,
          rawContent,
        );
        await file.vault.adapter.write(file.path, updatedContent);
        if (showAutoSaveNotice) {
          return new Notice('Gist updated');
        }
      } else {
        return new Notice(`Error: ${result.errorMessage}`);
      }
    }
  }
};

const hasAtLeastOneSharedGist = (editor: Editor): boolean => {
  const originalContent = editor.getValue();
  const existingSharedGists = getSharedGistsForFile(originalContent);
  return existingSharedGists.length > 0;
};

export default class ShareAsGistPlugin extends Plugin {
  settings: ShareAsGistSettings;

  async onload() {
    await this.loadSettings();

    this.registerCommands();

    this.addModifyCallback();

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new ShareAsGistSettingTab(this.app, this));
  }

  addEditorCommandWithCheck(opts: {
    id: string;
    name: string;
    callback: (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => void;
    performCheck: (
      editor: Editor,
      ctx: MarkdownView | MarkdownFileInfo,
    ) => boolean;
  }) {
    const { id, name, performCheck, callback } = opts;

    this.addCommand({
      id,
      name,
      editorCheckCallback: (checking, editor, ctx) => {
        if (performCheck(editor, ctx)) {
          if (checking) {
            return true;
          }

          callback(editor, ctx);
        }
      },
    });
  }

  registerCommands() {
    this.addEditorCommandWithCheck({
      id: 'share-as-private-dotcom-gist',
      name: 'Share as private gist on GitHub.com',
      callback: shareGistEditorCallback({
        plugin: this,
        app: this.app,
        isPublic: false,
        target: Target.Dotcom,
      }),
      performCheck: isDotcomEnabled,
    });

    this.addEditorCommandWithCheck({
      id: 'share-as-public-dotcom-gist',
      name: 'Share as public gist on GitHub.com',
      callback: shareGistEditorCallback({
        plugin: this,
        app: this.app,
        isPublic: true,
        target: Target.Dotcom,
      }),
      performCheck: isDotcomEnabled,
    });

    this.addEditorCommandWithCheck({
      id: 'share-as-private-ghes-gist',
      name: 'Share as private gist on GitHub Enterprise Server',
      callback: shareGistEditorCallback({
        plugin: this,
        app: this.app,
        isPublic: false,
        target: Target.GitHubEnterpriseServer,
      }),
      performCheck: isGhesEnabled,
    });

    this.addEditorCommandWithCheck({
      id: 'share-as-public-ghes-gist',
      name: 'Share as public gist on GitHub Enterprise Server',
      callback: shareGistEditorCallback({
        plugin: this,
        app: this.app,
        isPublic: true,
        target: Target.GitHubEnterpriseServer,
      }),
      performCheck: isGhesEnabled,
    });

    this.addEditorCommandWithCheck({
      id: 'copy-gist-url',
      name: 'Copy gist URL',
      callback: copyGistUrlEditorCallback({
        plugin: this,
        app: this.app,
      }),
      performCheck: hasAtLeastOneSharedGist,
    });

    this.addEditorCommandWithCheck({
      id: 'open-gist-url',
      name: 'Open gist',
      callback: openGistEditorCallback({
        plugin: this,
        app: this.app,
      }),
      performCheck: hasAtLeastOneSharedGist,
    });

    this.addEditorCommandWithCheck({
      id: 'delete-gist',
      name: 'Delete gist',
      callback: deleteGistEditorCallback({
        plugin: this,
        app: this.app,
      }),
      performCheck: hasAtLeastOneSharedGist,
    });
  }

  addModifyCallback() {
    const previousContents: Record<string, string> = {};
    const debouncedCallbacks: Record<
      string,
      Debouncer<[string, TFile], Promise<Notice>>
    > = {};

    this.app.vault.on('modify', async (file: TFile) => {
      const content = await file.vault.adapter.read(file.path);

      // Frontmatter is stripped here because it is updated when the gist is updated,
      // so there would be an infinite loop of updating if it wasn't.
      if (stripFrontMatter(content) === previousContents[file.path]) {
        return;
      }

      previousContents[file.path] = stripFrontMatter(content);

      if (!debouncedCallbacks[file.path]) {
        debouncedCallbacks[file.path] = debounce(
          async (content: string, file: TFile) =>
            await documentChangedAutoSaveCallback({
              plugin: this,
              app: this.app,
              content,
              file,
            }),
          15 * 1000,
          true,
        );
      }

      const { enableAutoSaving } = await getLatestSettings(this);

      if (enableAutoSaving) {
        await debouncedCallbacks[file.path](content, file);
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

class SelectExistingGistModal extends SuggestModal<SharedGist> {
  sharedGists: SharedGist[];
  allowCreatingNewGist: boolean;
  onSubmit: (sharedGist: SharedGist | null) => Promise<void>;

  constructor(
    app: App,
    sharedGists: SharedGist[],
    allowCreatingNewGist: boolean,
    onSubmit: (sharedGist: SharedGist) => Promise<void>,
  ) {
    super(app);
    this.sharedGists = sharedGists;
    this.allowCreatingNewGist = allowCreatingNewGist;
    this.onSubmit = onSubmit;
  }

  getSuggestions(): Array<SharedGist | null> {
    if (this.allowCreatingNewGist) {
      return this.sharedGists.concat(null);
    } else {
      return this.sharedGists;
    }
  }

  renderSuggestion(sharedGist: SharedGist | null, el: HTMLElement) {
    if (sharedGist === null) {
      el.createEl('div', { text: 'Create new gist' });
    } else {
      const targetLabel =
        getTargetForSharedGist(sharedGist) === Target.Dotcom
          ? 'GitHub.com'
          : new URL(sharedGist.baseUrl).host;

      el.createEl('div', {
        text:
          (sharedGist.isPublic ? 'Public gist' : 'Private gist') +
          ` on ${targetLabel}`,
      });

      el.createEl('small', { text: `Created at ${sharedGist.createdAt}` });
    }
  }

  onChooseSuggestion(sharedGist: SharedGist | null) {
    this.onSubmit(sharedGist).then(() => this.close());
  }
}

class SetGistDescriptionModal extends Modal {
  description: string | null = null;
  onSubmit: (description: string | null) => void;

  constructor(
    app: App,
    filename: string,
    onSubmit: (description: string | null) => void,
  ) {
    super(app);
    this.description = filename;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl('h1', { text: 'Set a description for your gist' });
    contentEl.createEl('p', {
      text: 'Hit the Return key to continue',
      attr: { style: 'font-style: italic' },
    });

    new Setting(contentEl).setName('Description').addTextArea((text) => {
      text.inputEl.setCssStyles({ width: '100%' });

      text.setValue(this.description).onChange((value) => {
        this.description = value;
      });
    });

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText('Create gist')
        .setCta()
        .onClick(() => {
          this.close();
          this.onSubmit(this.description);
        }),
    );

    this.scope.register([], 'Enter', (evt: KeyboardEvent) => {
      evt.preventDefault();

      if (evt.isComposing) {
        return;
      }

      this.close();
      this.onSubmit(this.description);
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
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

    const dotcomAccessToken = getDotcomAccessToken();
    const ghesBaseUrl = getGhesBaseUrl();
    const ghesAccessToken = getGhesAccessToken();

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Share as Gist' });

    containerEl.createEl('h3', { text: 'GitHub.com' });

    new Setting(containerEl)
      .setName('Personal access token')
      .setDesc(
        'An access token for GitHub.com with permission to write gists. You can create one from "Settings" in your GitHub account.',
      )
      .addText((text) =>
        text
          .setPlaceholder('Your personal access token')
          .setValue(dotcomAccessToken)
          .onChange(async (value) => {
            setDotcomAccessToken(value);
            await this.plugin.saveSettings();
          }),
      );

    containerEl.createEl('h3', { text: 'GitHub Enterprise Server' });

    new Setting(containerEl)
      .setName('Base URL')
      .setDesc(
        'The base URL for the GitHub REST API on your GitHub Enterprise Server instance. This usually ends with `/api/v3`.',
      )
      .addText((text) =>
        text
          .setPlaceholder('https://github.example.com/api/v3')
          .setValue(ghesBaseUrl)
          .onChange(async (value) => {
            setGhesBaseUrl(value);
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Personal access token')
      .setDesc(
        'An access token for your GitHub Enterprise Server instance with permission to write gists. You can create one from "Settings" in your GitHub account.',
      )
      .addText((text) =>
        text
          .setPlaceholder('Your personal access token')
          .setValue(ghesAccessToken)
          .onChange(async (value) => {
            setGhesAccessToken(value);
            await this.plugin.saveSettings();
          }),
      );

    containerEl.createEl('h3', { text: 'Advanced options' });

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
      .setName('Include table of contents')
      .setDesc(
        'Whether to automatically generate and include a table of contents in the shared gist. The table of contents will be inserted directly after the `Contents` or `Table of Contents` heading, if one exists.',
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.includeTableOfContents)
          .onChange(async (value) => {
            this.plugin.settings.includeTableOfContents = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
