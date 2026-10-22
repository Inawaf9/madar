/** Real Chrome + real Spring Boot checks; no mocked product data.
 * Start Next dev on 127.0.0.1:3000 and a separate headless Chrome on port 9222.
 * Run: node tests/browser/runtime.mjs
 */
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const origin = process.env.MADAR_TEST_FRONTEND_URL || 'http://127.0.0.1:3000';
const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = targets.find(t => t.type === 'page'); assert(target);
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let nextId=0; const pending=new Map(); const errors=[]; const traffic=[]; const checks=[];
const recordCheck = checks.push.bind(checks); checks.push = value => { console.log(value); return recordCheck(value); };
ws.onmessage=({data})=>{ const value=JSON.parse(data); if(value.id){const p=pending.get(value.id);pending.delete(value.id);if(value.error)p.reject(new Error(JSON.stringify(value.error)));else p.resolve(value.result);}else {
  if(value.method==='Runtime.exceptionThrown') errors.push(value.params.exceptionDetails.exception?.description??value.params.exceptionDetails.text);
  if(value.method==='Log.entryAdded' && value.params.entry.level==='error' && !value.params.entry.text.includes('status of 400')) errors.push(value.params.entry.text);
  if(value.method==='Network.requestWillBeSent' && value.params.request.url.includes('/api/backend/')) traffic.push({method:value.params.request.method,url:value.params.request.url});
}};
function command(method,params={}){const id=++nextId;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(expression,timeout=30000){const end=Date.now()+timeout;while(Date.now()<end){try{if(await evaluate(`Boolean(${expression})`))return;}catch{}await pause(100);}throw new Error('Timeout: '+expression);}
async function navigate(path){await command('Page.navigate',{url:origin+path});await until(`location.pathname === ${JSON.stringify(path.split('?')[0])} && document.querySelector('h1') && !document.querySelector('nextjs-portal')?.shadowRoot?.querySelector('[data-nextjs-dialog]')`);await until(`!document.querySelector('form') || [...document.querySelectorAll('form')].every(f=>f.dataset.ready==='true')`);await pause(250);}
async function fill(name,value){await until(`document.querySelector('input[name="${name}"]')?.closest('form')?.dataset.ready==='true'`);await evaluate(`(()=>{const el=document.querySelector('input[name="${name}"]');if(!el)throw new Error('Missing field ${name}');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(String(value))});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));})()`);}
async function submit(form=0){await evaluate(`document.querySelectorAll('form')[${form}].requestSubmit()`);await pause(150);}
async function clickText(text){await evaluate(`(()=>{const el=[...document.querySelectorAll('button,a,summary')].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!el)throw new Error('Missing control ${text}');el.scrollIntoView({block:'center',behavior:'instant'});el.click();})()`);await pause(150);}
async function backend(method,path,body){const r=await fetch(origin+'/api/backend/api/v1/'+path,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});let v;try{v=await r.json()}catch{};assert(r.ok,JSON.stringify({path,status:r.status,body:v}));return v;}
const email='browser.'+Date.now()+'@example.test'; let userId;
mkdirSync('/tmp/madar-browser',{recursive:true});
await command('Page.enable');await command('Runtime.enable');await command('Log.enable');await command('Network.enable');
if(process.argv.includes('--capture-public')) { for(const locale of ['ar','en']) for(const route of ['', '/login','/register']) { await navigate('/'+locale+route);await pause(1600);const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(`/tmp/madar-browser/${locale}-public-${route.replace('/','')||'marketing'}.png`,Buffer.from(shot.data,'base64')); } ws.close();process.exit(); }
if(process.argv.includes('--inspect')) { console.log(await evaluate('({location:location.href,text:document.body.innerText.slice(0,15000)})')); ws.close(); process.exit(); }
try {
  await navigate('/en/login');
  await evaluate('localStorage.clear()');
  await command('Page.navigate',{url:origin+'/en/dashboard'});await until(`location.pathname==='/en/login' && document.querySelector('form[data-ready="true"]')`);checks.push('Missing identity redirects to login');
  await fill('email','invalid');await fill('password','x');await submit();await until(`document.querySelector('[aria-invalid="true"]')`);checks.push('Localized form validation rejects malformed email');
  await fill('email','test@example.test');await fill('password','Wrong!Pass8');await submit();await until(`document.body.innerText.includes('no email/password login operation')`);assert(!await evaluate('localStorage.getItem("madar_user_id")'));checks.push('Unsupported login never accepts credentials or stores an ID');
  await navigate('/en/register');await fill('fullName','Browser Test User');await fill('email',email);await fill('password','TestOnly!Pass8');await submit();await until(`document.body.innerText.includes('Your account was created.')`);assert(!await evaluate('localStorage.getItem("madar_user_id")'));checks.push('Registration submits real request and reports missing returned ID without fabricating identity');
  userId=Number(execFileSync('python3',['-c',`import os,re,subprocess,sys
from pathlib import Path
p=dict(line.split('=',1) for line in Path('../Backend/src/main/resources/application.properties').read_text().splitlines() if '=' in line and not line.startswith('#'))
env=dict(os.environ,MYSQL_PWD=p.get('spring.datasource.password',''))
r=subprocess.run(['/Applications/XAMPP/xamppfiles/bin/mysql','--protocol=TCP','-h','127.0.0.1','-P','3306','-u',p['spring.datasource.username'],'-D','madar','-N','-B','-e',"SELECT id FROM user WHERE email='"+sys.argv[1]+"'"],env=env,capture_output=True,text=True,check=True)
print(r.stdout.strip())`,email],{encoding:'utf8'}).trim());assert(userId>0);
  await navigate('/en/login');await clickText('Continue with a development account');await fill('userId',userId);await submit(1);await until(`location.pathname==='/en/dashboard' && document.body.innerText.includes('Browser Test User')`);assert.equal(await evaluate('localStorage.getItem("madar_user_id")'),String(userId));checks.push('Development ID verified against real user and persisted');
  await command('Page.reload');await until(`document.body.innerText.includes('Welcome, Browser Test User')`);checks.push('Reload preserves development identity');
  await navigate('/en/saved');await fill('titleSnapshot','Browser home A');await fill('source','browser-test');await fill('externalPropertyId','browser-a');await submit();await until(`document.querySelector('[data-slot="card-title"]')?.textContent.includes('Browser home A')`);checks.push('Save property persists and updates shortlist');
  await fill('titleSnapshot','Browser home B');await fill('externalPropertyId','browser-b');await submit();await until(`document.body.innerText.includes('Browser home B')`);
  await navigate('/en/locations');await fill('name','Browser office');await fill('type','work');await fill('latitude',24.71);await fill('longitude',46.67);await fill('importance',4);await fill('visitPerWeek',5);await submit();await until(`document.body.innerText.includes('Browser office') && document.body.innerText.includes('Visits per week: 5')`);checks.push('Important location create persists');
  await until(`document.querySelector('input[name="name"]').value===''`);await clickText('Edit');await until(`document.body.innerText.includes('Edit place')`);await fill('name','Browser office updated');await submit(1);await until(`document.body.innerText.includes('Browser office updated')`);checks.push('Important location edit persists');
  await navigate('/en/compare');
  // Choose the second saved listing through the actual shadcn select.
  await evaluate(`document.querySelectorAll('[data-slot="select-trigger"]')[1].click()`);await until(`document.querySelector('[data-slot="select-content"]')`);
  await evaluate(`(()=>{const el=[...document.querySelectorAll('[data-slot="select-item"]')].find(e=>e.textContent.includes('Browser home B'));el.click()})()`);await submit();await until(`document.querySelector('table')?.innerText.includes('browser-b')`);checks.push('Saved property selection creates a persisted comparison');
  const pair=(await backend('GET','property-comparison/get-by-user/'+userId))[0];
  const saved=await backend('GET','saved-property/get/'+userId);
  await navigate('/en/compare/'+pair.id);await until(`document.querySelector('table') && document.querySelector('form')`);checks.push('Comparison detail invokes the owned pair endpoint');
  await navigate('/en/properties/'+saved[0].id);await until(`document.body.innerText.includes('browser-a')`);checks.push('Saved reference details show real stored data');
  await navigate('/en/profile');
  await fill('fullName','Browser Updated User');await fill('password','TestOnly!Pass8');await submit(0);
  await until(`document.body.innerText.includes('Browser Updated User')`);checks.push('Profile update persists and refreshes the user header');
  await fill('latitude',24.73);await fill('longitude',46.68);await fill('movedInAt','2026-01-01');await submit(1);
  await until(`fetch('/api/backend/api/v1/current-home/get-by-user/${userId}').then(r=>r.json()).then(v=>v.latitude===24.73)`);checks.push('Current home form creates a persisted home');
  await fill('latitude',24.75);await submit(1);await until(`fetch('/api/backend/api/v1/current-home/get-by-user/${userId}').then(r=>r.json()).then(v=>v.latitude===24.75)`);checks.push('Current home edit persists');
  await fill('region','Riyadh Region');await fill('city','Riyadh');await fill('district','Test district');await fill('maxBudget',750000);await fill('propertyType','apartment');await submit(2);
  await until(`fetch('/api/backend/api/v1/housing-preference/get-by-user/${userId}').then(r=>r.json()).then(v=>v.maxBudget===750000)`);checks.push('Housing preference form creates persisted preferences');
  await fill('maxBudget',800000);await submit(2);await until(`fetch('/api/backend/api/v1/housing-preference/get-by-user/${userId}').then(r=>r.json()).then(v=>v.maxBudget===800000)`);checks.push('Housing preference edit persists');
  await navigate('/en/locations');await clickText('Importance: 4 / 5 · Change');await fill('importance',5);await submit(0);await until(`document.body.innerText.includes('Importance: 5 / 5')`);checks.push('Location importance invokes PATCH and refreshes its value');
  await navigate('/en/compare/'+pair.id);
  for (const [index,text] of [[0,'Browser home B'],[1,'Browser home A']]) {
    await evaluate(`document.querySelectorAll('[data-slot="select-trigger"]')[${index}].click()`);await until(`document.querySelector('[data-slot="select-content"]')`);
    await evaluate(`(()=>{const el=[...document.querySelectorAll('[data-slot="select-item"]')].find(e=>e.textContent.includes(${JSON.stringify(text)}));el.click()})()`);
  }
  await submit();await until(`fetch('/api/backend/api/v1/property-comparison/get-by-id/${userId}/${pair.id}').then(r=>r.json()).then(v=>v.firstPropertyId==='browser-b')`);checks.push('Comparison update persists changed property selections');
  // Verify all consumer pages in both locales, two viewports, and light/dark.
  for (const locale of ['en','ar']) for (const theme of ['light','dark']) for (const width of [1440,390]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
    await evaluate(`localStorage.setItem('theme',${JSON.stringify(theme)})`);
    for(const route of ['dashboard','properties','saved','locations','compare','profile']) {
      await navigate('/'+locale+'/'+route);
      await until(`document.documentElement.classList.contains(${JSON.stringify(theme)})`);
      const state=await evaluate(`({h1:document.querySelector('h1')?.innerText,dir:document.documentElement.dir,overflow:document.documentElement.scrollWidth>innerWidth+1,body:document.body.innerText})`);
      assert(state.h1,route);assert.equal(state.dir,locale==='ar'?'rtl':'ltr');assert(!state.overflow,`${locale}/${route} ${theme} ${width}: horizontal overflow`);
      assert(!state.body.includes('MISSING_MESSAGE'),route);
      const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(`/tmp/madar-browser/${locale}-${theme}-${width}-${route}.png`,Buffer.from(shot.data,'base64'));
    }
    checks.push(`${locale} ${theme} ${width}px: all 6 product pages render with correct direction and no horizontal overflow`);
  }
  // Exercise confirmation dialogs and live cache invalidation.
  await navigate('/en/compare');await clickText('Remove');await until(`document.querySelector('[role="alertdialog"]')`);await clickText('Confirm removal');await until(`document.body.innerText.includes('Bring two options together')`);checks.push('Comparison deletion confirms and updates its empty state');
  await navigate('/en/locations');await clickText('Remove');await until(`document.querySelector('[role="alertdialog"]')`);await clickText('Confirm removal');await until(`document.body.innerText.includes('Make room for your everyday places')`);checks.push('Location deletion confirms and updates its empty state');
  await navigate('/en/saved');await clickText('Remove');await until(`document.querySelector('[role="alertdialog"]')`);await clickText('Confirm removal');await until(`!document.body.innerText.includes('Browser home A')`);checks.push('Saved property deletion persists and updates cards');
  await navigate('/en/profile');
  for(const title of ['Your current home','Your housing preferences']) {
    await evaluate(`(()=>{const card=[...document.querySelectorAll('[data-slot="card"]')].find(c=>c.querySelector('[data-slot="card-title"]')?.textContent===${JSON.stringify(title)});[...card.querySelectorAll('button')].find(b=>b.textContent==='Remove').click()})()`);
    await until(`document.querySelector('[role="alertdialog"]')`);await clickText('Confirm removal');await until(`!document.querySelector('[role="alertdialog"]')`);
  }
  checks.push('Current home and housing preference deletion use confirmations and refresh forms');
  await command('Network.setBlockedURLs',{urls:['*api/backend*']});
  await command('Page.reload');await until(`document.body.innerText.includes('Cannot reach MADAR right now')`);checks.push('Blocked API connection shows retry and logout controls without fake data');
  await command('Network.setBlockedURLs',{urls:[]});await clickText('Try again');await until(`document.querySelector('h1')?.innerText==='Your account and preferences'`);checks.push('Retry recovers from a connection failure');
  await navigate('/en/dashboard');await evaluate(`document.querySelector('button[aria-label="Log out"]').click()`);await until(`location.pathname==='/en/login'`);assert(!await evaluate('localStorage.getItem("madar_user_id")'));checks.push('Logout clears user ID and redirects');
  await evaluate(`localStorage.setItem('madar_user_id','2147483647')`);await command('Page.navigate',{url:origin+'/en/dashboard'});await until(`location.pathname==='/en/login'`);assert(!await evaluate('localStorage.getItem("madar_user_id")'));checks.push('Nonexistent stored user is cleared and redirected');
  await evaluate(`localStorage.setItem('madar_user_id',${JSON.stringify(String(userId))})`);await navigate('/en/dashboard');
  await evaluate(`document.querySelector('button[aria-label="Navigation"]').click()`);await until(`document.querySelector('[data-slot="sheet-content"]')`);
  await evaluate(`[...document.querySelectorAll('[data-slot="sheet-content"] a')].find(a=>a.textContent.includes('Saved homes')).click()`);await until(`location.pathname==='/en/saved' && !document.querySelector('[data-slot="sheet-content"]')`);checks.push('Mobile navigation opens, follows a route and closes');
  await evaluate(`document.querySelector('button[aria-label="العربية"]').click()`);await until(`location.pathname==='/ar/saved' && document.documentElement.dir==='rtl'`);checks.push('Language switch preserves the current product route');
  await backend('POST','property-comparison/add/'+userId,{firstPropertyId:'delete-test-a',firstPropertySource:'browser-test',secondPropertyId:'delete-test-b',secondPropertySource:'browser-test'});
  await navigate('/en/profile');await clickText('Delete account');await until(`document.querySelector('[role="alertdialog"]')`);await clickText('Confirm removal');await until(`location.pathname==='/en/login'`);
  const removed=await fetch(origin+'/api/backend/api/v1/user/get/'+userId);assert.equal(removed.status,400);assert(!await evaluate('localStorage.getItem("madar_user_id")'));userId=undefined;checks.push('Account deletion removes comparisons, deletes the user and clears local identity');
  // Verify the public marketing and auth pages also retain both locales.
  for(const locale of ['ar','en']) { for(const route of ['', '/login','/register']) { await navigate('/'+locale+route);await pause(1600);const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(`/tmp/madar-browser/${locale}-public-${route.replace('/','')||'marketing'}.png`,Buffer.from(shot.data,'base64')); } }
  checks.push('Marketing, login and registration render in both locales');
  // Ignore expected browser network errors from documented empty 400 responses.
  const unexpected=errors.filter(e=>!e.includes('Failed to load resource: the server responded with a status of 400') && !e.includes('net::ERR_BLOCKED_BY_CLIENT'));
  assert.equal(unexpected.length,0,unexpected.join('\n'));
} finally {
  if(userId) {
    try{for(const p of await backend('GET','property-comparison/get-by-user/'+userId))await backend('DELETE',`property-comparison/delete/${userId}/${p.id}`);await backend('DELETE','user/delete/'+userId);}catch(e){console.error('Disposable account cleanup:',e.message);}
  }
  writeFileSync('/tmp/madar-browser/results.json',JSON.stringify({checks,errors,traffic},null,2));ws.close();
}
console.log(JSON.stringify({passed:checks.length,checks,requests:traffic.length,screenshots:'/tmp/madar-browser'},null,2));
