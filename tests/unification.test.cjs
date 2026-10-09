const {test}=require('node:test');
const assert=require('node:assert/strict');
const {environment}=require('./helpers.cjs');
test('Identical search requests reuse one inquiry, changed criteria create a distinct request',async()=>{
 const e=environment(),route=e.load('app/api/search-alerts/route.ts');
 const body={email:' Search@test.invalid ',consent:true,criteria:{maxPrice:'80000000',city:'Debrecen',sort:'newest'}};
 for(let i=0;i<2;i++) assert.equal((await route.POST(e.request('owner',body))).status,200);
 assert.equal([...e.store.keys()].filter(k=>k.startsWith('inquiries/')).length,1);
 const row=[...e.store].find(([k])=>k.startsWith('inquiries/'))[1];
 assert.equal(row.email,'search@test.invalid');assert.equal(row.kind,'search');assert.ok(row.consentAt);assert.match(row.message,/80000000/);
 assert.equal((await route.POST(e.request('owner',{...body,criteria:{city:'Debrecen',maxPrice:'80000000',sort:'featured'}}))).status,200);
 assert.equal([...e.store.keys()].filter(k=>k.startsWith('inquiries/')).length,1);
 assert.equal((await route.POST(e.request('owner',{...body,criteria:{city:'Debrecen',maxPrice:'90000000'}}))).status,200);
 assert.equal([...e.store.keys()].filter(k=>k.startsWith('inquiries/')).length,2);
});
test('Search validation rejects missing consent, empty criteria, inverted ranges and foreign origins',async()=>{
 const e=environment(),route=e.load('app/api/search-alerts/route.ts');
 for(const body of [{email:'a@test.invalid',consent:false,criteria:{city:'Debrecen'}},{email:'a@test.invalid',consent:true,criteria:{}},{email:'a@test.invalid',consent:true,criteria:{minPrice:'9',maxPrice:'1'}}])assert.equal((await route.POST(e.request('owner',body))).status,400);
 const request=new Request('https://debrecenhomes.hu/api/search-alerts',{method:'POST',headers:{origin:'https://foreign.invalid','content-type':'application/json'},body:JSON.stringify({email:'a@test.invalid',consent:true,criteria:{city:'Debrecen'}})});
 assert.equal((await route.POST(request)).status,403);assert.equal(e.store.size,3);
});
test('Search retries after email failure remain saved once and admin sees them',async()=>{
 const e=environment();const keys=['BREVO_API_KEY','BREVO_FROM_EMAIL','BREVO_TO_EMAIL'],before=keys.map(k=>process.env[k]);
 keys.forEach(k=>process.env[k]='test-only');
 try{
  e.setFetch(async()=>new Response('unavailable',{status:503}));
  const route=e.load('app/api/search-alerts/route.ts'),body={email:'a@test.invalid',consent:true,criteria:{city:'Debrecen'}};
  assert.equal((await route.POST(e.request('owner',body))).status,200);
  assert.equal((await route.POST(e.request('owner',body))).status,200);
  const page=await e.load('app/api/admin/inquiries/route.ts').GET(e.request('admin',undefined,'GET'));
  const data=await page.json();assert.equal(data.inquiries.length,1);assert.equal(data.inquiries[0].delivery,'failed');
 }finally{keys.forEach((k,i)=>before[i]===undefined?delete process.env[k]:process.env[k]=before[i]);}
});
test('Legacy search alerts appear and can be managed without copying or deleting them',async()=>{
 const e=environment();e.store.set('searchAlerts/old',{email:'a@test.invalid',criteria:{city:'Debrecen'},status:'pending',createdAt:'2026-10-01',version:0});
 const route=e.load('app/api/admin/inquiries/route.ts');
 const req=new Request('https://debrecenhomes.hu/api/admin/inquiries?source=legacy',{headers:{authorization:'Bearer admin'}});
 const data=await(await route.GET(req)).json();assert.equal(data.inquiries[0].id,'legacy_old');assert.equal(data.inquiries[0].status,'new');assert.match(data.inquiries[0].message,/Debrecen/);
 assert.equal((await route.PATCH(e.request('admin',{id:'legacy_old',status:'callback',notes:'Called',expectedVersion:0},'PATCH'))).status,200);
 assert.equal(e.store.get('searchAlerts/old').status,'callback');assert.equal([...e.store.keys()].some(k=>k.startsWith('inquiries/')),false);
});
test('One quality policy governs admin and form; extra photos remain suggestions',()=>{
 const e=environment(),{listingQuality}=e.load('app/lib/listingQuality.ts'),{missingPropertyFields}=e.load('app/lib/managementPolicy.ts');
 const p={area:60,rooms:2,phone:'+36301234567',imageUrl:'https://test.invalid/one.jpg',propertyType:'lakás'};
 assert.equal(listingQuality(p).score,100);assert.deepEqual(missingPropertyFields(p),listingQuality(p).missing);assert.ok(listingQuality(p).suggestions.length>0);
});
test('Dates sort consistently before and after live Firebase refresh; explicit sale is respected',()=>{
 const e=environment(),{listingCreatedMillis,sortListings}=e.load('app/lib/listingOrder.ts');
 assert.equal(listingCreatedMillis(1000),listingCreatedMillis({toMillis:()=>1000}));
 assert.deepEqual(sortListings([{id:'old',createdAt:1000},{id:'new',createdAt:2000}],'newest').map(x=>x.id),['new','old']);
 const {propertyFromFirestore}=e.load('app/lib/types.ts');assert.equal(propertyFromFirestore('a',{title:'Korábban kiadó lakás',listingPurpose:'sale'}).listingPurpose,'sale');
});

