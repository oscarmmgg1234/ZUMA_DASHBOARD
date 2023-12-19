
import {useSession} from 'next-auth/react'
import Dashboard from '@/components/dashboard'


export default function Home() {
  // const { data: session, status } = useSession()
  return (
    <>
{/* create custom sign in page since we got authentication in ==> thought process is to conditianally render app or login page */}
    {/* {session ? <Dashboard /> : <Login/>} */}
    <Dashboard />
    </>
  )
}
