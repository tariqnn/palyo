import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(){
  try{
    await query("SELECT 1 FROM users LIMIT 1");
    return Response.json({status:"ok",database:"ok",checkedAt:new Date().toISOString()},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    console.error(JSON.stringify({event:"health_check_failed",message:error instanceof Error?error.message:"Unknown database error",at:new Date().toISOString()}));
    return Response.json({status:"unavailable",database:"error",checkedAt:new Date().toISOString()},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
