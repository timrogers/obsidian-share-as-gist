# "Share as Gist" Obsidian plugin

This plugin for Obsidian (https://obsidian.md) allows you to share your notes as [GitHub Gists](https://gist.github.com/).

You can share your notes privately (i.e. only people with the link can see the note) or publicly (i.e. the note is visible on your profile).

Once you've create a gist, if you make changes to your note (for example responding to feedback), you can update your existing gist straight from Obsidian.

## Usage

1. Install the plugin. (For now, you'll have to add it to your Obsidian vault manually, but it should soon be available in the Community Plugins directory.)
2. [Create a GitHub personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with the `gist` scope, and copy it to your clipboard.

<img width="636" alt="Screenshot 2022-06-09 at 09 47 43" src="https://user-images.githubusercontent.com/116134/172805660-4e563a93-a042-4aa7-8b48-db0c501aac14.png">

3. Open "Settings" in Obsidian, then go to "Share as Gist" under "Plugin Options".

<img width="779" alt="Screenshot 2022-06-09 at 09 46 53" src="https://user-images.githubusercontent.com/116134/172805445-3d633311-6fdd-45be-8364-d37641550f62.png">

4. Paste your access token into the "GitHub.com access token" box, then close "Settings".

5. To share a note, open the Command Palette and type "gist". You'll see commands for creating a public and private link. Pick the one you want and hit enter. Your gist will be created, and the URL for sharing will be added to your clipboard.

<img width="779" alt="Screenshot 2022-06-09 at 09 48 31" src="https://user-images.githubusercontent.com/116134/172805839-e0416c2a-6cc2-4a24-9b10-c01c701e2bfa.png">

6. Make a change to your note, and then follow step 5 again. You will be asked if you want to update the existing note or create a new one.

<img width="781" alt="Screenshot 2022-06-09 at 09 49 00" src="https://user-images.githubusercontent.com/116134/172805957-dbbe8223-8056-4685-aad4-4fd54338c85f.png">

By default, any YAML front matter will not be included in your gists. You can change that by toggling the "Include front matter in gists" setting.

## Securing your GitHub personal access token

Your GitHub access token will be stored in Obsidian's `localStorage`.

This means that it will not be stored in a file and will not be backed up or synced with the rest of your Vault. But it is theoretically possible for other Obsidian plugins to access it.

For your security, you should make sure that you give your personal access token the lowest possible permissions - just the `gist` scope is enough. This will mean that your token will not have access to your code or other sensitive data.

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
