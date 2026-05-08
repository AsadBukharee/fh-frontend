import { redirect } from 'next/navigation'
import React from 'react'

const page = () => {
  return redirect('/dashboard/vehicles/walkaround/all')
}

export default page
