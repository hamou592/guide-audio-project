import React, { useEffect, useState } from 'react';
import api from '../../api';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Box,
  Typography,
  Chip,
  Pagination,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';

function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [museums, setMuseums] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [editTicket, setEditTicket] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [form, setForm] = useState({
    qr_code: '',
    purchase_time: '',
    expiration_time: '',
    status: 'active',
    museum_id: null,
  });
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrImage, setQrImage] = useState(null);

  const [search, setSearch] = useState('');
  const [museumFilter, setMuseumFilter] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const theme = useTheme();

  const isExpired = (expirationTime) => {
    if (!expirationTime) return false;
    const expirationDate = new Date(expirationTime);
    const now = new Date();
    return expirationDate < now;
  };

  const fetchData = async () => {
    try {
      let ticketsRes, museumsRes;
      if (user.status === 'superadmin') {
        [ticketsRes, museumsRes] = await Promise.all([
          api.get('/tickets'),
          api.get('/museums'),
        ]);
        setMuseums(museumsRes.data);
      } else {
        ticketsRes = await api.get('/tickets');
        setMuseums([]);
      }
      const updatedTickets = ticketsRes.data.map((ticket) => ({
        ...ticket,
        status: isExpired(ticket.expiration_time) ? 'expired' : ticket.status,
      }));
      setTickets(updatedTickets);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error fetching data');
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    setPage(1);
  }, [search, museumFilter]);

  const handleViewQr = async (ticketId) => {
    try {
      const res = await api.get(`/tickets/${ticketId}/qr`, { responseType: 'blob' });
      const imageUrl = URL.createObjectURL(res.data);
      setQrImage(imageUrl);
      setQrModalOpen(true);
    } catch (err) {
      setError('Failed to load QR code');
    }
  };

  const handlePrintTicket = async (ticket) => {
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      alert('Direct Bluetooth printing is not supported in this browser. Please use the native app or print from a PC.');
      return;
    }

    try {
      const qrRes = await api.get(`/tickets/${ticket.id}/qr`, { responseType: 'blob' });
      const qrImageUrl = URL.createObjectURL(qrRes.data);

      const museumName =
        user?.status === 'superadmin'
          ? museums.find((m) => m.id === ticket.museum_id)?.title || 'Museum'
          : user?.museum?.title || 'Museum';

      const printContent = `
        <html>
          <head>
            <title>Ticket Print</title>
            <style>
              @media print {
                @page {
                  size: 58mm auto;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  font-family: monospace;
                  font-size: 12px;
                  width: 58mm;
                  color: #000;
                }
                .container {
                  padding: 4px 8px;
                  width: 100%;
                }
                .header {
                  font-weight: bold;
                  font-size: 14px;
                  text-align: center;
                  margin-bottom: 8px;
                  border-bottom: 1px dashed #000;
                  padding-bottom: 4px;
                }
                .ticket-info {
                  margin: 8px 0;
                  white-space: pre-wrap;
                }
                .ticket-info div {
                  margin-bottom: 4px;
                }
                .qr-code {
                  text-align: center;
                  margin: 8px 0;
                }
                .qr-code img {
                  width: 48mm;
                  height: 48mm;
                }
                .footer {
                  font-size: 10px;
                  text-align: center;
                  margin-top: 8px;
                  border-top: 1px dashed #000;
                  padding-top: 4px;
                }
              }
              body::-webkit-scrollbar {
                display: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">${museumName}\nTICKET D'ENTREE</div>
              <div class="ticket-info">
                <div><strong>Code QR:</strong> ${ticket.qr_code}</div>
                <div><strong>Achat:</strong> ${new Date(ticket.purchase_time).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}</div>
                <div><strong>Expire:</strong> ${new Date(ticket.expiration_time).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}</div>
              </div>
              <div class="qr-code">
                <img src="${qrImageUrl}" alt="QR Code" />
                <div style="font-size: 8px; margin-top: 4px;">Scannez pour valider</div>
              </div>
              <div class="footer">
                Merci de votre visite!<br />
                Conservez ce ticket
              </div>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    } catch (error) {
      console.error('Error printing ticket:', error);
      setError('Failed to print ticket');
    }
  };

  const handleOpen = (ticket = null) => {
    setEditTicket(ticket);

    if (ticket) {
      setForm({
        qr_code: ticket.qr_code,
        purchase_time: ticket.purchase_time ? new Date(ticket.purchase_time).toISOString().slice(0, 16) : '',
        expiration_time: ticket.expiration_time ? new Date(ticket.expiration_time).toISOString().slice(0, 16) : '',
        status: ticket.status || 'active',
        museum_id: ticket.museum_id || null,
      });
    } else {
      const now = new Date();

      // Format date as DDMM
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const datePart = day + month;

      // Random number 0-100, zero padded 2 digits
      const randomNum = Math.floor(Math.random() * 101).toString().padStart(2, '0');

      // Format time as HHmm
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const timePart = hours + minutes;

      const generatedCode = datePart + randomNum + timePart;

      setForm({
        qr_code: generatedCode,
        purchase_time: now.toISOString().slice(0, 16),
        expiration_time: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        status: 'active',
        museum_id: user.status === 'superadmin' ? null : user.museum_id,
      });
    }

    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditTicket(null);
    setError('');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (!form.qr_code || !form.purchase_time || !form.expiration_time) {
        setError('Please fill in all required fields');
        return;
      }

      if (new Date(form.expiration_time) <= new Date(form.purchase_time)) {
        setError('Expiration time must be after purchase time');
        return;
      }

      if (user.status === 'superadmin' && !form.museum_id) {
        setError('Please select a museum');
        return;
      }

      const submitData = {
        ...form,
        museum_id: user.status === 'superadmin' ? form.museum_id : user.museum_id,
      };

      if (editTicket) {
        await api.put(`/tickets/${editTicket.id}`, submitData);
      } else {
        await api.post('/tickets', submitData);
      }
      await fetchData();
      handleClose();
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Error saving ticket');
    }
  };

  const handleDeleteClick = (ticket) => {
    setTicketToDelete(ticket);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/tickets/${ticketToDelete.id}`);
      await fetchData();
      setDeleteDialogOpen(false);
      setTicketToDelete(null);
    } catch (error) {
      console.error('Error:', error);
      setError('Error deleting ticket');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTicketToDelete(null);
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.qr_code.toLowerCase().includes(search.trim().toLowerCase());
    const matchesMuseum = !museumFilter || museumFilter === '' || ticket.museum_id === museumFilter.id;
    return matchesSearch && matchesMuseum;
  });

  const pageCount = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div
      style={{
        marginLeft: 0,
        padding: 16,
        [theme.breakpoints.up('md')]: {
          marginLeft: 260,
          padding: 32,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 'fit-content', flexShrink: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            Tickets Management
          </Typography>
          {user?.status === 'superadmin' && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
              {museumFilter ? `Filtered by: ${museumFilter.title}` : 'All Museums'}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexGrow: 1,
            maxWidth: { xs: '100%', md: '600px' },
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            placeholder="Search by QR code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          {user?.status === 'superadmin' && (
            <Autocomplete
              size="small"
              options={museums}
              getOptionLabel={(option) => option.title || ''}
              value={museumFilter}
              onChange={(_, newValue) => setMuseumFilter(newValue)}
              sx={{ minWidth: 200 }}
              renderInput={(params) => <TextField {...params} label="Filter by Museum" variant="outlined" />}
              clearOnEscape
              isOptionEqualToValue={(option, value) => option.id === value.id}
              freeSolo={false}
            />
          )}
        </Box>

        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          Add Ticket
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        {tickets.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography>No tickets found.</Typography>
          </Box>
        ) : (
          <Table sx={{ minWidth: 650 }} aria-label="tickets table">
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>ID</TableCell>
                {user?.status === 'superadmin' && (
                  <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Museum</TableCell>
                )}
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>QR Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Purchase Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Expiration Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={user?.status === 'superadmin' ? 7 : 6} align="center">
                    {search || museumFilter ? 'No tickets found matching your criteria' : 'No tickets found.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTickets.map((ticket, index) => (
                  <TableRow
                    key={ticket.id}
                    sx={{
                      backgroundColor: index % 2 === 0 ? theme.palette.background.default : '#f9f9f9',
                      '&:hover': { backgroundColor: theme.palette.action.hover },
                    }}
                  >
                    <TableCell>{ticket.id}</TableCell>
                    {user?.status === 'superadmin' && (
                      <TableCell>
                        <Chip
                          label={museums.find((m) => m.id === ticket.museum_id)?.title || 'N/A'}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">{ticket.qr_code}</Typography>
                        <Button size="small" variant="outlined" onClick={() => handleViewQr(ticket.id)}>
                          View QR
                        </Button>
                      </Box>
                    </TableCell>
                    <TableCell>{new Date(ticket.purchase_time).toLocaleString()}</TableCell>
                    <TableCell>{new Date(ticket.expiration_time).toLocaleString()}</TableCell>
                    <TableCell>
                      {ticket.status === 'expired' ? (
                        <Chip
                          label="expired"
                          sx={{
                            backgroundColor: '#d32f2f',
                            color: '#fff',
                            fontWeight: 'bold',
                            borderRadius: '16px',
                            padding: '0 12px',
                            height: 24,
                            fontSize: '0.75rem',
                            textTransform: 'capitalize',
                          }}
                        />
                      ) : (
                        <Chip
                          label="active"
                          sx={{
                            backgroundColor: '#388e3c',
                            color: '#fff',
                            fontWeight: 'bold',
                            borderRadius: '16px',
                            padding: '0 12px',
                            height: 24,
                            fontSize: '0.75rem',
                            textTransform: 'capitalize',
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button size="small" variant="outlined" onClick={() => handleOpen(ticket)}>
                          Edit
                        </Button>
                        <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteClick(ticket)}>
                          Delete
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="info"
                          onClick={() => handlePrintTicket(ticket)}
                          sx={{ minWidth: 'auto' }}
                        >
                          Imprimer
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{editTicket ? 'Edit Ticket' : 'Add Ticket'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="QR Code"
            name="qr_code"
            value={form.qr_code}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            disabled={!!editTicket}
          />

          <TextField
            label="Purchase Time"
            name="purchase_time"
            type="datetime-local"
            value={form.purchase_time}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />

          <TextField
            label="Expiration Time"
            name="expiration_time"
            type="datetime-local"
            value={form.expiration_time}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />

          {!editTicket && user.status === 'superadmin' && (
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Museum</InputLabel>
              <Select
                name="museum_id"
                value={form.museum_id || ''}
                onChange={handleChange}
                label="Museum"
              >
                {museums.map((museum) => (
                  <MenuItem key={museum.id} value={museum.id}>
                    {museum.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {editTicket && (
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Status</InputLabel>
              <Select name="status" value={form.status} onChange={handleChange} label="Status">
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editTicket ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this ticket?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={qrModalOpen} onClose={() => setQrModalOpen(false)} maxWidth="xs">
        <DialogTitle>QR Code</DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {qrImage ? (
            <img src={qrImage} alt="QR Code" style={{ width: 256, height: 256 }} />
          ) : (
            <Typography>Loading...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default TicketsPage;