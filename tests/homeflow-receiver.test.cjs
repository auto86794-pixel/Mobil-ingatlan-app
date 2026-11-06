const {test}=require('node:test');
const assert=require('node:assert/strict');
const {environment}=require('./helpers.cjs');
const routePath='outputs/homeflow-v6/website-lead-route.ts.txt';
const lead={submissionId:'search-abc123',name:'Teszt Elek',email:'ELEK@test.invalid',phone:'06301234567',message:'Érdekel az ingatlan',propertyId:'firebase-id'};
function setup(rpc) {
  return environment({
    '@/lib/supabase/admin':{createAdminClient:()=>({rpc})},
    '@/lib/contact-normalization':{normalizePhone:value=>value ? value.replace(/^06/,'+36') : null},
  }).load(routePath);
}
async function configured(run) {
  const before=process.env.WEBSITE_LEAD_SECRET;
  process.env.WEBSITE_LEAD_SECRET='receiver-test';
  try {await run();} finally {if(before===undefined) delete process.env.WEBSITE_LEAD_SECRET; else process.env.WEBSITE_LEAD_SECRET=before;}
}
const request=(body,secret='receiver-test')=>new Request('https://crm.test.invalid/api/website-lead',{method:'POST',headers:{'x-website-lead-secret':secret},body:JSON.stringify(body)});
test('Receiver fails closed before touching the database and rejects malformed input',async()=>configured(async()=>{
  let calls=0;
  const route=setup(async()=>{calls++;throw Error('must not run');});
  assert.equal((await route.POST(request(lead,'wrong'))).status,401);
  assert.equal((await route.POST(request(null))).status,400);
  assert.equal((await route.POST(request({...lead,email:'bad'}))).status,400);
  assert.equal((await route.POST(request({...lead,source:'foreign.invalid'}))).status,400);
  assert.equal((await route.POST(request({...lead,message:'x'.repeat(21000)}))).status,413);
  assert.equal(calls,0);
}));
test('Receiver sends all inquiry details to the atomic operation with stable fingerprint',async()=>configured(async()=>{
  const calls=[];
  const route=setup(async(name,args)=>{calls.push({name,args});return {data:{success:true,clientId:'client',taskId:'task'},error:null};});
  for(let i=0;i<2;i++) assert.equal((await route.POST(request(lead))).status,200);
  assert.equal(calls[0].name,'receive_website_lead');
  assert.deepEqual(calls[0],calls[1]);
  assert.equal(calls[0].args.p_payload.email,'elek@test.invalid');
  assert.equal(calls[0].args.p_payload.phone,'+36301234567');
  assert.equal(calls[0].args.p_payload.message,lead.message);
  assert.equal(calls[0].args.p_payload.propertyId,'firebase-id');
  assert.match(calls[0].args.p_hash,/^[a-f0-9]{64}$/);
}));
test('Ambiguous and legacy imports require review; database failures never acknowledge success',async()=>configured(async()=>{
  for(const message of ['CONTACT_REVIEW','LEGACY_PROCESSING','SUBMISSION_CONFLICT']) {
    const route=setup(async()=>({data:null,error:{code:'P0001',message}}));
    assert.equal((await route.POST(request(lead))).status,409);
  }
  const route=setup(async()=>({data:null,error:{code:'08006',message:'connection unavailable'}}));
  assert.equal((await route.POST(request(lead))).status,503);
}));
