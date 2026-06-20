import { useState, useEffect, useCallback } from 'react';
import {
    Box, Card, CardContent, Typography, Button, Grid,
    Chip, CircularProgress, Alert, ButtonGroup,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Layout from '../Components/Layout';

function getCsrf() {
    return decodeURIComponent(
        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
    );
}

export default function Services({ services }) {
    const [statuses, setStatuses]   = useState({});
    const [loading, setLoading]     = useState({});
    const [feedback, setFeedback]   = useState({});
    const [confirm, setConfirm]     = useState(null);

    const fetchStatus = useCallback(async (unit) => {
        try {
            const res  = await fetch(`/api/services/${encodeURIComponent(unit)}/status`);
            const json = await res.json();
            setStatuses((prev) => ({ ...prev, [unit]: json.success ? json.status : 'unknown' }));
        } catch {
            setStatuses((prev) => ({ ...prev, [unit]: 'unknown' }));
        }
    }, []);

    useEffect(() => {
        services.forEach((s) => fetchStatus(s.unit));
    }, [services, fetchStatus]);

    const control = async (action, unit) => {
        setLoading((prev) => ({ ...prev, [unit]: action }));
        try {
            const res = await fetch('/services/control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({ action, unit }),
            });
            const json = await res.json();
            setFeedback((prev) => ({
                ...prev,
                [unit]: { success: json.success, message: json.output ?? json.error },
            }));
            await fetchStatus(unit);
        } catch (err) {
            setFeedback((prev) => ({ ...prev, [unit]: { success: false, message: err.message } }));
        } finally {
            setLoading((prev) => ({ ...prev, [unit]: null }));
        }
    };

    return (
        <Layout currentPath="/services">
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Services</Typography>

            <Grid container spacing={3}>
                {services.map((s) => {
                    const status = statuses[s.unit];
                    const busy   = loading[s.unit];
                    const fb     = feedback[s.unit];

                    return (
                        <Grid item xs={12} sm={6} key={s.unit}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" fontWeight={600}>{s.name}</Typography>
                                        <Chip
                                            label={status ?? 'loading…'}
                                            size="small"
                                            color={status === 'running' ? 'success' : status === 'stopped' ? 'error' : 'default'}
                                        />
                                    </Box>

                                    <ButtonGroup size="small" disabled={!!busy}>
                                        <Button
                                            startIcon={busy === 'start' ? <CircularProgress size={14} /> : <PlayArrowIcon />}
                                            onClick={() => control('start', s.unit)}
                                        >
                                            Start
                                        </Button>
                                        <Button
                                            startIcon={busy === 'stop' ? <CircularProgress size={14} /> : <StopIcon />}
                                            onClick={() => setConfirm({ action: 'stop', unit: s.unit, name: s.name })}
                                        >
                                            Stop
                                        </Button>
                                        <Button
                                            startIcon={busy === 'restart' ? <CircularProgress size={14} /> : <RestartAltIcon />}
                                            onClick={() => setConfirm({ action: 'restart', unit: s.unit, name: s.name })}
                                        >
                                            Restart
                                        </Button>
                                    </ButtonGroup>

                                    {fb && (
                                        <Alert severity={fb.success ? 'success' : 'error'} sx={{ mt: 2 }}>
                                            {fb.message || (fb.success ? 'Done' : 'Failed')}
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            <Dialog open={!!confirm} onClose={() => setConfirm(null)}>
                <DialogTitle>Confirm {confirm?.action}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to <strong>{confirm?.action}</strong> <strong>{confirm?.name}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirm(null)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color={confirm?.action === 'stop' ? 'error' : 'primary'}
                        onClick={() => {
                            const { action, unit } = confirm;
                            setConfirm(null);
                            control(action, unit);
                        }}
                    >
                        {confirm?.action}
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}
