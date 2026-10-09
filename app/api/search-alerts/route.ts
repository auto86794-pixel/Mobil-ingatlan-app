import { NextResponse } from "next/server";
import { handleContact } from "@/app/lib/contactHandler";
import { cleanSearchCriteria, searchCriteriaMessage } from "@/app/lib/searchCriteria";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 20000) return NextResponse.json({error:"A kérés túl nagy."},{status:413});
    const body = await request.json();
    if (body?.consent !== true) return NextResponse.json({error:"Hozzájárulás szükséges."},{status:400});
    const criteria = cleanSearchCriteria(body.criteria);
    const headers = new Headers(request.headers);
    headers.delete("content-length");
    return handleContact(new Request(request.url, {method:"POST", headers, body:JSON.stringify({email:body.email, name:"Ingatlant kereső", phone:"", message:searchCriteriaMessage(criteria), propertyTitle:"Ingatlankeresési igény", criteria, website:body.website})}), true);
  } catch (error) {
    return NextResponse.json({error:error instanceof Error ? error.message : "Érvénytelen kérés."},{status:400});
  }
}
