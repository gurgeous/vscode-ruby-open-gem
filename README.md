![](icon.png)

# Ruby Open Gem for VS Code

This extension adds a **"Ruby Open Gem"** command for Ruby projects in VS Code. It scans your Gemfile with bundler, then you can pick a gem to open in VS Code. Handy!

![](screenshot.png)

## Installation & Troubleshooting

In VS Code, go to **Install Extensions** and search for **ruby-open-gem**. Then click install.

Having trouble making it work? Ruby Open Gem relies on bundler to list gems. Try `bundle check` and `bundle list --paths` in your project if you can't get it to work.

## Changelog

#### 0.0.2 - Feb 2023

- Initial release

---
This extension is licensed under the [MIT License](LICENSE).
