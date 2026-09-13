import {NextResponse} from 'next/server'; import {cookies} from 'next/headers';
export async function GET(){const n=process.env.DEV_CONTROL_COOKIE||'bp_dev_control';return NextResponse.json({authenticated:!!cookies().get(n)?.value})}
