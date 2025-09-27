import React, { useState } from 'react';
import { Button, TextField, Paper, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api, { getCsrfCookie } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

 
  const { setUser } = useAuth(); // instead of login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await getCsrfCookie();
      const res = await api.post('/login', form);
      
       if (res.data.success) {
         // Store both user data and token
         const userData = {
           ...res.data.user,
           token: res.data.token
         };
         localStorage.setItem('user', JSON.stringify(userData));
         setUser(userData);
         if (userData.status === 'superadmin') {
           navigate('/museums');
         } else {
           navigate('/rooms');
         }
       }
     } catch (error) {
       setError(error.response?.data?.message || 'Login failed');
     }
   };


  return (
    <Paper style={{ maxWidth: 400, margin: '100px auto', padding: 32 }}>
      <Typography variant="h5" gutterBottom>Login</Typography>
      {error && <Alert severity="error" style={{ marginBottom: 16 }}>{error}</Alert>}
      <form onSubmit={handleLogin}>
        <TextField label="Email" name="email" type="email" required fullWidth margin="normal" value={form.email} onChange={handleChange} />
        <TextField label="Password" name="password" type="password" required fullWidth margin="normal" value={form.password} onChange={handleChange} />
        <Button type="submit" variant="contained" color="primary" fullWidth>Login</Button>
        <Button color="secondary" fullWidth style={{ marginTop: 8 }} onClick={() => navigate('/signup')}>Sign Up</Button>
      </form>
    </Paper>
  );
}

export default Login;