test('Re-submitting a legacy search request does not create a second operation',async()=>{
 const e=environment();e.store.set('searchAlerts/old',{email:'a@test.invalid',criteria:{city:'Debrecen'},status:'pending'});
 const route=e.load('app/api/search-alerts/route.ts');
 assert.equal((await route.POST(e.request('owner',{email:'a@test.invalid',consent:true,criteria:{city:'Debrecen'}}))).status,200);
 assert.equal([...e.store.keys()].some(k=>k.startsWith('inquiries/')),false);
});
test('Favorite writes use one identity and remove legacy duplicates on every surface',async()=>{
 const fs=require('node:fs'),ts=require('typescript');
 const store=new Map([['legacy1',{userId:'owner',postId:'post'}],['legacy2',{userId:'owner',postId:'post'}]]);
 const doc=(_db,_name,id)=>({id});
 const fake={collection:()=>({}),doc,query:(_c,...filters)=>filters,where:(field,_op,value)=>({field,value}),getDocs:async(filters)=>({docs:[...store].filter(([,row])=>filters.every(f=>row[f.field]===f.value)).map(([id])=>({id,ref:{id}}))}),writeBatch:()=>{const ops=[];return{delete:r=>ops.push(()=>store.delete(r.id)),set:(r,data)=>ops.push(()=>store.set(r.id,data)),commit:async()=>ops.forEach(f=>f())};}};
 const module={exports:{}};const source=ts.transpileModule(fs.readFileSync('app/lib/favorites.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',source)(name=>name==='firebase/firestore'?fake:{db:{}},module,module.exports);
 await Promise.all([module.exports.setFavorite('owner','post',true),module.exports.setFavorite('owner','post',true)]);
 assert.deepEqual([...store.keys()],['owner:post']);
 await module.exports.setFavorite('owner','post',false);assert.equal(store.size,0);
});

test('Verification emails use shared sender and throttle repeated sends',async()=>{
 const e=environment();e.accounts.get('owner').emailVerified=false;e.auth.generateEmailVerificationLink=async()=> 'https://test.invalid/verify?code=test';
 const keys=['BREVO_API_KEY','BREVO_FROM_EMAIL'],before=keys.map(k=>process.env[k]);keys.forEach(k=>process.env[k]='test-only');let sent=0;
 try{
  e.setFetch(async()=>{sent++;return Response.json({messageId:'test'});});
  const route=e.load('app/api/auth/send-verification/route.ts');
  assert.equal((await route.POST(e.request('owner',{}))).status,200);
  assert.equal((await route.POST(e.request('owner',{}))).status,429);
  assert.equal(sent,1);assert.ok(e.auth.verifyChecks.every(Boolean));
 }finally{keys.forEach((k,i)=>before[i]===undefined?delete process.env[k]:process.env[k]=before[i]);}
});
