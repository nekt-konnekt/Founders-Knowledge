import pg from "pg";
const { Pool } = pg; let pool;
function db(){if(!process.env.DATABASE_URL)throw Error("Database unavailable");if(!pool)pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:3,connectionTimeoutMillis:5000});return pool;}
function authorized(req){const expected=process.env.FK_REVIEW_TOKEN;return !!expected && req.headers.authorization==="Bearer "+expected;}
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(!authorized(req))return res.status(401).json({error:"Unauthorized"});
 try{
  if(req.method==="GET"){
   const status=String(req.query?.status||"").trim(), q=String(req.query?.q||"").trim().slice(0,120);
   const args=[], where=[];
   if(status){args.push(status);where.push("review_status=$"+args.length);}
   if(q){args.push("%"+q+"%");where.push("(product_name ILIKE $"+args.length+" OR founder_name ILIKE $"+args.length+" OR contact_email ILIKE $"+args.length+" OR location ILIKE $"+args.length+")");}
   const result=await db().query("SELECT id,product_name,founder_name,contact_email,product_website,category,product_stage,location,description,problem_solved,target_users,demo_url,founder_linkedin,review_status,review_notes,notion_sync_status,created_at,updated_at FROM fk_product_submissions "+(where.length?"WHERE "+where.join(" AND "):"")+" ORDER BY created_at DESC LIMIT 200",args);
   return res.status(200).json({items:result.rows});
  }
  if(req.method==="PATCH"){
   const b=req.body&&typeof req.body==="object"?req.body:{}, id=Number(b.id), status=String(b.status||""), notes=String(b.notes||"").slice(0,10000);
   if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:"A valid submission id is required."});
   if(!["New","Reviewing","Needs information","Approved","Published","Declined"].includes(status))return res.status(400).json({error:"Invalid review status."});
   const result=await db().query("UPDATE fk_product_submissions SET review_status=$2,review_notes=$3,updated_at=NOW() WHERE id=$1 RETURNING id,review_status,review_notes,updated_at",[id,status,notes]);
   if(!result.rowCount)return res.status(404).json({error:"Submission not found."});
   return res.status(200).json({item:result.rows[0]});
  }
  res.setHeader("Allow","GET, PATCH");return res.status(405).json({error:"Method not allowed."});
 }catch(e){console.error("Review queue error:",e.message);return res.status(503).json({error:"Review queue temporarily unavailable."});}
}