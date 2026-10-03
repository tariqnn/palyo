import pg from "pg";

const connectionString=process.env.DATABASE_URL_UNPOOLED||process.env.POSTGRES_URL_NON_POOLING||process.env.DATABASE_URL;
if(!connectionString)throw new Error("Production database configuration is unavailable.");
const db=new pg.Client({connectionString,ssl:{rejectUnauthorized:false}});
await db.connect();
try{
 const result=await db.query(`SELECT
  (SELECT count(*) FROM users)::int AS total_users,
  (SELECT count(*) FROM venues)::int AS venues,
  (SELECT count(*) FROM venues WHERE demo=TRUE)::int AS demo_venues,
  (SELECT count(*) FROM games WHERE starts_at>now())::int AS future_games,
  (SELECT count(*) FROM users WHERE email NOT LIKE '%@playup.local' AND email NOT LIKE '%@playo.local')::int AS real_accounts`);
 console.log(JSON.stringify({
  database:"ok",
  environment:process.env.VERCEL_ENV||"local",
  ...result.rows[0],
  resetEmailConfigured:Boolean((process.env.RESEND_API_KEY&&process.env.EMAIL_FROM)||(process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASSWORD&&process.env.SMTP_FROM)),
  supportEmailConfigured:Boolean(process.env.NEXT_PUBLIC_SUPPORT_EMAIL),
  legalOperatorConfigured:Boolean(process.env.NEXT_PUBLIC_OPERATOR_NAME&&process.env.NEXT_PUBLIC_OPERATOR_ADDRESS)
 },null,2));
}finally{await db.end();}
