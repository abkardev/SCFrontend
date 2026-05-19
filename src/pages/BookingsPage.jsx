import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Chip, IconButton, Tooltip, MenuItem, Select,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Alert, Snackbar, Paper,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddRoundedIcon      from '@mui/icons-material/AddRounded';
import WhatsAppIcon        from '@mui/icons-material/WhatsApp';
import DeleteRoundedIcon   from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon     from '@mui/icons-material/EditRounded';
import SyncRoundedIcon     from '@mui/icons-material/SyncRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import { useLang } from '../context/AppContext.jsx';
import { getBookings, createBooking, updateBooking, deleteBooking, getDoctors, sendReminder, syncAllDoctors } from '../services/api.js';

const STATUS_COLORS = { pending:'warning', confirmed:'info', completed:'success', cancelled:'error', 'no-show':'secondary' };

const STATUS_AR = { pending:'قيد الانتظار', confirmed:'مؤكد', completed:'مكتمل', cancelled:'ملغي', 'no-show':'لم يحضر' };
const STATUS_EN = { pending:'Pending',      confirmed:'Confirmed', completed:'Completed', cancelled:'Cancelled', 'no-show':'No Show' };

const SERVICES_EN = ['General Consultation','Follow-up','Specialist Visit','Lab Results Review','Prescription Renewal'];
const SERVICES_AR = ['استشارة عامة','متابعة','زيارة متخصص','مراجعة نتائج مختبر','تجديد وصفة'];

const AR_GRID = {
  // empty state
  noRowsLabel:             'لا توجد حجوزات',
  noResultsOverlayLabel:   'لا توجد نتائج',
  // toolbar
  toolbarColumns:          'الأعمدة',
  toolbarFilters:          'فلتر',
  toolbarDensity:          'الكثافة',
  toolbarExport:           'تصدير',
  toolbarExportCSV:        'تصدير CSV',
  // column header menu (three-dots)
  columnMenuLabel:         'القائمة',
  columnMenuShowColumns:   'إظهار الأعمدة',
  columnMenuManageColumns: 'إدارة الأعمدة',
  columnMenuFilter:        'فلتر',
  columnMenuHideColumn:    'إخفاء هذا العمود',
  columnMenuUnsort:        'إلغاء الترتيب',
  columnMenuSortAsc:       'ترتيب تصاعدي ↑',
  columnMenuSortDesc:      'ترتيب تنازلي ↓',
  // filter panel
  filterPanelAddFilter:        'إضافة فلتر',
  filterPanelDeleteIconLabel:  'حذف',
  filterPanelLogicOperator:    'المنطق',
  filterPanelOperator:         'العملية',
  filterPanelOperatorAnd:      'و',
  filterPanelOperatorOr:       'أو',
  filterPanelColumns:          'الأعمدة',
  filterPanelInputLabel:       'القيمة',
  filterPanelInputPlaceholder: 'ابحث عن قيمة...',
  // filter operators
  filterOperatorContains:        'يحتوي على',
  filterOperatorEquals:          'يساوي',
  filterOperatorStartsWith:      'يبدأ بـ',
  filterOperatorEndsWith:        'ينتهي بـ',
  filterOperatorIs:              'هو',
  filterOperatorNot:             'ليس',
  filterOperatorAfter:           'بعد',
  filterOperatorOnOrAfter:       'في أو بعد',
  filterOperatorBefore:          'قبل',
  filterOperatorOnOrBefore:      'في أو قبل',
  filterOperatorIsEmpty:         'فارغ',
  filterOperatorIsNotEmpty:      'ليس فارغاً',
  filterOperatorIsAnyOf:         'أي من',
  // column header tooltips
  columnHeaderFiltersTooltipActive: (c) => `${c} فلتر نشط`,
  columnHeaderSortIconLabel:         'ترتيب',
  // pagination
  MuiTablePagination: {
    labelRowsPerPage: 'صفوف في الصفحة:',
    labelDisplayedRows: ({ from, to, count }) =>
      `${from}–${to} من ${count !== -1 ? count : `أكثر من ${to}`}`,
  },
};

