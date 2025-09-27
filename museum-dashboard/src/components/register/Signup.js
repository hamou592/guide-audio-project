

import React, { useState } from 'react';
import { Button, TextField, Paper, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api, { getCsrfCookie } from '../../api';

function Signup() {
  const [form, setForm] = useState({ 
    name: '', email: '', password: '', password_confirmation: '',
    museum_title: '', museum_description: '', museum_photo: null
  });
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value, files } = e.target;
    if (name === 'museum_photo') {
      setForm({ ...form, museum_photo: files[0] });
      setPhotoPreview(URL.createObjectURL(files[0]));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await getCsrfCookie();

      // 1. Upload museum photo if present
      let photoFilename = '';
      if (form.museum_photo) {
        const photoData = new FormData();
        photoData.append('photo', form.museum_photo);
        const photoRes = await api.post('/register/upload-photo', photoData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (photoRes.data.success) {
                photoFilename = photoRes.data.filename;
            } else {
                throw new Error('Failed to upload photo');
            }
      }

      // 2. Register user and create museum in one request
      const res = await api.post('/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        museum_title: form.museum_title,
        museum_description: form.museum_description,
        museum_photo: photoFilename
      });

      if (res.data.success) {
  const userData = {
    ...res.data.user,
    token: res.data.token
  };
  localStorage.setItem('user', JSON.stringify(userData));
  // Set token in Axios for future requests
  api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
  if (userData.status === 'superadmin') navigate('/museums');
  else navigate('/rooms');
} else {
  setError(res.data.message || 'Registration failed');
}
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Paper style={{ maxWidth: 400, margin: '100px auto', padding: 32 }}>
      <Typography variant="h5" gutterBottom>Sign Up</Typography>
      {error && <Alert severity="error" style={{ marginBottom: 16 }}>{error}</Alert>}
      <form onSubmit={handleSignup}>
        <TextField label="Name" name="name" required fullWidth margin="normal" value={form.name} onChange={handleChange} />
        <TextField label="Email" name="email" type="email" required fullWidth margin="normal" value={form.email} onChange={handleChange} />
        <TextField label="Password" name="password" type="password" required fullWidth margin="normal" value={form.password} onChange={handleChange} />
        <TextField label="Confirm Password" name="password_confirmation" type="password" required fullWidth margin="normal" value={form.password_confirmation} onChange={handleChange} />
        <TextField label="Museum Name" name="museum_title" required fullWidth margin="normal" value={form.museum_title} onChange={handleChange} />
        <TextField label="Museum Description" name="museum_description" fullWidth margin="normal" value={form.museum_description} onChange={handleChange} />
        <Button variant="contained" component="label" fullWidth style={{ marginTop: 8 }}>
          Upload Museum Photo
          <input type="file" name="museum_photo" accept="image/*" hidden onChange={handleChange} />
        </Button>
        {photoPreview && <img src={photoPreview} alt="Preview" style={{ width: '100%', marginTop: 8 }} />}
        <Button type="submit" variant="contained" color="primary" fullWidth style={{ marginTop: 16 }}>Sign Up</Button>
        <Button color="secondary" fullWidth style={{ marginTop: 8 }} onClick={() => navigate('/login')}>Back to Login</Button>
      </form>
    </Paper>
  );
}

export default Signup;