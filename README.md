# Rajeeb Online Workshop — Professional Digital Service Portal

A Bootstrap 5 + custom JavaScript service portal inspired by the provided screenshots.

## Folder structure

- `index.html` — main website
- `css/style.css` — complete responsive design + dark/light theme
- `js/app.js` — rendering, search, modal, theme switcher, WhatsApp links
- `data/services.json` — **EDIT THIS FILE TO MANAGE SERVICES**
- `assets/` — optional local images/icons

## How to update services

Open:

`data/services.json`

Every service has fields such as:

- `name`
- `icon`
- `description`
- `badge`
- `officialUrl`
- `image`
- `enabled`
- `whatsappMessage`

You can add, remove, rename, disable or reorder services without changing the main HTML.

### Example

```json
{
  "id": "my-service",
  "name": "My New Service",
  "icon": "🆕",
  "description": "My service description.",
  "badge": "new",
  "accent": "#2563eb",
  "officialUrl": "https://example.gov.in/",
  "image": "",
  "enabled": true,
  "whatsappMessage": "Hello Rajeeb Online Workshop, I want help with: My New Service."
}
```

## Important: change your WhatsApp number

In `data/services.json` change:

```json
"whatsappNumber": "919999999999"
```

Use your real WhatsApp number with country code, without `+` or spaces.

## Run locally

Because the website loads JSON using `fetch()`, do not normally open `index.html` directly with `file://`.

Use any local server, for example:

### VS Code

Install Live Server and open `index.html` with Live Server.

### Python

From the project folder:

```bash
python -m http.server 5500
```

Then open:

`http://localhost:5500`

## Netlify

This is a static website and can be deployed directly to Netlify.

Upload the whole project folder/ZIP after extracting it. No PHP or database is required for this version.

## Design features

- Bootstrap 5
- Fully responsive
- Desktop / tablet / mobile layouts
- Dark / light theme with localStorage
- Search across all services
- Quick search chips
- Category navigation
- Service cards generated from JSON
- Service detail modal
- Official portal button
- WhatsApp “Message to Apply” button
- Badges: NEW / HOT / PRO
- Back-to-top button
- Scroll progress indicator
- No hard-coded service cards in HTML

## Important legal/UX note

Keep official government links clearly separated from your own assistance/WhatsApp service. Do not present your private service centre as a government department.


## Screenshot service catalogue

The JSON catalogue includes the services shown across the supplied screenshots, grouped into:

1. Essential & Online Services
2. Creative Design Studio
3. Smart PDF & Image Tools
4. Card Printing Services
5. Government & Portal Services

## Search

The homepage search is live and searches:

- Service name
- Service ID
- Description
- JSON `tags`
- Category name

To make a service easier to find, add keywords:

```json
"tags": ["PAN", "Permanent Account Number", "NSDL", "PAN apply"]
```

The search works without changing the HTML.
