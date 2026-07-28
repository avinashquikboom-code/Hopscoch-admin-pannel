'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { AppDrawer } from '@/components/ui/app-drawer';
import { PageHeader } from '@/components/layout/page-header';
import { Plus, Search, Edit, Trash2, Globe, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

const initialZones = [
  { id: '1', name: 'Zone A — Metro', country: 'India', states: 'MH, DL, KA, TN', cities: 'Mumbai, Delhi, Bangalore, Chennai', pincodes: '400001-400099, 110001-110099', status: true },
  { id: '2', name: 'Zone B — Tier 1', country: 'India', states: 'GJ, RJ, UP', cities: 'Ahmedabad, Jaipur, Lucknow', pincodes: '380001-380099, 302001-302099', status: true },
  { id: '3', name: 'Zone C — Tier 2', country: 'India', states: 'BR, JH, OR', cities: 'Patna, Ranchi, Bhubaneswar', pincodes: '800001-800099', status: true },
  { id: '4', name: 'Zone D — Remote', country: 'India', states: 'NE States, J&K', cities: 'Remote Areas', pincodes: 'Various', status: false },
  { id: '5', name: 'International — SAARC', country: 'Global', states: 'BD, LK, NP, PK', cities: 'Dhaka, Colombo, Kathmandu', pincodes: 'N/A', status: false },
];


export default function ShippingZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', country: 'India', states: '', cities: '', pincodes: '' });

  useEffect(() => {
    const saved = localStorage.getItem('fciseller_shipping_zones') || localStorage.getItem('hopscotch_shipping_zones');
    if (saved) {
      setZones(JSON.parse(saved));
    } else {
      setZones(initialZones);
      localStorage.setItem('fciseller_shipping_zones', JSON.stringify(initialZones));
    }
  }, []);

  const saveZones = (newZones: any[]) => {
    setZones(newZones);
    localStorage.setItem('fciseller_shipping_zones', JSON.stringify(newZones));
  };

  const filtered = zones.filter(z =>
    z.name.toLowerCase().includes(search.toLowerCase()) || z.country.toLowerCase().includes(search.toLowerCase())
  );

  const [sorting, setSorting] = useState<SortingState>([]);

  const zoneColumns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'name', header: 'Zone Name' },
    { accessorKey: 'country', header: 'Country' },
    { accessorKey: 'states', header: 'States' },
    { accessorKey: 'cities', header: 'Cities' },
    { accessorKey: 'pincodes', header: 'Pincodes' },
    { accessorKey: 'status', header: 'Status' },
  ], []);

  const zoneTable = useReactTable({
    data: filtered,
    columns: zoneColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingZone) {
      const updated = zones.map(z => z.id === editingZone.id ? { ...z, ...form } : z);
      saveZones(updated);
      setEditingZone(null);
    } else {
      saveZones([...zones, { id: String(Date.now()), ...form, status: true }]);
    }
    setForm({ name: '', country: 'India', states: '', cities: '', pincodes: '' });
    setOpen(false);
  };

  const startEdit = (zone: any) => {
    setEditingZone(zone);
    setForm({
      name: zone.name,
      country: zone.country,
      states: zone.states,
      cities: zone.cities,
      pincodes: zone.pincodes,
    });
    setOpen(true);
  };

  const handleToggle = (id: string) => {
    saveZones(zones.map(z => z.id === id ? { ...z, status: !z.status } : z));
  };

  const handleDelete = (id: string) => {
    saveZones(zones.filter(z => z.id !== id));
  };

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          titlePart1="Shipping"
          titlePart2="Zones"
          badgeText="Logistics Command Center"
          subtitle="Define geographic zones for shipping rate assignments."

          actions={
            <Button onClick={() => { setEditingZone(null); setForm({ name: '', country: 'India', states: '', cities: '', pincodes: '' }); setOpen(true); }} className="rounded-md gap-2 bg-primary text-white hover:bg-primary/95 shadow-sm shadow-[#14b8a6]/10 cursor-pointer">
              <Plus className="h-4 w-4" /> Add Zone
            </Button>
          }
        />

        <AppDrawer
          title={editingZone ? "Edit Shipping Zone" : "Add Shipping Zone"}
          subtitle={editingZone ? "Modify geographic delivery zone parameters." : "Define a new geographic delivery zone."}
          open={open}
          onClose={(o) => { setOpen(o); if (!o) setEditingZone(null); }}
          onSubmit={handleAdd}
        >
          <div className="space-y-6">
            {[
              { key: 'name', label: 'Zone Name *', placeholder: 'e.g. Zone A — Metro', required: true },
              { key: 'country', label: 'Country', placeholder: 'e.g. India', required: false },
              { key: 'states', label: 'States / Regions', placeholder: 'e.g. MH, DL, KA', required: false },
              { key: 'cities', label: 'Cities', placeholder: 'e.g. Mumbai, Delhi', required: false },
              { key: 'pincodes', label: 'Pin Codes', placeholder: 'e.g. 400001-400099', required: false },
            ].map(f => (
              <div key={f.key} className="space-y-3">
                <Label className="text-sm font-semibold">{f.label}</Label>
                <Input required={f.required} value={(form as Record<string, string>)[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder} className="h-11 rounded-lg" />
              </div>
            ))}
          </div>
        </AppDrawer>

        <div className="relative max-w-sm group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input placeholder="Search zones..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11 h-10 rounded-md border-border/60" />
        </div>

        <Card className="border-border/40 rounded-lg bg-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">
                      <Button variant="ghost" onClick={() => zoneTable.getColumn('name')?.toggleSorting(zoneTable.getColumn('name')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Zone Name <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Country</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">States</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Cities</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Pincodes</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zoneTable.getRowModel().rows.length ? (
                    zoneTable.getRowModel().rows.map((row) => {
                    const z = row.original;
                    return (
                    <TableRow key={row.id} className="hover:bg-muted/10">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="font-semibold text-sm">{z.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{z.country}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{z.states}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">{z.cities}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground/80 max-w-[140px] truncate">{z.pincodes}</TableCell>
                      <TableCell>
                        <Badge
                          onClick={() => handleToggle(z.id)}
                          className={`text-[10px] rounded-full px-2.5 border-transparent font-semibold cursor-pointer transition-all hover:scale-105 ${z.status ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}
                        >
                          {z.status ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted/60" onClick={() => startEdit(z)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-rose-500/10 text-rose-500" onClick={() => handleDelete(z.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">No zones found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {filtered.length > 0 && (
                <div className="flex items-center justify-between p-3 border-t border-border/30 bg-muted/10 text-xs">
                  <span className="text-muted-foreground font-semibold">
                    {zoneTable.getFilteredRowModel().rows.length} of {filtered.length} zones
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => zoneTable.previousPage()} disabled={!zoneTable.getCanPreviousPage()}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-2 font-bold text-foreground text-[11px]">
                      {zoneTable.getState().pagination.pageIndex + 1} / {zoneTable.getPageCount() || 1}
                    </span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => zoneTable.nextPage()} disabled={!zoneTable.getCanNextPage()}>
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
