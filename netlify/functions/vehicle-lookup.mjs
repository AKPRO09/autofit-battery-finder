
import fitments from "../../data/fitments.json" with { type: "json" };

const DEMO={
  MH04AB1234:{make:"TATA",model:"NEXON",year:2021,fuel:"PETROL",source:"demo"},
  MH12XY5678:{make:"TATA",model:"TIAGO",year:2020,fuel:"PETROL",source:"demo"}
};
const norm=v=>String(v||"").trim().toUpperCase();

function matchFitment(v){
  return fitments.find(f=>
    norm(f.make)===norm(v.make) &&
    (f.model_keywords||[]).some(k=>norm(v.model).includes(norm(k))) &&
    (!f.fuel || norm(f.fuel)===norm(v.fuel)) &&
    (!f.year_from || Number(v.year)>=f.year_from) &&
    (!f.year_to || Number(v.year)<=f.year_to)
  ) || null;
}

async function liveLookup(registration){
  const url=process.env.VEHICLE_API_URL;
  const key=process.env.VEHICLE_API_KEY;
  if(!url || !key) return null;

  const response=await fetch(url,{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
    body:JSON.stringify({registration_number:registration})
  });
  if(!response.ok) throw new Error("Live vehicle provider returned an error.");
  const raw=await response.json();

  // Adjust these field names once the authorized provider is selected.
  return {
    registration,
    make:raw.make||raw.maker||raw.vehicle_make||"",
    model:raw.model||raw.vehicle_model||"",
    year:Number(raw.manufacturing_year||raw.year||raw.registration_year||0),
    fuel:raw.fuel||raw.fuel_type||"",
    variant:raw.variant||"",
    source:"live"
  };
}

export default async(req)=>{
  if(req.method!=="POST") return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:{"Content-Type":"application/json"}});
  try{
    const body=await req.json();
    const registration=norm(body.registration).replace(/[^A-Z0-9]/g,"");
    if(!registration) return new Response(JSON.stringify({error:"Please enter a vehicle number."}),{status:400,headers:{"Content-Type":"application/json"}});

    let vehicle=null, liveError="";
    try{vehicle=await liveLookup(registration)}catch(e){liveError=e.message}
    if(!vehicle && DEMO[registration]) vehicle={registration,...DEMO[registration]};

    if(!vehicle) return new Response(JSON.stringify({
      error:"Vehicle details could not be found.",
      hint:liveError||"Connect an authorized vehicle-data API in Netlify environment variables."
    }),{status:404,headers:{"Content-Type":"application/json"}});

    return new Response(JSON.stringify({
      vehicle,
      fitment:matchFitment(vehicle),
      status:"OK"
    }),{headers:{"Content-Type":"application/json"}});
  }catch(e){
    return new Response(JSON.stringify({error:e.message||"Invalid request."}),{status:400,headers:{"Content-Type":"application/json"}});
  }
};
