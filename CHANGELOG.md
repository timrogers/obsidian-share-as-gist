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