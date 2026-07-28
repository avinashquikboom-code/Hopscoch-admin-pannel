'use client';

import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { Search, Upload, MapPin, CheckCircle2, XCircle, Filter, Trash2, Edit, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { AppDrawer } from '@/components/ui/app-drawer';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface PincodeItem {
  pin: string;
  city: string;
  state: string;
  cod: boolean;
  express: boolean;
  active: boolean;
}

const initialPincodes: PincodeItem[] = [
  { pin: '400001', city: 'Mumbai', state: 'MH', cod: true, express: true, active: true },
  { pin: '400002', city: 'Mumbai', state: 'MH', cod: true, express: true, active: true },
  { pin: '110001', city: 'New Delhi', state: 'DL', cod: true, express: true, active: true },
  { pin: '560001', city: 'Bangalore', state: 'KA', cod: true, express: false, active: true },
  { pin: '600001', city: 'Chennai', state: 'TN', cod: true, express: false, active: true },
  { pin: '500001', city: 'Hyderabad', state: 'TS', cod: false, express: false, active: true },
  { pin: '700001', city: 'Kolkata', state: 'WB', cod: true, express: false, active: true },
  { pin: '302001', city: 'Jaipur', state: 'RJ', cod: true, express: false, active: false },
  { pin: '380001', city: 'Ahmedabad', state: 'GJ', cod: true, express: true, active: true },
  { pin: '800001', city: 'Patna', state: 'BR', cod: false, express: false, active: false },
];

const Tick = ({ val }: { val: boolean }) =>
  val ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-400" />;

export default function PincodePage() {
  const [pincodesList, setPincodesList] = useState<PincodeItem[]>(initialPincodes);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [open, setOpen] = useState(false);
  const [editingPincode, setEditingPincode] = useState<PincodeItem | null>(null);
  const [form, setForm] = useState({ pin: '', city: '', state: '', cod: true, express: false, active: true });

  const handleOpenAdd = () => {
    setEditingPincode(null);
    setForm({ pin: '', city: '', state: '', cod: true, express: false, active: true });
    setOpen(true);
  };

  const handleOpenEdit = (p: PincodeItem) => {
    setEditingPincode(p);
    setForm({ pin: p.pin, city: p.city, state: p.state, cod: p.cod, express: p.express, active: p.active });
    setOpen(true);
  };

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPincode) {
      setPincodesList(prev =>
        prev.map(p =>
          p.pin === editingPincode.pin
            ? { ...p, city: form.city, state: form.state, cod: form.cod, express: form.express, active: form.active }
            : p
        )
      );
    } else {
      // Avoid duplicate pincodes
      if (pincodesList.some(p => p.pin === form.pin)) {
        alert('Pincode already exists!');
        return;
      }
      setPincodesList(prev => [...prev, { ...form }]);
    }
    setOpen(false);
  };

  const handleDelete = (pin: string) => {
    setPincodesList(prev => prev.filter(p => p.pin !== pin));
  };

  const toggleActive = (pin: string) => {
    setPincodesList(prev =>
      prev.map(p => (p.pin === pin ? { ...p, active: !p.active } : p))
    );
  };

  const filtered = pincodesList.filter(p => {
    const matchSearch = p.pin.includes(search) || p.city.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterActive === 'all' || (filterActive === 'active' ? p.active : !p.active);
    return matchSearch && matchFilter;
  });

  const [sorting, setSorting] = useState<SortingState>([]);

  const pincodeColumns = useMemo<ColumnDef<PincodeItem>[]>(() => [
    { accessorKey: 'pin', header: 'Pincode' },
    { accessorKey: 'city', header: 'City' },
    { accessorKey: 'state', header: 'State' },
    { accessorKey: 'cod', header: 'COD' },
    { accessorKey: 'express', header: 'Express' },
    { accessorKey: 'active', header: 'Status' },
  ], []);

  const pincodeTable = useReactTable({
    data: filtered,
    columns: pincodeColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          titlePart1="Shipping"
          titlePart2="Pincode Serviceability"
          badgeText="Logistics Command Center"
          subtitle="Manage serviceable pincodes, COD, and express availability."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-md gap-2 text-sm border-border/60 cursor-pointer">
                <Upload className="h-4 w-4" /> Upload CSV
              </Button>
              <Button onClick={handleOpenAdd} className="rounded-md gap-2 bg-primary text-white hover:bg-primary/95 shadow-sm shadow-[#14b8a6]/10 cursor-pointer">
                <MapPin className="h-4 w-4" /> Add Pincode
              </Button>
            </div>
          }
        />

        <AppDrawer
          title={editingPincode ? 'Edit Pincode' : 'Add Pincode'}
          subtitle={editingPincode ? 'Update shipping settings for this pincode.' : 'Add a new pincode to the service network.'}
          open={open}
          onClose={setOpen}
          onSubmit={handleAddOrUpdate}
        >
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Pincode *</Label>
              <Input required disabled={!!editingPincode} value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value })} placeholder="e.g. 400001" className="h-11 rounded-lg" />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">City *</Label>
              <Input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="e.g. Mumbai" className="h-11 rounded-lg" />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">State *</Label>
              <Input required value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="e.g. MH" className="h-11 rounded-lg" />
            </div>
            <div className="flex items-center justify-between border-t border-border/30 pt-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Cash on Delivery (COD)</Label>
                <p className="text-xs text-muted-foreground">Allow COD payments for this region</p>
              </div>
              <Switch checked={form.cod} onCheckedChange={checked => setForm({ ...form, cod: checked })} />
            </div>
            <div className="flex items-center justify-between border-t border-border/30 pt-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Express Delivery</Label>
                <p className="text-xs text-muted-foreground">Support 1-2 day fast shipping</p>
              </div>
              <Switch checked={form.express} onCheckedChange={checked => setForm({ ...form, express: checked })} />
            </div>
            <div className="flex items-center justify-between border-t border-border/30 pt-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Active Status</Label>
                <p className="text-xs text-muted-foreground">Enable or disable delivery routes</p>
              </div>
              <Switch checked={form.active} onCheckedChange={checked => setForm({ ...form, active: checked })} />
            </div>
          </div>
        </AppDrawer>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Pincodes', value: pincodesList.length, color: 'text-[#14b8a6]' },
            { label: 'Active', value: pincodesList.filter(p => p.active).length, color: 'text-emerald-500' },
            { label: 'COD Available', value: pincodesList.filter(p => p.cod).length, color: 'text-amber-500' },
            { label: 'Express Available', value: pincodesList.filter(p => p.express).length, color: 'text-violet-500' },
          ].map(s => (
            <Card key={s.label} className="border-border/40 bg-card rounded-lg">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                <p className={`text-2xl font-bold mt-1.5 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm group">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input placeholder="Search pincode or city..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11 h-10 rounded-md border-border/60" />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <Button key={f} size="sm" variant={filterActive === f ? 'default' : 'outline'}
                onClick={() => setFilterActive(f)}
                className={`rounded-md capitalize text-xs ${filterActive === f ? 'bg-primary text-white' : 'border-border/60'}`}>
                <Filter className="h-3 w-3 mr-1" />{f}
              </Button>
            ))}
          </div>
        </div>

        <Card className="border-border/40 rounded-lg bg-card">
          <CardHeader><CardTitle className="text-sm font-bold">Pincode List ({filtered.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">
                      <Button variant="ghost" onClick={() => pincodeTable.getColumn('pin')?.toggleSorting(pincodeTable.getColumn('pin')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Pincode <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">
                      <Button variant="ghost" onClick={() => pincodeTable.getColumn('city')?.toggleSorting(pincodeTable.getColumn('city')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        City <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">State</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">COD</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Express</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pincodeTable.getRowModel().rows.length ? (
                    pincodeTable.getRowModel().rows.map((row) => {
                    const p = row.original;
                    return (
                    <TableRow key={row.id} className="hover:bg-muted/10">
                      <TableCell className="font-mono font-bold text-sm text-[#14b8a6]">{p.pin}</TableCell>
                      <TableCell className="text-sm font-semibold">{p.city}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.state}</TableCell>
                      <TableCell><Tick val={p.cod} /></TableCell>
                      <TableCell><Tick val={p.express} /></TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] rounded-full px-2.5 border-transparent font-semibold ${p.active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                          {p.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs rounded-md" onClick={() => toggleActive(p.pin)}>
                            {p.active ? 'Disable' : 'Enable'}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleOpenEdit(p)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-rose-500 hover:bg-rose-500/10" onClick={() => handleDelete(p.pin)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">No pincodes found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {filtered.length > 0 && (
                <div className="flex items-center justify-between p-3 border-t border-border/30 bg-muted/10 text-xs">
                  <span className="text-muted-foreground font-semibold">
                    {pincodeTable.getFilteredRowModel().rows.length} of {filtered.length} pincodes
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => pincodeTable.previousPage()} disabled={!pincodeTable.getCanPreviousPage()}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-2 font-bold text-foreground text-[11px]">
                      {pincodeTable.getState().pagination.pageIndex + 1} / {pincodeTable.getPageCount() || 1}
                    </span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => pincodeTable.nextPage()} disabled={!pincodeTable.getCanNextPage()}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
