# emojinize.com

The website of [Emojinize](https://github.com/emojinize-app/emojinize-web-extension).
Static files on GitHub Pages (`CNAME`), no build step, no framework, no
cookies and no analytics.

| Page | File | What it is |
|---|---|---|
| `/` | `index.html` | Home: the pitch, Add to Chrome, a recorded sample |
| `/write/` | `write/index.html` | Write your own: the extension's writer, on the site |
| `/tour/` | `tour/index.html` | The welcome tour |
| `/feedback/` | `feedback/index.html` | The feedback form |
| `/privacy/` | `privacy/index.html` | The privacy policy |

`assets/site.css` holds the look, in the extension's own colours. It follows
the system's light or dark mode. `assets/samples.js` is real model output: the
welcome tour's sample, copied from the extension's `tour-data.js`.

## Preview locally

    python3 -m http.server 8000      # from this folder, then open http://localhost:8000

Add `?preview=installed` to any address to see the page as someone who has
the extension sees it. To run the extension itself against this local copy,
build it with `EMOJINIZE_SITE=http://localhost:8000 node build.js` in
emojinize-web-extension and load its `dist/` unpacked.

## Services (`assets/config.js`)

Served from emojinize.com the site uses the production Workers; served from
localhost, the dev ones (which accept `http://localhost:8000`).

- **Write**, for visitors without the extension: the inference gateway
  (emojinize-server `gateway/`) with `WEB_TOKEN`, the gateway's token for this
  site. It is public, like the extension's: what it buys is a budget of its
  own (20 requests per address a minute, one text of at most 1,000
  characters), and deleting the gateway's `WEB_TOKEN` secret turns the demo
  off without touching the extension. Empty here, pressing Emojinize says the
  demo opens soon.
- **Feedback**: the feedback Worker (emojinize-server `feedback/`), which keeps
  messages in Cloudflare D1 and counts them for the usage dashboard; Grafana's
  "Emojinize: feedback" dashboard reads them. The form posts
  `{topic, message, website, source, version, env, turnstile, company}`;
  `company` is a field people never see, which bots fill in. `topic` is one of
  `broken`, `quality`, `idea`, `experience` and `other`, and `source` one of
  `popup`, `tour`, `prompt`, `uninstall` and `site`: the telemetry Worker's
  `FEEDBACK_VOCAB`. With `TURNSTILE_SITE_KEY` set (and the Worker's
  `TURNSTILE_SECRET`), the form also needs a Cloudflare Turnstile token. With
  `FEEDBACK_ENDPOINT` empty, the page links to the old Tally form instead.

## Where the extension takes over

The extension's content scripts run on every site, this one included. Three
attributes on `<html>`, set by a content script at `document_start` on
emojinize.com, are the whole hand-off:

- `data-emojinize-extension="<version>"`: the extension is installed. Pages
  then show what is marked `data-when="installed"` and hide `data-when="new"`
  (Home's Add to Chrome becomes "Emojinize is installed").
- `data-emojinize-writer="host"`: the extension runs the writer (its
  `write.js`). `assets/write.js` then leaves the box alone, and the extension
  drives `#writer` (`data-state` edit or result), `#text`, `#go`, `#edit`,
  `#result`, `#copies`, `#copy-annotated`, `#copy-replaced`, `#reveal`,
  `#count`, `#keys`, `#status`, `#why`, `#service`/`#service-text` and
  `#pager`/`#prev`/`#next`/`#page-of`, with the reader's own settings and
  10,000 characters.
- `data-emojinize-tour="host"`: the extension runs the tour (its
  `welcome.js`, on the real popup, right click and shortcuts). `assets/tour.js`
  then leaves it alone, and the extension builds each step into `#step`, lists
  the steps in `#rail`, and answers `#dots`, `#back`, `#next` and `#skip`.
  Only the tour's own controls are marked `data-emojinize="ui"` on that page:
  the extension emojinizes the sample story inside `#step`.

Everything the extension should not annotate carries `data-emojinize="ui"`
(the header, and every page's working parts): the page pass skips it, so
Automatic mode never puts emojis on the site's own controls or samples.

## The privacy policy

This is now the policy's home. The Chrome Web Store listing's data-use
answers are read together with it (emojinize-web-extension
`site/README.md`): change this page first, then the answers and the code.
`emojinize.pages.dev/privacy.html`, the store listing's old link, redirects
here.
