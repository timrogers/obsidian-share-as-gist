# "Share as Gist" Obsidian plugin

This plugin for Obsidian (https://obsidian.md) allows you to share your notes as [GitHub Gists](https://gist.github.com/).

You can share your notes privately (i.e. only people with the link can see the note) or publicly (i.e. the note is visible on your profile). Optionally, you can also set a description for your gist.

Once you've create a gist, if you make changes to your note (for example responding to feedback), you can update your existing gist straight from Obsidian - or even configure this to happen automatically every time you save.

## Usage

1. [Install the plugin](https://obsidian.md/plugins?id=obsidian-share-as-gist).
2. [Create a GitHub personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token). You can use a classic personal access token (PAT) with the `gist` scope, or a new fine-grained token with read-write access to your Gists.

<img width="636" alt="Screenshot 2022-06-09 at 09 47 43" src="https://user-images.githubusercontent.com/116134/172805660-4e563a93-a042-4aa7-8b48-db0c501aac14.png">

3. Open "Settings" in Obsidian, then go to "Share as Gist" under "Plugin Options".

<img width="976" alt="Screenshot 2022-07-21 at 09 10 52" src="https://user-images.githubusercontent.com/116134/180163869-4a072203-00e6-4510-81e8-456dd71c5443.png">

4. Paste your access token into the "GitHub.com access token" box, then close "Settings".

5. To share a note, open the Command Palette and type "gist". You'll see commands for creating a public and private link. Pick the one you want and hit enter. 

<img width="770" alt="Screenshot 2022-07-21 at 09 12 16" src="https://user-images.githubusercontent.com/116134/180164154-02817121-e88a-419d-9528-9be58212ed9c.png">

6. Add a custom description for your gist and hit Enter. You can skip this and accept the default by hitting Enter immediately.

7. Your gist will be created, and the URL for sharing will be added to your clipboard.

6. Make a change to your note.

7. If the "Enable auto-saving Gists after edit" setting is turned on, your changes will automatically be reflected in your gist. If not, you can use the "Share as [public|private] gist on GitHub.com" command" again to update your gist, or create a fresh one. 

8. If you want to get the URL of your gist after creating it, open the Command Palette and type "gist". Pick the "Copy GitHub.com gist URL" command. If you have multiple gists for your note, you'll have to pick which one you want the URL for.

## Customisable settings

* __Enable updating gists after creation__ (*enabled by default*): Allow gists to be updated after creation. To enable this to work, information about the gists you create will be stored on notes as  front matter (properties).
* __Include front matter in gists__ (*disabled by default*): Whether your gists should include frontmatter (properties). If this is disabled, the front matter will be stripped from your gists.
* __Enable auto-saving Gists after edit__ (*disabled by default*): Whether your gists should be automatically updated when you save your note. If this is disabled, you can update your gists automatically with the normal "share" command.
* __Enable auto-save notice__ (*disabled by default*): Whether a notice should be displayed when your gists are automatically updated. This option is only relevant if the "Enable auto-saving Gists after edit" option above is turned on.

## Securing your GitHub personal access token

Your GitHub access token will be stored in Obsidian's `localStorage`.

This means that it will not be stored in a file and will not be backed up or synced with the rest of your Vault. But it is theoretically possible for other Obsidian plugins to access it.

For your security, you should make sure that you give your personal access token the lowest possible permissions. This will mean that your token will not have access to your code or other sensitive data.

## Contributing

1. Clone this repo into the `.obsidian/plugins` directory in your Obsidian vault.
2. Navigate to the `obsidian-share-as-gist` directory you've just cloned.
3. Install the dependencies by running `npm i`.
4. Start a process to automatically build your plugin when you make changes by running `npm run dev`.
5. Make changes, and test them in Obsidian. You will have to manually reload the plugin from the "Community plugins" screen when you make a change.
6. Push your changes to the repo if you have access or your own fork, and create a pull request.

## Releasing

1. Work out the next version number. We use [semantic versioning](https://semver.org/).
2. Add an entry to `CHANGELOG.md`, describing your changes.
3. Update the version number in `package.json`.
4. Update `versions.json`, defining what minimum Obsidian version your plugin is compatible with. In general, copying the last entry in the file should be fine.
5. Run `npm run version`.
6. Commit `manifest.json` and `package.json`. In the commit message, make the version number the title, (e.g. `1.0.1`) and copy your changelog entry into the body.
7. Tag your commit with the version number, e.g. `git tag -a 1.0.1 -m '1.0.1'`.
8. Push your changes, including tags.
9. A workflow will automatically run in GitHub Actions to build and publish a release.
