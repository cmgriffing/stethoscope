<h1 align="center">🩺 Stethoscope</h1>
<p align="center">Use this extension to get a quick pulse check on any repos you are considering using.</p>
<hr />

## Usage

Stethoscope is fairly easy to use. We use a set of criteria to judge the repo using only what is available on the repo's root page.
*There are plans to add further functionality using github login and the API.*

### Steps

1. Navigate to a repo of your choice.
2. Observe the icon change in your extension par if you have it pinned.
3. Green is great. Red indicates failure.
4. Use your extension manager button to open the popup modal for more details.

### Criteria

It is **important** to note that missing some of these is not a huge problem. They add up in total to more than 100% of a possible score. So, one missing can still allow a perfect grade.

- Has License file or section in the README. It is an immediate fail if no license is found.

- Stars count being above 100.
- Has Readme file.
- Most recent commit. Scaled to within a year. 1 year ago being a 0 and now being a 20.
- Amount of contributors being greater than 5.
- Amount of commits.
- Has a sponsors section.
- Has a releases section
- Has docs folder.
- Frequency of commits for root level files and folders. Checks amount of time between most recent and oldest. Also checks for varied dates between and ratio of unique commits.
- Open issues relative to star count or commit count, whichever is greater.

## 🚀 Contributing

Ensure you have

- [Node.js](https://nodejs.org) 10 or later installed
- [Yarn](https://yarnpkg.com) v1 or v2 installed

Then run the following:

- `yarn install` to install dependencies.
- `yarn run dev:chrome` to start the development server for chrome extension
- `yarn run dev:firefox` to start the development server for firefox addon
- `yarn run dev:opera` to start the development server for opera extension
- `yarn run build:chrome` to build chrome extension
- `yarn run build:firefox` to build firefox addon
- `yarn run build:opera` to build opera extension
- `yarn run build` builds and packs extensions all at once to extension/ directory

### Development

- `yarn install` to install dependencies.
- To watch file changes in development

  - Chrome
    - `yarn run dev:chrome`
  - Firefox
    - `yarn run dev:firefox`
  - Opera
    - `yarn run dev:opera`

- **Load extension in browser**

- ### Chrome

  - Go to the browser address bar and type `chrome://extensions`
  - Check the `Developer Mode` button to enable it.
  - Click on the `Load Unpacked Extension…` button.
  - Select your extension’s extracted directory.

- ### Firefox

  - Load the Add-on via `about:debugging` as temporary Add-on.
  - Choose the `manifest.json` file in the extracted directory

- ### Opera

  - Load the extension via `opera:extensions`
  - Check the `Developer Mode` and load as unpacked from extension’s extracted directory.

## Bugs

Please file an issue [here](https://github.com/cmgriffing/stethoscope/issues/new) for bugs, missing documentation, or unexpected behavior.

### Linting & TypeScript Config

- Shared Eslint & Prettier Configuration - [`@abhijithvijayan/eslint-config`](https://www.npmjs.com/package/@abhijithvijayan/eslint-config)
- Shared TypeScript Configuration - [`@abhijithvijayan/tsconfig`](https://www.npmjs.com/package/@abhijithvijayan/tsconfig)

## License

MIT License

Copyright (c) Chris Griffing <cmgriffing@gmail.com> (https://chrisgriffing.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
