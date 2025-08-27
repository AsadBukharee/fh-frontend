"use client"

import {  users } from "@/app/lib/data"
import { NotificationsDropdown } from "./header/NotificationsDropdown"
import { SearchBar } from "./header/SearchBar"
// import { MessageDialog } from "./header/MessageDialog"
import { UserProfileDropdown } from "./header/UserProfileDropdown"
import { Breadcrumbs } from "./header/Breadcrumbs"
import StateDialog from "./header/StateDialog"



export function Header() {

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <SearchBar />
        </div>
        <div className="flex items-center space-x-4">
          <StateDialog />
          <NotificationsDropdown  />
          {/* <MessageDialog users={users} /> */}
          <UserProfileDropdown />
        </div>
      </div>
      <Breadcrumbs  />
    </header>
  )
}