import { useForm } from '@inertiajs/react';
import {
    Box, Card, CardContent, TextField, Button,
    Typography, Alert, CircularProgress,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
            }}
        >
            <Card sx={{ width: 360, p: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <LockIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                        <Typography variant="h5" fontWeight={700}>VPS Dashboard</Typography>
                        <Typography variant="body2" color="text.secondary">Sign in to continue</Typography>
                    </Box>

                    {errors.username && (
                        <Alert severity="error" sx={{ mb: 2 }}>{errors.username}</Alert>
                    )}

                    <form onSubmit={submit}>
                        <TextField
                            label="Username"
                            fullWidth
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value)}
                            sx={{ mb: 2 }}
                            autoFocus
                        />
                        <TextField
                            label="Password"
                            type="password"
                            fullWidth
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            sx={{ mb: 3 }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={processing}
                        >
                            {processing ? <CircularProgress size={24} /> : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
}
