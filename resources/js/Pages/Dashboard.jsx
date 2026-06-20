import { useState, useEffect, useCallback } from 'react';
import {
    Box, Grid, Card, CardContent, Typography, LinearProgress,
    Chip, CircularProgress, Alert, Tooltip,
} from '@mui/material';
import Layout from '../Components/Layout';

const THRESHOLDS = {
    cpu:    { warning: 80, critical: 90 },
    memory: { warning: 75, critical: 90 },
    disk:   { warning: 85, critical: 95 },
};

function statusColor(value, key) {
    const t = THRESHOLDS[key];
    if (value >= t.critical) return 'error';
    if (value >= t.warning)  return 'warning';
    return 'success';
}

function MetricCard({ label, value, unit = '%' }) {
    const color = statusColor(value, label.toLowerCase());
    const colorMap = { success: '#4caf50', warning: '#ff9800', error: '#f44336' };

    return (
        <Card>
            <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
                    <Typography variant="h4" fontWeight={700} color={colorMap[color]}>
                        {value !== null ? value.toFixed(1) : '--'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">{unit}</Typography>
                </Box>
                <LinearProgress
                    variant={value !== null ? 'determinate' : 'indeterminate'}
                    value={value ?? 0}
                    color={color}
                    sx={{ height: 6, borderRadius: 3 }}
                />
            </CardContent>
        </Card>
    );
}

export default function Dashboard() {
    const [stats, setStats]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);

    const fetchStats = useCallback(async () => {
        try {
            const res  = await fetch('/api/health');
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            setStats(json.data);
            setError(null);
            setLastRefresh(new Date());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30_000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    return (
        <Layout currentPath="/">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>Server Health</Typography>
                {lastRefresh && (
                    <Tooltip title="Auto-refreshes every 30s">
                        <Chip
                            label={`Updated ${lastRefresh.toLocaleTimeString()}`}
                            size="small"
                            variant="outlined"
                        />
                    </Tooltip>
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading && !stats ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard label="CPU" value={stats?.cpu ?? null} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard label="Memory" value={stats?.memory ?? null} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard label="Disk" value={stats?.disk ?? null} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Uptime
                                </Typography>
                                <Typography variant="h6" fontWeight={600} color="#4caf50">
                                    {stats?.uptime ?? '--'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Layout>
    );
}
