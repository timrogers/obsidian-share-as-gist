# v2.0.0 (May 13, 2026)

* **BREAKING CHANGE**: Bump required Obsidian version from v0.9.7 to v1.8.7
* Include artifact attestation on `main.js` file in releases, aligning with Obsidian Community guidelines
* Update plugin description to match Obsidian Community guidelines
* Stop including `.zip` bundle in release assets
* Fix various Obsidian Community code warnings
* Bump @typescript-eslint/parser from 8.24.0 to 8.59.3
* Bump actions/setup-node from 4.2.0 to 6.4.0
* Bump @types/node from 22.13.4 to 25.7.0
* Bump obsidian from 1.7.2 to 1.12.3
* Bump eslint-plugin-prettier from 5.2.1 to 5.5.5
* Bump globals from 15.15.0 to 17.6.0
* Bump eslint from 9.20.1 to 10.3.0
* Bump js-yaml from 3.14.1 to 3.14.2
* Bump esbuild from 0.25.0 to 0.28.0
* Bump eslint-config-prettier from 10.0.1 to 10.1.8
* Bump prettier from 3.5.1 to 3.8.3
* Bump minimatch
* Bump flatted from 3.3.2 to 3.4.2
* Bump picomatch from 2.3.1 to 2.3.2
* Bump @typescript-eslint/eslint-plugin from 8.24.1 to 8.59.3
* Bump builtin-modules from 4.0.0 to 5.2.0
* Bump @octokit/rest from 21.1.1 to 22.0.1
* Bump actions/checkout from 4 to 6
* Bump @eslint/js from 9.30.1 to 10.0.1
* Bump @eslint/eslintrc from 3.3.1 to 3.3.5
* Bump typescript from 5.7.3 to 6.0.3
* Bump transitive dependencies

# v1.9.0 (February 18, 2025)

* Add "Include table of contents" option, defaulting to off, which adds a table of contents to your gist when sharing

# v1.8.0 (January 9, 2025)

* Add new "Delete gist" command for deleting a gist you've created

# v1.7.0 (October 6, 2024)

* Add support for GitHub Enterprise Server (GHES), configured separately from GitHub.com

# v1.6.1 (July 11, 2024)

* Don't insert extra lines in the note when hitting Enter in the "Set a description for your gist" modal

# v1.6.0 (July 1, 2024)

* Add new "Open gist on GitHub.com" command for opening your shared gist in your browser

# v1.5.0 (May 16, 2024)

* Allow optionally setting the description when creating a gist

# v1.4.0 (January 1, 2024)

* Add new "Copy GitHub.com gist URL" command for copying the gist URL of the current note to the clipboard

# v1.3.1 (September 29, 2023)

* Don't delete existing front matter when sharing a gist with the "Include front matter in gists" option disabled

# v1.3.0 (September 28, 2023)

* Add optional "Enable auto-saving Gists after edit" option, which updates your Gists on GitHub when you save changes (thanks @Jamalam360!)

# v1.2.1 (March 22, 2023)

* Preserve existing front matter when sharing as a gist with the "Enable updating gists after creation" option enabled

# v1.2.0 (December 7, 2022)

* Add support for creating a gist when in Obsidian's "Reading" or "Live Preview" modes

# v1.1.0 (July 21, 2022)

* Add new "Enable updating gists after creation" option, allowing users to control if gists can be updated after creation. This defaults to "on", but if it is turned off, the plugin adds no front matter to your notes! ✨
* Fix "Include front matter in gists" option (before it did the opposite of what was intended!) 
* Rename commands from "Create public link on GitHub.com" and "Create private link on GitHub.com" to "Share as public gist on GitHub.com" and "Share as public gist on GitHub.com"
* Apply settings changed immediately, rather than waiting for the plugin to be reloaded

# v1.0.2 (July 11, 2022)

* Polyfill `Buffer` in non-Node.js environments for wider compatability

# v1.0.1 (July 5, 2022)

* Switch `octokit` dependency to `@octokit/rest` to avoid transitive dependency on environment-unfriendly `clean-stack` package

# v1.0.0 (June 9, 2022)

* Initial release