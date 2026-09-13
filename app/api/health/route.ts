import {NextResponse} from 'next/server'; import {sql} from '@/lib/server';
export async function GET(){try{const r=await sql('select now() as server_time');return NextResponse.json({ok:true,database:true,server_time:r[0]?.server_time})}catch(e:any){return NextResponse.json({ok:false,database:false,error:e.message},{status:500})}}
