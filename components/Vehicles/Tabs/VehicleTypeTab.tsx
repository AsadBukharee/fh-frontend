import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Trash2, Edit, Plus } from 'lucide-react'
import { toast } from 'sonner' // Assuming sonner for notifications, or replace with your preferred toast library
import API_URL from '@/app/utils/ENV'
import { useCookies } from 'next-client-cookies'

const API_BASE =API_URL

interface VehicleType {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
}

const VehicleTypeTab = () => {
  const [data, setData] = useState<VehicleType[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [editId, setEditId] = useState<number | null>(null)
  const cookies=useCookies();

  const resetForm = () => {
    setFormData({ name: '', description: '' })
    setEditId(null)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/vehicle-types/`,{
      headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch')
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      toast.error('Failed to fetch vehicle types')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!isAddOpen) {
      resetForm()
    }
  }, [isAddOpen])

  useEffect(() => {
    if (!isEditOpen) {
      resetForm()
    }
  }, [isEditOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return toast.error('Name is required')

    const method = editId ? 'PUT' : 'POST'
    const url = editId ? `${API_BASE}/api/vehicle-types/${editId}` : `${API_BASE}/api/vehicle-types/`

    try {
      const response = await fetch(url, {
        method,
         headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ name: formData.name, description: formData.description }),
      })
      if (!response.ok) throw new Error('Failed to save')
      toast.success('Vehicle type saved successfully')
      setIsAddOpen(false)
      setIsEditOpen(false)
      fetchData()
    } catch (error) {
      toast.error('Failed to save vehicle type')
    }
  }

  const handleEdit = (item: VehicleType) => {
    setFormData({ name: item.name, description: item.description })
    setEditId(item.id)
    setIsEditOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const response = await fetch(`${API_BASE}/api/vehicle-types/${deleteId}`, {
        method: 'DELETE',
         headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Vehicle type deleted successfully')
      setDeleteId(null)
      fetchData()
    } catch (error) {
      toast.error('Failed to delete vehicle type')
    }
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vehicle Types</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Vehicle Type</DialogTitle>
              <DialogDescription>
                Enter the name and description for the new vehicle type.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 8-Seater"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Eight Seater"
                />
              </div>
              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(item)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog open={deleteId === item.id} onOpenChange={() => setDeleteId(null)}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {item.name}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vehicle Type</DialogTitle>
            <DialogDescription>
              Update the name and description.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 8-Seater"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Eight Seater"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Update</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default VehicleTypeTab