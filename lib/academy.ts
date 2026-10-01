import "server-only";
import { redirect } from "next/navigation";
import { currentUser } from "./auth";
import { one } from "./db";
export type AcademyAccess={userId:string;academyId:string;role:string;permissions:string[]};
export async function requireAcademyAccess():Promise<AcademyAccess>{const user=await currentUser();if(!user)redirect("/login?next=/academy");const row=await one<{academy_id:string|null;permissions:string[]}>("SELECT academy_id,permissions FROM users WHERE id=$1",[user.id]);if(!row?.academy_id)redirect("/settings?error=Academy%20access%20is%20not%20assigned");return {userId:user.id,academyId:row.academy_id,role:user.role,permissions:row.permissions||[]};}
