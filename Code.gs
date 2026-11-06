/**
 * CHIRON Knowledge Hub → Clientify bridge (Google Apps Script)
 * ------------------------------------------------------------
 * Receives the two forms of chiron-knowledge-hub.html:
 *   - "profile"  (Create your profile)
 *   - "support"  (Ask the CHIRON team)
 * and creates or updates the contact in Clientify by email, with CHIRON tags and fields.
 * Optionally keeps a copy of every submission in a Google Sheet.
 *
 * The Clientify API key NEVER goes in the web page. It lives in
 * Project settings → Script properties:
 *   CLIENTIFY_TOKEN   (required)  your Clientify API key
 *   SHEET_ID          (optional)  ID of a Google Sheet for a backup copy
 *   NOTIFY_EMAIL      (optional)  e.g. teachers@escolaeuropea.eu – gets an email for every "support" request
 */

const CLIENTIFY_API = 'https://api.clientify.net/v1';

/* Existing Clientify tags and fields (checked 5 Nov 2026). Change names here if Valeria renames anything. */
const TAGS = {
  member:   'chiron',          // every CHIRON profile
  openLab:  'open lab',        // "My centre has an Open Lab licence"
  active:   'pvl-teacher',     // "I use PVL with students this year"
  tot:      'done-pvl-tot',    // "I completed the Training of Trainers" (alternative existing tag: pvltotcompleted)
  request:  'chiron-request'   // "Ask the CHIRON team" form (new tag, created on first use)
};
const FIELDS = {
  pvlCategory:  'Port Virtual Lab Category',   // multiselect: Open Lab | Chiron
  contactType:  'Type of contact (new)',       // multiselect: ... Teacher ...
  centre:       'Center / University',          // text
  language:     'Idioma',                       // dropdown: Spanish | English | Italian | French | Portuguese
  privacy:      'I have read and accept the Privacy Policy of Escola Europea', // checkbox
  marketing:    'Willing to receive our marketing emails, surveys or polls',    // checkbox
  areas:        'CHIRON – Teaching areas',      // multiselect (new)
  directory:    'CHIRON – Show in directory',   // checkbox (new)
  topics:       'CHIRON – Topics of interest'   // text (new)
};
const LANG_MAP = {'English':'English','Español':'Spanish','Català':'Spanish','Italiano':'Italian','Português':'Portuguese','Français':'French'};

/* ============================ entry points ============================ */

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    if (d.website) return json_({ok:true});                       // honeypot: bots fill it, people don't
    if (!d.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return json_({ok:false, error:'invalid email'});
    if (!d.privacy) return json_({ok:false, error:'privacy not accepted'});

    backup_(d);
    const id = d.form === 'support' ? handleSupport_(d) : handleProfile_(d);
    return json_({ok:true, id:id});
  } catch (err) {
    console.error(err);
    return json_({ok:false, error:String(err.message || err)});
  }
}

function doGet() { return json_({ok:true, service:'CHIRON → Clientify'}); }

/* ============================ handlers ============================ */

function handleProfile_(d) {
  const pvl = [].concat(d.pvl || []);
  const cf = [
    {field: FIELDS.pvlCategory, value: pvl.includes('Open Lab') ? 'Chiron,Open Lab' : 'Chiron'},
    {field: FIELDS.contactType, value: 'Teacher'},
    {field: FIELDS.centre,      value: d.centre || ''},
    {field: FIELDS.areas,       value: [].concat(d.area || []).join(',')},
    {field: FIELDS.directory,   value: !!d.dir},
    {field: FIELDS.topics,      value: d.interests || ''},
    {field: FIELDS.privacy,     value: true}
  ];
  if (d.news) cf.push({field: FIELDS.marketing, value: true});   // only ever switch ON, never overwrite an existing yes with no

  const tags = [TAGS.member];
  if (pvl.includes('Open Lab'))        tags.push(TAGS.openLab);
  if (pvl.includes('Active PVL user')) tags.push(TAGS.active);
  if (pvl.includes('ToT completed'))   tags.push(TAGS.tot);

  const id = upsertContact_(d, cf, tags);
  addNote_(id, 'CHIRON profile',
    `Profile from the CHIRON Knowledge Hub\n` +
    `Role: ${d.role || '-'} · Teaches at: ${d.inst || '-'}\nCountry: ${d.country || '-'}\n` +
    `Areas: ${[].concat(d.area || []).join(', ') || '-'}\nPVL: ${pvl.join(', ') || '-'}\n` +
    `Topics: ${d.interests || '-'}\nShow in directory: ${d.dir ? 'yes' : 'no'} · Newsletter: ${d.news ? 'yes' : 'no'}`);
  return id;
}

