# CHIRON Knowledge Hub

The Knowledge Hub of **CHIRON**, the network of educators teaching with Port Virtual Lab.
Run by Escola Europea – Intermodal Transport · part of [pvl.one](https://www.pvl.one) · live site: [chiron.escolaeuropea.eu](https://chiron.escolaeuropea.eu)

## Contents

```
hub/index.html        Knowledge Hub (single self-contained page, published at /hub/)
assets/               Images (logo, Lina, testimonials) – see assets/README.md
apps-script/          Google Apps Script bridge: page forms → Clientify
  Code.gs
  appsscript.json
```

The existing home page of chiron.escolaeuropea.eu is **not** touched. The Hub lives in `/hub/` so it can be reviewed before it is linked from the home.

## Editing content

Everything editable is in the `DATA` block at the top of the `<script>` in `hub/index.html`:

| Constant | What it holds |
|---|---|
| `EVENTS` | Sessions (CHIRON webinar plan). Past/upcoming is calculated from today's date. Put the YouTube link in `video` when a recording is published. |
| `RESOURCES` | Resource cards (case studies, templates, Try it tomorrow…). |
| `NEXT_EPISODES`, `POD_*` | PVL in Practice series. |
| `TEACHERS`, `THREADS`, `POTM`, `STORIES` | **Illustrative examples** for the pilot. Replace with real content. |
| `QUOTES` | Real testimonials from the PVL magazine. |
| `FORM_ENDPOINT` | URL of the Apps Script web app (see below). Empty = demo mode. |

## Clientify connection

The page never holds the Clientify API key. Forms post to a Google Apps Script web app, which holds the key and writes to Clientify:

- **Create your profile** → creates/updates the contact by email; tags `chiron`, `open lab`, `pvl-teacher`, `done-pvl-tot`; fields *Port Virtual Lab Category*, *Type of contact (new)*, *Center / University*, *CHIRON – Teaching areas*, *CHIRON – Show in directory*, *CHIRON – Topics of interest*; plus a note with the profile.
- **Ask the CHIRON team** → tags `chiron` + `chiron-request` and a note with the request. Optional email alert.

### Deploying the script (once)

1. script.google.com → New project → paste `apps-script/Code.gs`.
2. Project settings → **Script properties**:
   - `CLIENTIFY_TOKEN` = Clientify API key (required)
   - `NOTIFY_EMAIL` = teachers@escolaeuropea.eu (optional)
   - `SHEET_ID` = Google Sheet for a backup copy (optional, not used yet)
   - `CHIRON_PIN` = the PIN member centres use to open the **Members** library (required for the members area; without it every sign-in says "not open yet")
   - `MEMBERS_FOLDER_ID` = Drive folder of the members library (optional; defaults to "CHIRON – Members library"). Each subfolder is a category. Files must be shared "Anyone with the link" so members can open them.
   - `TOKEN_SECRET` is created automatically on the first sign-in. Do not share it.
3. Run `testConnection`, then `testProfile` (creates a test contact: check it in Clientify, then delete it).
4. Deploy → New deployment → Web app · Execute as: Me · Who has access: Anyone.
5. Copy the `/exec` URL into `FORM_ENDPOINT` in `hub/index.html`.

After changing the script, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

## Privacy

- Directory profiles never show email; introductions go through the CHIRON team.
- Every form requires accepting the [privacy policy](https://escolaeuropea.eu/privacy-policy/); newsletter and directory are separate, optional consents.
