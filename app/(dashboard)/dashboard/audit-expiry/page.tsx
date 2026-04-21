import { redirect } from 'next/navigation'
import React from 'react'

const page = () => {
    return redirect('/dashboard/audit-expiry/vehicles')
}

export default page
