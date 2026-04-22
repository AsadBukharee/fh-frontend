'use client'

import { Plus, Search, Download, Bell, Package, DollarSign, TrendingUp, AlertTriangle, Trash2, Edit, Calendar, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';
import { useCookies } from 'next-client-cookies';

interface StockItem {
  id: string;
  itemName: string;
  location: string;
  quantity: number;
  costPerItem: number;
  totalCost: number;
  incVat: boolean;
  supplier: string;
  purchaseDate: string;
  invoiceNumber: string;
  costCenter: string;
  subsection?: string;
}

interface StockList {
  id: string;
  name: string;
  creator: string;
  createdAt: string;
  updatedAt: string;
  items: StockItem[];
  subsections: string[];
}

interface LowStockAlert {
  id: string;
  itemId: string;
  itemName: string;
  location: string;
  currentQuantity: number;
  status: 'active' | 'ordered' | 'snoozed';
  taskDate?: string;
}

export default function StockListPage() {
  const cookies = useCookies();
  const role = cookies.get('role');

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [isAlertActionDialogOpen, setIsAlertActionDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<LowStockAlert | null>(null);
  const [taskDays, setTaskDays] = useState('7');
  const [lowStockThreshold, setLowStockThreshold] = useState(2);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const [stockLists, setStockLists] = useState<StockList[]>([
    {
      id: '1',
      name: 'Main Workshop Stock',
      creator: 'John Doe',
      createdAt: '2025-10-15',
      updatedAt: '2025-11-19',
      subsections: ['Brakes', 'Suspension', 'Tyres'],
      items: [
        { id: '1', itemName: 'Ball Joint', location: 'Front', quantity: 10, costPerItem: 24.00, totalCost: 240.00, incVat: true, supplier: 'Eurocarparts', purchaseDate: '2025-11-01', invoiceNumber: 'INV-2025-1101', costCenter: 'Workshop A', subsection: 'Suspension' },
        { id: '2', itemName: 'Ball Joint', location: 'Rear', quantity: 2, costPerItem: 17.33, totalCost: 34.66, incVat: false, supplier: 'EMF', purchaseDate: '2025-10-20', invoiceNumber: 'INV-2025-0987', costCenter: 'Workshop B', subsection: 'Suspension' },
        { id: '3', itemName: 'Pedal Rubber', location: 'Brake & Clutch', quantity: 5, costPerItem: 6.00, totalCost: 30.00, incVat: false, supplier: 'Ebay', purchaseDate: '2025-11-10', invoiceNumber: 'EBAY-887766', costCenter: 'Workshop A' },
        { id: '4', itemName: 'Tyre', location: 'Front & Rear', quantity: 1, costPerItem: 72.00, totalCost: 72.00, incVat: true, supplier: 'Tyrewise', purchaseDate: '2025-11-15', invoiceNumber: 'TW-4455', costCenter: 'Workshop A', subsection: 'Tyres' },
      ]
    }
  ]);

  const [selectedListId, setSelectedListId] = useState('1');
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);

  const [newItem, setNewItem] = useState({
    itemName: '',
    location: '',
    quantity: 1,
    totalCost: 0,
    costPerItem: 0,
    incVat: true,
    supplier: '',
    purchaseDate: today,
    invoiceNumber: '',
    costCenter: '',
    subsection: 'No'
  });

  const currentList = stockLists.find(l => l.id === selectedListId) || stockLists[0];

  // === REAL-TIME CALCULATION FOR ADD ITEM ===
  useEffect(() => {
    if (newItem.quantity > 0 && newItem.totalCost > 0) {
      setNewItem(prev => ({ ...prev, costPerItem: prev.totalCost / prev.quantity }));
    }
  }, [newItem.quantity, newItem.totalCost]);

  // === REAL-TIME CALCULATION FOR EDIT ITEM ===
  useEffect(() => {
    if (editingItem && editingItem.quantity > 0 && editingItem.totalCost > 0) {
      setEditingItem(prev => prev ? { ...prev, costPerItem: prev.totalCost / prev.quantity } : null);
    }
  }, [editingItem?.quantity, editingItem?.totalCost]);

  // Calculations
  const totalItems = currentList.items.reduce((s, i) => s + i.quantity, 0);
  const totalValue = currentList.items.reduce((s, i) => s + i.quantity * i.costPerItem, 0);
  const totalPurchaseCost = currentList.items.reduce((s, i) => s + i.totalCost, 0);
  const lowStockItems = currentList.items.filter(i => i.quantity <= lowStockThreshold);

  const filteredItems = currentList.items.filter(item =>
    [item.itemName, item.location, item.supplier, item.invoiceNumber, item.costCenter]
      .some(f => f?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddItem = () => {
    if (!newItem.itemName || newItem.quantity < 1 || newItem.totalCost <= 0) return;

    const item: StockItem = {
      id: Date.now().toString(),
      ...newItem,
      costPerItem: newItem.totalCost / newItem.quantity,
      subsection: newItem.subsection !== 'No' ? newItem.subsection : undefined
    };

    setStockLists(prev => prev.map(list =>
      list.id === currentList.id
        ? { ...list, items: [...list.items, item], updatedAt: today }
        : list
    ));

    setNewItem({ ...newItem, itemName: '', quantity: 1, totalCost: 0, costPerItem: 0, supplier: '', invoiceNumber: '', costCenter: '' });
    setIsAddItemDialogOpen(false);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;

    const updatedItem = {
      ...editingItem,
      costPerItem: editingItem.totalCost / editingItem.quantity
    };

    setStockLists(prev => prev.map(list =>
      list.id === currentList.id
        ? { ...list, items: list.items.map(i => i.id === editingItem.id ? updatedItem : i), updatedAt: today }
        : list
    ));

    setEditingItem(null);
    setIsEditItemDialogOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    setStockLists(prev => prev.map(list =>
      list.id === currentList.id
        ? { ...list, items: list.items.filter(i => i.id !== id), updatedAt: today }
        : list
    ));
  };

  const handleMarkAsOrdered = () => {
    if (!selectedAlert) return;
    setAlerts(prev => prev.map(a => a.id === selectedAlert.id ? { ...a, status: 'ordered' as const } : a));
    setIsAlertActionDialogOpen(false);
    setSelectedAlert(null);
  };

  const handleCreateTask = () => {
    if (!selectedAlert) return;
    const date = new Date();
    date.setDate(date.getDate() + parseInt(taskDays));
    setAlerts(prev => prev.map(a =>
      a.id === selectedAlert.id ? { ...a, status: 'snoozed' as const, taskDate: date.toISOString().split('T')[0] } : a
    ));
    setIsAlertActionDialogOpen(false);
    setSelectedAlert(null);
  };

  return (
    <>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stock Manager</h1>
            {/* <p className="text-muted-foreground">Real-time cost calculation • Total cost → cost per item instantly</p> */}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />New List</Button>
          </div>
        </div>

        {stockLists.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {stockLists.map(l => (
              <Button key={l.id} variant={selectedListId === l.id ? "default" : "outline"} onClick={() => setSelectedListId(l.id)}>
                {l.name}
              </Button>
            ))}
          </div>
        )}

        {/* Low Stock Tasks */}
        {lowStockItems.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <AlertDescription>
              <p className="font-semibold text-orange-900 mb-3">Low Stock Tasks ({lowStockItems.length})</p>
              <div className="space-y-2">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center  bg-orange-50 border-orange-500 p-3 rounded border">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">{item.itemName}</span>
                      <span className="text-muted-foreground">({item.location})</span>
                      <Badge variant="destructive">Only {item.quantity}</Badge>
                    </div>
                    <Button size="sm" onClick={() => { setSelectedAlert({ id: item.id, itemId: item.id, itemName: item.itemName, location: item.location, currentQuantity: item.quantity, status: 'active' }); setIsAlertActionDialogOpen(true); }}>
                      Action
                    </Button>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Total Units</CardTitle><Package className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalItems}</div></CardContent></Card>
          {role === 'superadmin' && (
            <>
              <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Current Value</CardTitle><DollarSign className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">£{totalValue.toFixed(2)}</div></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Total Paid</CardTitle><DollarSign className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">£{totalPurchaseCost.toFixed(2)}</div></CardContent></Card>
            </>
          )}
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Unique Items</CardTitle><TrendingUp className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{currentList.items.length}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Low Stock</CardTitle><AlertTriangle className="h-4 w-4 text-orange-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div></CardContent></Card>
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{currentList.name}</CardTitle>
                <CardDescription>Updated {currentList.updatedAt}</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 w-64" />
                </div>
                <Button onClick={() => setIsAddItemDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Item</th>
                    <th className="text-left p-3">Location</th>
                    <th className="text-center p-3">Qty</th>
                    {role === 'superadmin' && (
                      <>
                        <th className="text-right p-3">Cost/Item</th>
                        <th className="text-right p-3">Total Paid</th>
                        <th className="text-left p-3">VAT</th>
                        <th className="text-right p-3">Current Value</th>
                      </>
                    )}
                    <th className="text-left p-3">Supplier</th>
                    <th className="text-left p-3">Invoice</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Cost Center</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const low = item.quantity <= lowStockThreshold;
                    return (
                      <tr key={item.id} className={`border-b ${low ? 'bg-orange-50' : 'hover:bg-muted/50'}`}>
                        <td className="p-3 font-medium">{item.itemName} {low && <Bell className="inline h-4 w-4 text-orange-600 ml-1" />}</td>
                        <td className="p-3">{item.location}</td>
                        <td className="p-3 text-center"><Badge variant={low ? "destructive" : "secondary"}>{item.quantity}</Badge></td>
                        {role === 'superadmin' && (
                          <>
                            <td className="p-3 text-right">£{item.costPerItem.toFixed(2)}</td>
                            <td className="p-3 text-right font-medium">£{item.totalCost.toFixed(2)}</td>
                            <td className="p-3 text-center"><Badge variant={item.incVat ? "default" : "outline"}>{item.incVat ? "Yes" : "No"}</Badge></td>
                            <td className="p-3 text-right font-semibold">£{(item.quantity * item.costPerItem).toFixed(2)}</td>
                          </>
                        )}
                        <td className="p-3">{item.supplier}</td>
                        <td className="p-3 text-xs font-mono">{item.invoiceNumber || '—'}</td>
                        <td className="p-3 text-xs">{item.purchaseDate}</td>
                        <td className="p-3 text-xs">{item.costCenter || '—'}</td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingItem(item); setIsEditItemDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/50 font-bold">
                  <tr>
                    <td colSpan={2} className="p-3 text-right">TOTALS →</td>
                    <td className="p-3 text-center">{totalItems}</td>
                    {role === 'superadmin' ? (
                      <>
                        <td></td>
                        <td className="p-3 text-right">£{totalPurchaseCost.toFixed(2)}</td>
                        <td></td>
                        <td className="p-3 text-right">£{totalValue.toFixed(2)}</td>
                      </>
                    ) : (
                      <td colSpan={4}></td>
                    )}
                    <td colSpan={5}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
          <CardContent>
            <Label>Low Stock Task Threshold</Label>
            <Input type="number" value={lowStockThreshold} onChange={e => setLowStockThreshold(parseInt(e.target.value) || 0)} className="w-32" />
          </CardContent>
        </Card>

        {/* ADD ITEM DIALOG – REAL-TIME COST CALC */}
        <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add Stock Item</DialogTitle>
              <DialogDescription>Type Quantity + Total Cost → Cost per item updates instantly</DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-5 py-4">
              <div className="space-y-2"><Label>Item Name *</Label><Input value={newItem.itemName} onChange={e => setNewItem({ ...newItem, itemName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Location</Label><Input value={newItem.location} onChange={e => setNewItem({ ...newItem, location: e.target.value })} /></div>
              <div className="space-y-2"><Label>Quantity *</Label><Input type="number" min="1" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })} /></div>
              {role === 'superadmin' && (
                <div className="space-y-2"><Label>Total Cost Paid (£) *   <span className=' text-gray-400 text-sm ml-10'> Cost per item ( {newItem.quantity > 0 && newItem.totalCost > 0 ? `£${(newItem.totalCost / newItem.quantity).toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}` : '—'})</span></Label><Input type="number" step="0.01" value={newItem.totalCost || ''} onChange={e => setNewItem({ ...newItem, totalCost: parseFloat(e.target.value) || 0 })} className="font-bold text-lg bg-blue-50" /></div>
              )}

              <div className="space-y-2"><Label>Inc VAT</Label><Select value={newItem.incVat ? "yes" : "no"} onValueChange={v => setNewItem({ ...newItem, incVat: v === "yes" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Purchase Date</Label><Input type="date" value={newItem.purchaseDate} onChange={e => setNewItem({ ...newItem, purchaseDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Invoice #</Label><Input value={newItem.invoiceNumber} onChange={e => setNewItem({ ...newItem, invoiceNumber: e.target.value })} /></div>
              <div className="space-y-2"><Label>Cost Center</Label><Input value={newItem.costCenter} onChange={e => setNewItem({ ...newItem, costCenter: e.target.value })} /></div>
              <div className="space-y-2"><Label>Supplier</Label><Input value={newItem.supplier} onChange={e => setNewItem({ ...newItem, supplier: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddItem} disabled={!newItem.itemName || newItem.quantity < 1 || newItem.totalCost <= 0}>Add Item</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* EDIT ITEM DIALOG – SAME REAL-TIME LOGIC */}
        <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
            {editingItem && (
              <>
                <div className="grid md:grid-cols-2 gap-5 py-4">
                  <div className="space-y-2"><Label>Item Name</Label><Input value={editingItem.itemName} onChange={e => setEditingItem({ ...editingItem, itemName: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Location</Label><Input value={editingItem.location} onChange={e => setEditingItem({ ...editingItem, location: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={editingItem.quantity} onChange={e => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) || 1 })} /></div>
                  {role === 'superadmin' && (
                    <>
                      <div className="space-y-2"><Label>Total Cost Paid (£)</Label><Input type="number" step="0.01" value={editingItem.totalCost} onChange={e => setEditingItem({ ...editingItem, totalCost: parseFloat(e.target.value) || 0 })} className="font-bold bg-blue-50" /></div>

                      <div className="md:col-span-2 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-300">
                        <Label className="text-lg">Live Cost Per Item</Label>
                        <div className="text-4xl font-black text-blue-700">
                          £{(editingItem.totalCost / editingItem.quantity).toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Rest of fields same as Add */}
                  <div className="space-y-2"><Label>Inc VAT</Label><Select value={editingItem.incVat ? "yes" : "no"} onValueChange={v => setEditingItem({ ...editingItem, incVat: v === "yes" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Purchase Date</Label><Input type="date" value={editingItem.purchaseDate} onChange={e => setEditingItem({ ...editingItem, purchaseDate: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Invoice #</Label><Input value={editingItem.invoiceNumber} onChange={e => setEditingItem({ ...editingItem, invoiceNumber: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Cost Center</Label><Input value={editingItem.costCenter} onChange={e => setEditingItem({ ...editingItem, costCenter: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Supplier</Label><Input value={editingItem.supplier} onChange={e => setEditingItem({ ...editingItem, supplier: e.target.value })} /></div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsEditItemDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdateItem}>Update</Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Low Stock Task Dialog */}
        <Dialog open={isAlertActionDialogOpen} onOpenChange={setIsAlertActionDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Low Stock Task</DialogTitle></DialogHeader>
            {selectedAlert && (
              <div className="space-y-6">
                <Alert><AlertTriangle className="h-5 w-5" /><AlertDescription><strong>{selectedAlert.itemName}</strong> — Only {selectedAlert.currentQuantity} left</AlertDescription></Alert>
                <Button className="w-full" onClick={handleMarkAsOrdered}><Package className="w-5 h-5 mr-2" />Mark as Ordered</Button>
                <div className="space-y-3">
                  <Label>Create Task in</Label>
                  <div className="flex gap-2">
                    <Select value={taskDays} onValueChange={setTaskDays}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1 day</SelectItem><SelectItem value="3">3 days</SelectItem><SelectItem value="7">7 days</SelectItem><SelectItem value="14">14 days</SelectItem><SelectItem value="30">30 days</SelectItem></SelectContent></Select>
                    <Button className="flex-1" onClick={handleCreateTask}><CheckSquare className="w-5 h-5 mr-2" />Create Task</Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}