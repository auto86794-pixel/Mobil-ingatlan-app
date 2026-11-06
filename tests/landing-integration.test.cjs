const {test}=require('node:test');
const assert=require('node:assert/strict');
const {environment}=require('./helpers.cjs');
const id='77777777-7777-4777-8777-777777777777';
const body={nev:'Teszt Elek',email:'landing@test.invalid',telefon:'06301234567',adatkezeles:true,submissionId:id};
async function configured(run){
  const values={LANDING_LEAD_SECRET:'test-only',LEAD_INBOX_URL:'https://debrecenhomes.hu/api/integrations/landing-lead',RESEND_API_KEY:'test-only',LEAD_FROM_EMAIL:'from@test.invalid',LEAD_TO_EMAIL:'to@test.invalid'};
  const before=Object.keys(values).map(key=>process.env[key]);
  Object.assign(process.env,values);
  try{await run();}finally{Object.keys(values).forEach((key,i)=>before[i]===undefined?delete process.env[key]:process.env[key]=before[i]);}
}
async function invoke(handler,data){
  const result={status:0,body:null};
  const res={setHeader(){},status(code){result.status=code;return res;},json(value){result.body=value;return res;}};
  await handler({method:'POST',headers:{'x-forwarded-for':'192.0.2.1'},body:data},res);
  return result;
}
test('Landing saves before notification, preserves source and does not notify again on retry',async()=>configured(async()=>{
  const e=environment(),inbox=e.load('app/api/integrations/landing-lead/route.ts');
  let emails=0;
  e.setFetch(async(url,options)=>{
    if(String(url).includes('/landing-lead'))return inbox.POST(new Request(url,options));
    assert.equal(String(url),'https://api.resend.com/emails');
    assert.equal(e.store.has(`inquiries/${id}`),true);
    assert.equal(options.headers['Idempotency-Key'],`website-lead-${id}`);
    emails++;return Response.json({id:'provider-id'});
  });
  const landing=e.load('outputs/homeflow-v6/landing-lead.js.txt');
  assert.equal((await invoke(landing,body)).status,200);
  assert.equal(e.store.get(`inquiries/${id}`).source,'debreceniotthonok.hu');
  assert.equal(e.store.get(`inquiries/${id}`).delivery,'sent');
  assert.equal((await invoke(landing,body)).status,200);
  assert.equal(emails,1);
  assert.equal((await invoke(landing,{...body,nev:'Más személy'})).status,503);
  assert.equal(emails,1);
}));
test('Landing reports failed saving; mail failure leaves a durably saved actionable lead',async()=>configured(async()=>{
  const e=environment(),inbox=e.load('app/api/integrations/landing-lead/route.ts');
  let unavailable=true,emails=0;
  e.setFetch(async(url,options)=>{
    if(String(url).includes('/landing-lead'))return unavailable?new Response('down',{status:503}):inbox.POST(new Request(url,options));
    emails++;return new Response('mail down',{status:503});
  });
  const landing=e.load('outputs/homeflow-v6/landing-lead.js.txt');
  assert.equal((await invoke(landing,body)).status,503);
  assert.equal(emails,0);
  assert.equal(e.store.has(`inquiries/${id}`),false);
  unavailable=false;
  assert.equal((await invoke(landing,body)).status,200);
  assert.equal(e.store.get(`inquiries/${id}`).delivery,'failed');
}));
test('Landing inbox requires its server secret and never downgrades confirmed mail',async()=>configured(async()=>{
  const e=environment(),inbox=e.load('app/api/integrations/landing-lead/route.ts');
  const data={submissionId:id,name:'Teszt Elek',email:'test@test.invalid',phone:'',emailDelivery:'sent'};
  const req=(secret,payload=data)=>new Request('https://debrecenhomes.hu/api/integrations/landing-lead',{method:'POST',headers:{'x-landing-lead-secret':secret},body:JSON.stringify(payload)});
  assert.equal((await inbox.POST(req('wrong'))).status,401);
  assert.equal((await inbox.POST(req('test-only'))).status,200);
  assert.equal((await inbox.POST(req('test-only',{...data,emailDelivery:'failed'}))).status,200);
  assert.equal(e.store.get(`inquiries/${id}`).delivery,'sent');
}));
