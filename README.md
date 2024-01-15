# TODO:
## NAVIGATION
* Move navigation banner to the left; 
    * when screen is small ie mobile/table etc convert to breadcrumb style navigation
    * set tags as submenu for blog
    * Create [dynamic sub menu](###dynamic-sub-menu) menu for repo

## dynamic sub menu
3 item list
### description
The sub menu will consist of 3 items from the list in the page
when clicked auto navigate to the page and scroll or move the page so that content is visible in the center of the screen
darken the other content of the page 
lighten the center item

#### must have 
* [ ] 3 items
    * [ ] dynamic list of items
* [ ] auto navigate to the page and scroll or move the page so that content is visible in the center of the screen

## Content highlighting 

### description
When content is in the center of the screen it should be highlighted
When content is not in the center of the screen it should be darkened

## localstorage use for settings
* check if localstorage is available
    * check if localstorage has settings
        * load the settings
    * Set default settings and save to localstorage
* if not set default settings

## Create Repo card



====================================================================================================


# Astro Starter Kit: Minimal

```
npm create astro@latest -- --template minimal
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/minimal)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/minimal)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/minimal/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
