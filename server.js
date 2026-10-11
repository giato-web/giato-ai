import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
const app=express(), root=path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({limit:"1mb"}));
app.use(express.static(path.join(root,"public")));
app.get("/api/health",(_,res)=>res.json({ok:true,app:"Giato AI"}));
app.post("/api/chat",async(req,res)=>{
 try{
  const input=req.body?.messages;
  if(!Array.isArray(input)||!input.length||input.length>40)return res.status(400).json({error:"الرسائل غير صالحة."});
  const messages=input.filter(m=>m&&["user","assistant"].includes(m.role)&&typeof m.content==="string").map(m=>({role:m.role,content:m.content.slice(0,12000)}));
  const base=(process.env.AI_BASE_URL||"http://127.0.0.1:11434/v1").replace(/\/+$/,"");
  const key=process.env.AI_API_KEY||"ollama", model=process.env.AI_MODEL||"gemma4:e2b";
  const r=await fetch(base+"/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},body:JSON.stringify({model,messages:[{role:"system",content:"أنت Giato AI، مساعد مفيد وواضح. أجب بلغة المستخدم وكن صريحًا عندما لا تعرف."},...messages],temperature:0.7})});
  if(!r.ok){console.error("AI provider status",r.status,(await r.text().catch(()=>"")).slice(0,300));return res.status(502).json({error:"تعذر الاتصال بمزود الذكاء الاصطناعي. تحقق من إعدادات الخدمة."});}
  const data=await r.json(), reply=data.choices?.[0]?.message?.content;
  if(!reply)return res.status(502).json({error:"لم يصل رد من النموذج."});
  res.json({reply});
 }catch(e){console.error(e);res.status(503).json({error:"خدمة الذكاء الاصطناعي غير متاحة. تحقق من إعدادات الخادم."});}
});
const port=Number(process.env.PORT||3000);
app.listen(port,"0.0.0.0",()=>console.log("Giato AI running on port "+port));