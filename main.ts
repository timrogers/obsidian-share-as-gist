import {
  App,
  Editor,
  MarkdownView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from 'obsidian';
import { Octokit } from 'octokit';
interface ShareAsGistSettings {
  dotcomPersonalAccessToken: string | null;
}

const DEFAULT_SETTINGS: ShareAsGistSettings = {
  dotcomPersonalAccessToken: null,
};

interface CreateGistResult {
  status: 'succeeded' | 'failed';
  url: string | null;
  errorMessage: string | null;
}

export default class ShareAsGistPlugin extends Plugin {
  settings: ShareAsGistSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'share-as-public-dotcom-gist',
      name: 'Create public link on GitHub.com',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        if (!this.settings.dotcomPersonalAccessToken) {
          return new Notice(
            'You need to add your GitHub personal access token in Settings.',
          );
        }

        const content = editor.getValue();
        const filename = view.file.name;

        const result = await this.createGist(filename, content, true);

        console.log(result);

        if (result.status === 'succeeded') {
          navigator.clipboard.writeText(result.url);
          new Notice('Copied public gist URL to clipboard');
        } else {
          new Notice(`GitHub API error: ${result.errorMessage}`);
        }
      },
    });

    this.addCommand({
      id: 'share-as-private-dotcom-gist',
      name: 'Create private link on GitHub.com',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        if (!this.settings.dotcomPersonalAccessToken) {
          return new Notice(
            'You need to add your GitHub personal access token in Settings.',
          );
        }

        const content = editor.getValue();
        const filename = view.file.name;

        const result = await this.createGist(filename, content, false);

        if (result.status === 'succeeded') {
          navigator.clipboard.writeText(result.url);
          new Notice('Copied private gist URL to clipboard');
        } else {
          new Notice(`GitHub API error: ${result.errorMessage}`);
        }
      },
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new ShareAsGistSettingTab(this.app, this));
  }

  async createGist(
    filename: string,
    content: string,
    isPublic: boolean,
  ): Promise<CreateGistResult> {
    try {
      const octokit = new Octokit({
        auth: this.settings.dotcomPersonalAccessToken,
      });

      const response = await octokit.rest.gists.create({
        description: filename,
        public: isPublic,
        files: {
          [filename]: { content },
        },
      });

      return {
        status: 'succeeded',
        url: response.data.html_url as string,
        errorMessage: null,
      };
    } catch (e) {
      return {
        status: 'failed',
        url: null,
        errorMessage: e.message,
      };
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
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
          .setValue(this.plugin.settings.dotcomPersonalAccessToken)
          .onChange(async (value) => {
            this.plugin.settings.dotcomPersonalAccessToken = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
