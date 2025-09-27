import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#FF8042', '#00C49F', '#FFBB28'];

function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    ticketsStatus: [],
    ticketsByDate: [],
    roomsCount: 0,
    objectsCount: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/dashboard'); // backend analytics endpoint
        const payload = res.data;

        setData({
          ticketsStatus: payload.ticketsStatus,     // e.g. [{ status: 'active', count: 12 }, ...]
          ticketsByDate: payload.ticketsByDate,     // e.g. [{ date: '2025-07-01', count: 5 }, ...]
          roomsCount: payload.roomsCount,
          objectsCount: payload.objectsCount,
        });
      } catch (err) {
        console.error(err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return <Box textAlign="center" mt={4}><CircularProgress /></Box>;
  }
  if (error) {
    return <Typography color="error" align="center" mt={4}>{error}</Typography>;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Analytics Dashboard</Typography>

      <Grid container spacing={4}>
        {/* Ticket Status Pie */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6">Tickets by Status</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.ticketsStatus}
                dataKey="count"
                nameKey="status"
                outerRadius={100}
                label
              >
                {data.ticketsStatus.map((entry, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Grid>

        {/* Tickets per Date Bar Chart */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6">Tickets Created (per Date)</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.ticketsByDate}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#1976D2" />
            </BarChart>
          </ResponsiveContainer>
        </Grid>

        {/* Rooms and Objects Summary */}
        <Grid item xs={12} md={6}>
          <Box p={2} border="1px solid #ccc" borderRadius={2}>
            <Typography variant="h6">Total Rooms</Typography>
            <Typography variant="h3">{data.roomsCount}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box p={2} border="1px solid #ccc" borderRadius={2}>
            <Typography variant="h6">Total Objects</Typography>
            <Typography variant="h3">{data.objectsCount}</Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AnalyticsPage;
