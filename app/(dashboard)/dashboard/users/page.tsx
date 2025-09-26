import { redirect } from 'next/navigation'
import React from 'react'

const page = () => {
  return  redirect('/dashboard/users/all-other-staff')
}

export default page
