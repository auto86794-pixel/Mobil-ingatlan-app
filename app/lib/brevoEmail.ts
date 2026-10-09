export async function sendBrevoPayload(apiKey: string, payload: Record<string, unknown>) {
 const response = await fetch("https://api.brevo.com/v3/smtp/email", {
  method:"POST", headers:{accept:"application/json","content-type":"application/json","api-key":apiKey},
  body:JSON.stringify(payload), signal:AbortSignal.timeout(15000),
 });
 if(!response.ok) throw new Error(`BREVO_SEND_FAILED_${response.status}`);
 const text=await response.text();
 if(!text)return null;
 try{return JSON.parse(text);}catch{return null;}
}
