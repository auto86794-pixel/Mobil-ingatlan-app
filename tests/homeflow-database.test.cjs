// Isolated PostgreSQL contract test; never opens a production connection.
// npm install --prefix .tmp/homeflow-validation --no-package-lock @electric-sql/pglite@0.3.14
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {PGlite}=require('../.tmp/homeflow-validation/node_modules/@electric-sql/pglite');
const {environment}=require('./helpers.cjs');

test('Atomic lead import: preservation, retries, rollback, conflicts and role restrictions',async()=>{
  const db=new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create table clients(id uuid primary key default gen_random_uuid(),first_name text not null,last_name text not null,email text,phone text,source text,notes text,status text,data_classification text,archived_at timestamptz);
      create table tasks(id uuid primary key default gen_random_uuid(),title text not null,description text,type text,status text,priority text,due_date timestamptz,client_id uuid references clients(id),phone text);
      create table timeline_events(id uuid default gen_random_uuid(),client_id uuid references clients(id),type text,title text,description text,metadata jsonb);
      create table website_lead_imports(submission_hash text primary key,status text not null check(status in ('processing','completed')),created_at timestamptz not null default now());
      alter table website_lead_imports enable row level security;
      insert into clients(first_name,last_name,email,notes) select 'Korábbi','Ügyfél '||i,'existing'||i||'@test.invalid','Megőrzendő adat '||i from generate_series(1,169) i;
    `);
    await db.exec(fs.readFileSync('outputs/homeflow-v6/website-lead-atomic.sql','utf8'));
    const original=(await db.query('select * from clients order by email')).rows;
    const hash=s=>createHash('sha256').update(s).digest('hex');
    const receive=async(id,payload)=>{
      const body={name:'Teszt Elek',email:'new@test.invalid',phone:'+36301234567',message:'Eredeti érdeklődés',propertyId:'firebase-listing',propertyTitle:'Debreceni lakás',propertyUrl:'https://debreceniotthonok.hu/post/firebase-listing',submissionId:id,receivedAt:'2026-11-06T12:00:00.000Z',...payload};
      return (await db.query('select receive_website_lead($1,$2,$3::jsonb) as result',[hash(id),hash(JSON.stringify(body)),JSON.stringify(body)])).rows[0].result;
    };
    const first=await receive('first');
    assert.equal(first.success,true);
    const retry=await receive('first');
    assert.equal(retry.duplicate,true);
    assert.equal(retry.taskId,first.taskId);
    assert.equal((await db.query('select count(*)::int as n from tasks')).rows[0].n,1);
    assert.equal((await db.query('select count(*)::int as n from timeline_events')).rows[0].n,1);
    const task=(await db.query('select * from tasks where id=$1',[first.taskId])).rows[0];
    assert.match(task.description,/Eredeti érdeklődés/);
    assert.match(task.description,/firebase-listing/);
    assert.equal(task.due_date.toISOString(),'2026-11-07T09:00:00.000Z');
    assert.equal((await db.query('select * from clients where email like \'existing%\' order by email')).rows.length,169);
    assert.deepEqual((await db.query('select * from clients where email like \'existing%\' order by email')).rows,original);
    await assert.rejects(receive('first',{message:'Más tartalom'}),/SUBMISSION_CONFLICT/);
    const existing=await receive('existing',{email:'existing1@test.invalid',phone:''});
    assert.equal(existing.clientId,original.find(c=>c.email==='existing1@test.invalid').id);
    assert.deepEqual((await db.query('select * from clients where email like \'existing%\' order by email')).rows,original);
    // Fail after inserting the client, then retry the identical submission.
    await db.exec(`create function fail_task() returns trigger language plpgsql as $$ begin raise exception 'SIMULATED_TASK_FAILURE'; end $$; create trigger fail_task before insert on tasks for each row execute function fail_task();`);
    await assert.rejects(receive('rollback',{email:'rollback@test.invalid',phone:''}),/SIMULATED_TASK_FAILURE/);
    assert.equal((await db.query("select count(*)::int as n from clients where email='rollback@test.invalid'")).rows[0].n,0);
    assert.equal((await db.query('select count(*)::int as n from website_lead_imports where submission_hash=$1',[hash('rollback')])).rows[0].n,0);
    await db.exec('drop trigger fail_task on tasks');
    assert.equal((await receive('rollback',{email:'rollback@test.invalid',phone:''})).success,true);
    await assert.rejects(receive('ambiguous',{email:'existing1@test.invalid'}),/CONTACT_REVIEW/);
    await db.exec("insert into clients(first_name,last_name,email,archived_at) values('Régi','Ügyfél','archived@test.invalid',now())");
    await assert.rejects(receive('archived',{email:'archived@test.invalid',phone:''}),/CONTACT_REVIEW/);
    await db.query("insert into website_lead_imports(submission_hash,status) values($1,'processing')",[hash('legacy')]);
    await assert.rejects(receive('legacy'),/LEGACY_PROCESSING/);
    for(const role of ['anon','authenticated']) {
      assert.equal((await db.query("select has_function_privilege($1,'receive_website_lead(text,text,jsonb)','execute') as allowed",[role])).rows[0].allowed,false);
    }
    assert.equal((await db.query("select has_function_privilege('service_role','receive_website_lead(text,text,jsonb)','execute') as allowed")).rows[0].allowed,true);
    // Walk sender -> real receiver -> local SQL -> acknowledgement. Lose the
    // first acknowledgement after COMMIT, then retry through the admin route.
    const keys=['HOMEFLOW_CRM_URL','HOMEFLOW_LEAD_SECRET','WEBSITE_LEAD_SECRET'];
    const before=keys.map(key=>process.env[key]);
    process.env.HOMEFLOW_CRM_URL='https://crm.test.invalid';
    process.env.HOMEFLOW_LEAD_SECRET=process.env.WEBSITE_LEAD_SECRET='isolated-test-secret';
    try {
      const e=environment({
        '@/lib/supabase/admin':{createAdminClient:()=>({rpc:async(name,args)=>{
          assert.equal(name,'receive_website_lead');
          try {
            const result=await db.query('select receive_website_lead($1,$2,$3::jsonb) as result',[args.p_hash,args.p_fingerprint,JSON.stringify(args.p_payload)]);
            return {data:result.rows[0].result,error:null};
          } catch(error) {return {data:null,error:{code:error.code,message:error.message}};}
        }})},
        '@/lib/contact-normalization':{normalizePhone:()=>null},
      });
      const id='66666666-6666-4666-8666-666666666666';
      e.store.set(`inquiries/${id}`,{name:'Hálózati Teszt',email:'network@test.invalid',message:'Megmaradó érdeklődés',createdAt:'2026-11-06T12:00:00.000Z'});
      const receiver=e.load('outputs/homeflow-v6/website-lead-route.ts.txt');
      let attempts=0;
      e.setFetch(async(url,options)=>{
        const response=await receiver.POST(new Request(url,options));
        assert.equal(response.status,200);
        if(++attempts===1) throw new Error('SIMULATED_LOST_ACK_AFTER_COMMIT');
        return response;
      });
      const baseline=(await db.query('select count(*)::int as n from tasks')).rows[0].n;
      const {deliverToHomeFlow}=e.load('app/lib/homeflowDelivery.ts');
      await deliverToHomeFlow(e.db.doc(`inquiries/${id}`));
      assert.equal(e.store.get(`inquiries/${id}`).crmDelivery,'failed');
      assert.equal((await db.query('select count(*)::int as n from tasks')).rows[0].n,baseline+1);
      const admin=e.load('app/api/admin/inquiries/crm/route.ts');
      const retried=await admin.POST(e.request('admin',{id}));
      assert.equal((await retried.json()).crmDelivery,'sent');
      assert.equal((await db.query('select count(*)::int as n from tasks')).rows[0].n,baseline+1);
      assert.equal((await db.query("select count(*)::int as n from clients where email='network@test.invalid'")).rows[0].n,1);
      const receipt=(await db.query("select payload from website_lead_imports where payload->>'email'='network@test.invalid'")).rows[0].payload;
      assert.equal(receipt.source,'debrecenhomes.hu');
      assert.equal(receipt.message,'Megmaradó érdeklődés');
      assert.deepEqual((await db.query('select * from clients where email like \'existing%\' order by email')).rows,original);
    } finally {
      keys.forEach((key,i)=>before[i]===undefined?delete process.env[key]:process.env[key]=before[i]);
    }
  } finally {await db.close();}
});
