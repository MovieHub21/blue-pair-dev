import Nav from './Nav'
export default function Shell({children}:{children:React.ReactNode}){return <div className="min-h-screen flex"><Nav/><main className="flex-1 min-w-0"><div className="max-w-[1500px] mx-auto p-5 md:p-8">{children}</div></main></div>}
