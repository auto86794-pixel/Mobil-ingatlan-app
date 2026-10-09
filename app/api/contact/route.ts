import { handleContact } from "@/app/lib/contactHandler";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) { return handleContact(request); }
