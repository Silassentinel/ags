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

## Create (Repo) card
Create a generic card first
### Description
The card should contain a title, subtitle, text, image, buttons, style, id.
When one of the optional are not given it should be omitted and the space should be used for the other items.

When the text is more than 3 lines (need to figure out how to capture this on different screens) 
the text should be truncated and a read more link should be added to the card.

readmore link should make the card flip into a full text.