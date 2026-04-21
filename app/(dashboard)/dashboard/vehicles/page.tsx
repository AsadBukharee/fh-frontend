import { redirect } from 'next/navigation'
import React from 'react'

const page = () => {
  return redirect('/dashboard/vehicles/list')
}

export default page