const emptyForm = { name:'', phone:'', service:'', date:'', time:'', status:'pending', doctorId:'', notes:'' };

export default function BookingsPage() {
  const { isRTL } = useLang();
  const [bookings, setBookings] = useState([]);
  const [doctors, setDoctors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [editId, setEditId]     = useState(null);
  const [snackbar, setSnackbar] = useState({ open:false, message:'', severity:'success' });
  const [filters, setFilters]   = useState({ status:'', service:'', doctorId:'' });

  const SERVICES = isRTL ? SERVICES_AR : SERVICES_EN;

  const notify = (en, ar, severity='success') =>
    setSnackbar({ open:true, message: isRTL ? ar : en, severity });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status)   params.status   = filters.status;
      if (filters.doctorId) params.doctorId = filters.doctorId;
      const [bRes, dRes] = await Promise.all([getBookings(params), getDoctors()]);
      let data = bRes.data.map(b => ({ ...b, id: b._id }));
      if (filters.service) data = data.filter(b => b.service === filters.service || SERVICES_AR[SERVICES_EN.indexOf(b.service)] === filters.service);
      setBookings(data);
      setDoctors(dRes.data);
    } catch { notify('Failed to load','فشل التحميل','error'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleOpen = (booking=null) => {
    setForm(booking
      ? { name:booking.name, phone:booking.phone, service:booking.service, date:booking.date, time:booking.time, status:booking.status, doctorId:booking.doctorId?._id||booking.doctorId, notes:booking.notes||'' }
      : emptyForm);
    setEditId(booking?._id||null);
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editId) await updateBooking(editId, form);
      else        await createBooking(form);
      notify('Booking saved','تم حفظ الحجز');
      setOpen(false); loadData();
    } catch (err) { notify(err.response?.data?.message||'Error', err.response?.data?.message||'خطأ','error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isRTL?'هل أنت متأكد من حذف هذا الحجز؟':'Delete this booking?')) return;
    try { await deleteBooking(id); notify('Booking deleted','تم حذف الحجز'); loadData(); }
    catch { notify('Failed','فشل الحذف','error'); }
  };

  const handleReminder = async (id) => {
    try { await sendReminder(id); notify('Reminder sent!','تم إرسال التذكير!'); }
    catch { notify('Failed to send','فشل الإرسال','error'); }
  };

  const handleSync = async () => {
    try {
      const res = await syncAllDoctors();
      const msg = res.data.results.map(r=>`${r.doctor}: ${r.synced??r.error}`).join(', ');
      notify(`Synced: ${msg}`,`تمت المزامنة: ${msg}`);
      loadData();
    } catch { notify('Sync failed','فشلت المزامنة','error'); }
  };

  const statusKeys = ['pending','confirmed','completed','cancelled','no-show'];

  const columns = [
    { field:'name',   headerName: isRTL?'المريض':'Patient',  flex:1, minWidth:120 },
    { field:'phone',  headerName: isRTL?'الهاتف':'Phone',    width:130 },
    { field:'service',headerName: isRTL?'الخدمة':'Service',  flex:1, minWidth:170,
      valueGetter: (p) => {
        if (!isRTL) return p.row.service;
        const idx = SERVICES_EN.indexOf(p.row.service);
        return idx >= 0 ? SERVICES_AR[idx] : p.row.service;
      }
    },
    { field:'doctorId', headerName: isRTL?'الطبيب':'Doctor', width:140,
      valueGetter:(p)=> {
        const doc = p.row.doctorId;
        if (!doc || typeof doc !== 'object') return '—';
        return isRTL ? (doc.nameAr || doc.nameEn || '—') : (doc.nameEn || doc.nameAr || '—');
      },
    },
    { field:'date',   headerName: isRTL?'التاريخ':'Date',    width:110 },
    { field:'time',   headerName: isRTL?'الوقت':'Time',      width:80 },
    {
      field:'status', headerName: isRTL?'الحالة':'Status', width:130,
      renderCell:(p) => <Chip label={isRTL ? STATUS_AR[p.value]||p.value : STATUS_EN[p.value]||p.value} color={STATUS_COLORS[p.value]||'default'} size="small" sx={{ fontWeight:700 }}/>,
    },
    { field:'source', headerName: isRTL?'المصدر':'Source', width:110,
      renderCell:(p) => {
        const srcAr = { whatsapp:'واتساب', instagram:'إنستجرام', dashboard:'لوحة التحكم', api:'API' };
        return <Typography fontSize={12} color="text.secondary">{isRTL?(srcAr[p.value]||p.value):p.value}</Typography>;
      }
    },
    {
      field:'actions', headerName: isRTL?'الإجراءات':'Actions', width:130, sortable:false,
      renderCell:(p) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title={isRTL?'تعديل الحجز':'Edit booking'}>
            <IconButton size="small" onClick={()=>handleOpen(p.row)}><EditRoundedIcon fontSize="small"/></IconButton>
          </Tooltip>
          <Tooltip title={isRTL?'إرسال تذكير واتساب':'Send WhatsApp reminder'}>
            <IconButton size="small" color="success" onClick={()=>handleReminder(p.row._id)}><WhatsAppIcon fontSize="small"/></IconButton>
          </Tooltip>
          <Tooltip title={isRTL?'حذف الحجز':'Delete booking'}>
            <IconButton size="small" color="error" onClick={()=>handleDelete(p.row._id)}><DeleteRoundedIcon fontSize="small"/></IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
            {isRTL?'الحجوزات':'Bookings'}
          </Typography>
          <Typography color="text.secondary" fontSize={14} mt={0.5}>
            {bookings.length} {isRTL?'حجز':'booking(s)'}
          </Typography>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          {/* Status filter */}
          <FormControl size="small" sx={{ minWidth:150 }}>
            <InputLabel>{isRTL?'الحالة':'Status'}</InputLabel>
            <Select value={filters.status} label={isRTL?'الحالة':'Status'} onChange={e=>setFilters({...filters,status:e.target.value})}>
              <MenuItem value="">{isRTL?'الكل':'All'}</MenuItem>
              {statusKeys.map(s=><MenuItem key={s} value={s}>{isRTL?STATUS_AR[s]:STATUS_EN[s]}</MenuItem>)}
            </Select>
          </FormControl>
          {/* Service filter */}
          <FormControl size="small" sx={{ minWidth:170 }}>
            <InputLabel>{isRTL?'الخدمة':'Service'}</InputLabel>
            <Select value={filters.service} label={isRTL?'الخدمة':'Service'} onChange={e=>setFilters({...filters,service:e.target.value})}>
              <MenuItem value="">{isRTL?'الكل':'All'}</MenuItem>
              {SERVICES_EN.map((s,i)=><MenuItem key={s} value={s}>{isRTL?SERVICES_AR[i]:s}</MenuItem>)}
            </Select>
          </FormControl>
          {/* Doctor filter */}
          <FormControl size="small" sx={{ minWidth:160 }}>
            <InputLabel>{isRTL?'الطبيب':'Doctor'}</InputLabel>
            <Select value={filters.doctorId} label={isRTL?'الطبيب':'Doctor'} onChange={e=>setFilters({...filters,doctorId:e.target.value})}>
              <MenuItem value="">{isRTL?'الكل':'All'}</MenuItem>
              {doctors.map(d=><MenuItem key={d._id} value={d._id}>{isRTL?`د. ${d.nameAr||d.name}`:`Dr. ${d.nameEn||d.name}`}</MenuItem>)}
            </Select>
          </FormControl>
          <Tooltip title={isRTL?'مزامنة مع تقويم جوجل':'Sync from Google Calendar'}>
            <Button variant="outlined" startIcon={<SyncRoundedIcon/>} onClick={handleSync} sx={{ borderRadius:2.5 }}>
              {isRTL?'مزامنة':'Sync'}
            </Button>
          </Tooltip>
          <Button variant="contained" startIcon={<AddRoundedIcon/>} onClick={()=>handleOpen()} sx={{ borderRadius:2.5 }}>
            {isRTL?'حجز جديد':'New Booking'}
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ height:560, borderRadius:3, overflow:'hidden', border:'1px solid rgba(148,163,184,0.15)' }}>
        <DataGrid
          rows={bookings} columns={columns} loading={loading}
          pageSize={10} rowsPerPageOptions={[10,25,50]} disableSelectionOnClick
          localeText={isRTL ? AR_GRID : undefined}
          sx={{ border:'none', '& .MuiDataGrid-columnHeaders':{ bgcolor:'#F8FAFC', fontWeight:700 }, '& .MuiDataGrid-footerContainer':{ borderTop:'1px solid rgba(148,163,184,0.15)' } }}
        />
      </Paper>

      {/* Form Dialog */}
      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
        <DialogTitle fontWeight={800}>{editId?(isRTL?'تعديل الحجز':'Edit Booking'):(isRTL?'حجز جديد':'New Booking')}</DialogTitle>
        <DialogContent sx={{ display:'flex', flexDirection:'column', gap:2, pt:'16px !important' }}>
          <TextField label={isRTL?'اسم المريض':'Patient Name'} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} fullWidth required/>
          <TextField label={isRTL?'الهاتف':'Phone'} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} fullWidth placeholder="+966501234567"/>
          <FormControl fullWidth>
            <InputLabel>{isRTL?'الطبيب':'Doctor'}</InputLabel>
            <Select value={form.doctorId} label={isRTL?'الطبيب':'Doctor'} onChange={e=>setForm({...form,doctorId:e.target.value})}>
              {doctors.map(d=><MenuItem key={d._id} value={d._id}>{isRTL?`د. ${d.nameAr||d.name}`:`Dr. ${d.nameEn||d.name}`}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>{isRTL?'الخدمة':'Service'}</InputLabel>
            <Select value={form.service} label={isRTL?'الخدمة':'Service'} onChange={e=>setForm({...form,service:e.target.value})}>
              {SERVICES_EN.map((s,i)=><MenuItem key={s} value={s}>{isRTL?SERVICES_AR[i]:s}</MenuItem>)}
            </Select>
          </FormControl>
          <Box display="flex" gap={2}>
            <TextField label={isRTL?'التاريخ':'Date'} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} fullWidth InputLabelProps={{ shrink:true }}/>
            <TextField label={isRTL?'الوقت':'Time'} type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} fullWidth InputLabelProps={{ shrink:true }}/>
          </Box>
          <FormControl fullWidth>
            <InputLabel>{isRTL?'الحالة':'Status'}</InputLabel>
            <Select value={form.status} label={isRTL?'الحالة':'Status'} onChange={e=>setForm({...form,status:e.target.value})}>
              {statusKeys.map(s=><MenuItem key={s} value={s}>{isRTL?STATUS_AR[s]:STATUS_EN[s]}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label={isRTL?'ملاحظات':'Notes'} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} fullWidth multiline rows={2}/>
        </DialogContent>
        <DialogActions sx={{ px:3, pb:3, gap:1 }}>
          <Button onClick={()=>setOpen(false)} variant="outlined" sx={{ borderRadius:2 }}>{isRTL?'إلغاء':'Cancel'}</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name||!form.doctorId||!form.service} sx={{ borderRadius:2, px:3 }}>{isRTL?'حفظ':'Save'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={()=>setSnackbar({...snackbar,open:false})} anchorOrigin={{ vertical:'bottom', horizontal:isRTL?'left':'right' }}>
        <Alert severity={snackbar.severity} sx={{ borderRadius:2.5 }} onClose={()=>setSnackbar({...snackbar,open:false})}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
