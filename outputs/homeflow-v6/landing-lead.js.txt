const {randomUUID}=require('node:crypto');
module.exports = async function handler(req, res) {
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Nem támogatott kérés.'});}
  const {nev,email,telefon,adatkezeles,website,submissionId}=req.body||{};
  if(website)return res.status(200).json({ok:true});
  if(typeof nev!=='string'||nev.trim().length<2||nev.length>100||typeof email!=='string'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||(telefon!=null&&(typeof telefon!=='string'||telefon.length>40))||adatkezeles!==true)
    return res.status(400).json({error:'Ellenőrizd a megadott adatokat és az adatkezelési hozzájárulást.'});
  if(submissionId!=null&&(typeof submissionId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId)))
    return res.status(400).json({error:'Érvénytelen beküldés.'});
  const id=submissionId||randomUUID();
  const {RESEND_API_KEY,LEAD_TO_EMAIL,LEAD_FROM_EMAIL,LEAD_INBOX_URL,LANDING_LEAD_SECRET}=process.env;
  if(!LEAD_INBOX_URL||!LANDING_LEAD_SECRET)return res.status(503).json({error:'A kapcsolatfelvétel átmenetileg nem elérhető. Kérjük, próbáld később.'});
  const payload={submissionId:id,name:nev.trim(),email:email.trim().toLowerCase(),phone:(telefon||'').trim(),ip:(req.headers['x-forwarded-for']||'unknown').split(',')[0].trim()};
  const save=async(emailDelivery)=>{
    const url=new URL(LEAD_INBOX_URL);
    if(url.protocol!=='https:'||url.username||url.password)throw Error('Invalid inbox');
    const response=await fetch(url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json','x-landing-lead-secret':LANDING_LEAD_SECRET},body:JSON.stringify({...payload,emailDelivery})});
    if(!response.ok)throw Error('Inbox unavailable');
    const result=await response.json();
    if(result.success!==true)throw Error('Inbox unavailable');
    return result;
  };
  // Accept only after the lead is durably available in the admin inbox.
  // The same ID survives browser retries and a lost response after COMMIT.
  try{if((await save('pending')).notificationSent)return res.status(200).json({ok:true});}catch{return res.status(503).json({error:'A mentés most nem sikerült. Az adataid megmaradtak az űrlapon; kérjük, próbáld újra.'});}
  let delivery='failed';
  if(RESEND_API_KEY&&LEAD_TO_EMAIL&&LEAD_FROM_EMAIL){
    try{
      const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`website-lead-${id}`},body:JSON.stringify({from:LEAD_FROM_EMAIL,to:[LEAD_TO_EMAIL],subject:'Új érdeklődő – Lakáskeresés fiataloknak',text:`Név: ${payload.name}\nE-mail: ${payload.email}\nTelefon: ${payload.phone}\nAdatkezelési hozzájárulás: igen`,reply_to:payload.email})});
      if(response.ok)delivery='sent';
    }catch{/* The durably saved lead remains actionable even if e-mail fails. */}
  }
  await save(delivery).catch(()=>console.error('LANDING_NOTIFICATION_STATE_PENDING'));
  return res.status(200).json({ok:true});
};