function handleSupport_(d) {
  const cf = [
    {field: FIELDS.centre,  value: d.centre || ''},
    {field: FIELDS.privacy, value: true}
  ];
  if (LANG_MAP[d.lang]) cf.push({field: FIELDS.language, value: LANG_MAP[d.lang]});
  const id = upsertContact_(d, cf, [TAGS.member, TAGS.request]);
  const text = `Request from the CHIRON Knowledge Hub (Ask the CHIRON team)\n` +
    `Centre: ${d.centre || '-'}\nCourse: ${d.course || '-'}\nScenario: ${d.scenario || '-'}\nLanguage: ${d.lang || '-'}\n\n${d.need || ''}`;
  addNote_(id, 'CHIRON request', text);

  const notify = prop_('NOTIFY_EMAIL');
  if (notify) MailApp.sendEmail({to: notify, replyTo: d.email, subject: `CHIRON request – ${d.centre || d.name}`, body: `${d.name} <${d.email}>\n\n${text}`});
  return id;
}

/* ============================ Clientify ============================ */

function upsertContact_(d, customFields, tags) {
  const email = String(d.email).trim().toLowerCase();
  const [first, ...rest] = String(d.name || '').trim().split(/\s+/);
  const existing = findContactByEmail_(email);
  const body = {custom_fields: customFields
    .filter(f => f.value !== '' && f.value !== undefined)
    .map(f => ({field: f.field, value: typeof f.value === 'boolean' ? (f.value ? 'True' : 'False') : String(f.value)}))};

  let id;
  if (existing) {
    id = existing.id;
    api_('put', `/contacts/${id}/`, body);                        // never overwrites name or email of an existing contact
  } else {
    const created = api_('post', '/contacts/', Object.assign(body, {
      first_name: first || email, last_name: rest.join(' '),
      email: email,
      contact_source: 'CHIRON Knowledge Hub'
    }));
    id = created.id;
  }
  tags.forEach(t => { try { api_('post', `/contacts/${id}/tags/`, {name: t}); } catch (e) { console.warn('tag', t, e); } });
  return id;
}

function findContactByEmail_(email) {
  const r = api_('get', '/contacts/?query=' + encodeURIComponent(email));
  const list = (r && r.results) || [];
  return list.find(c => (c.emails || []).some(x => String(x.email).toLowerCase() === email)) || null;
}

function addNote_(id, title, text) {
  try { api_('post', `/contacts/${id}/note/`, {name: title, comment: text}); }
  catch (e) { console.warn('note', e); }
}

function api_(method, path, payload) {
  const token = prop_('CLIENTIFY_TOKEN');
  if (!token) throw new Error('CLIENTIFY_TOKEN is missing in Script properties');
  const opts = {method: method, muteHttpExceptions: true, contentType: 'application/json',
                headers: {Authorization: 'Token ' + token, Accept: 'application/json'}};
  if (payload) opts.payload = JSON.stringify(payload);
  const res = UrlFetchApp.fetch(CLIENTIFY_API + path, opts);
  const code = res.getResponseCode(), txt = res.getContentText();
  if (code >= 300) throw new Error(`Clientify ${method.toUpperCase()} ${path} → ${code}: ${txt.slice(0, 300)}`);
  return txt ? JSON.parse(txt) : {};
}

/* ============================ helpers ============================ */

function backup_(d) {
  const id = prop_('SHEET_ID'); if (!id) return;
  const sh = SpreadsheetApp.openById(id).getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(['Date','Form','Name','Email','Centre','Country','Role','Teaches at','Areas','PVL','Topics','Directory','Newsletter','Course','Scenario','Language','Need']);
  sh.appendRow([new Date(), d.form, d.name, d.email, d.centre, d.country, d.role, d.inst,
    [].concat(d.area || []).join(', '), [].concat(d.pvl || []).join(', '), d.interests,
    d.dir ? 'yes' : '', d.news ? 'yes' : '', d.course, d.scenario, d.lang, d.need]);
}
const prop_ = k => PropertiesService.getScriptProperties().getProperty(k);
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ============================ tests (run from the editor) ============================ */

/** Step 1: checks the token works. Run it and look at the log. */
function testConnection() {
  const r = api_('get', '/contacts/?query=international@escolaeuropea.eu');
  console.log('OK. Contacts found for your own email: ' + ((r && r.count) || 0));
}

/** Step 2: creates/updates ONE test contact. Check it in Clientify, then delete it there. */
function testProfile() {
  const id = handleProfile_({form:'profile', name:'Test CHIRON', email:'test.chiron+demo@escolaeuropea.eu',
    centre:'Escola Europea (TEST)', country:'Spain', role:'Teacher', inst:'Vocational training (VET)',
    area:['Maritime','Customs'], pvl:['Open Lab','Active PVL user'], interests:'debrief, assessment',
    dir:true, news:false, privacy:true});
  console.log('Test contact id: ' + id);
}
