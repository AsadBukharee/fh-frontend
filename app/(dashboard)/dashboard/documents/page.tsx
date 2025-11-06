'use client';

import { useState, useEffect } from 'react';
import { useCookies } from 'next-client-cookies';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Plus } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-api.com';

type Document = {
  id: number;
  name: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type ApiResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Document[];
};

export default function DocumentPage() {
  const cookies = useCookies();
  const token = cookies.get('access_token');

  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // ----- CREATE -----
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');

  // ----- UPDATE -----
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  // ----- FETCH -----
  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/profiles/document-name/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data: ApiResponse = await res.json();
      setDocs(data.results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDocs();
  }, [token]);

  // ----- CREATE -----
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/profiles/document-name/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (res.ok) {
        setNewName('');
        setCreateOpen(false);
        fetchDocs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ----- UPDATE -----
  const openEdit = (doc: Document) => {
    setEditId(doc.id);
    setEditName(doc.name);
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/profiles/document-name/${editId}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (res.ok) {
        setEditOpen(false);
        setEditId(null);
        setEditName('');
        fetchDocs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ----- DELETE -----
  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API_URL}/api/profiles/document-name/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDocs();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Document Names</CardTitle>

          {/* CREATE DIALOG */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Document</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    placeholder="Enter document name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.id}</TableCell>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>{format(new Date(doc.created_at), 'PPP')}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {/* EDIT */}
                      <Button size="sm" variant="ghost" onClick={() => openEdit(doc)}>
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* DELETE */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete document?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove “{doc.name}”.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(doc.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                placeholder="Enter document name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}