import { useState, useEffect, useCallback } from 'react';
import {
    Box, Grid, Card, CardContent, Typography, LinearProgress,
    Chip, CircularProgress, Alert, Tooltip, IconButton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Layout from '../Components/Layout';

const THRESHOLDS = {
    cpu:    { warning: 80, critical: 90 },
    memory: { warning: 75, critical: 90 },
    disk:   { warning: 85, critical: 95 },
};

function getStatus(value, key) {
    const t = THRESHOLDS[key];
    if (value >= t.critical) return 'critical';
    if (value >= t.warning)  return 'warning';
    return 'healthy';
}

const STATUS_COLOR = {
    healthy:  { text: '#4ade80', bar: 'success',  bg: 'rgba(74,222,128,0.08)' },
    warning:  { text: '#fb923c', bar: 'warning',  bg: 'rgba(251,146,60,0.08)' },
    critical: { text: '#f87171', bar: 'error',    bg: 'rgba(248,113,113,0.08)' },
};

const STATUS_LABEL = {
    healthy:  'Healthy',
    warning:  'Warning',
    critical: 'Critical',
};

function MetricCard({ label, value, icon, metricKey }) {
    const status  = value !== null ? getStatus(value, metricKey) : 'healthy';
    const colors  = STATUS_COLOR[status];

    return (
        <Card
            sx={{
                height: '100%',
                border: '1px solid',
                borderColor: value !== null ? colors.text + '40' : 'divider',
                transition: 'border-color 0.4s',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    position: 'absolute', inset: 0,
                    background: value !== null ? colors.bg : 'transparent',
                    transition: 'background 0.4s',
                    pointerEvents: 'none',
                }}
            />
            <CardContent sx={{ position: 'relative', p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: value !== null ? colors.text : 'text.disabled' }}>
                            {icon}
                        </Box>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            {label}
                        </Typography>
                    </Box>
                    {value !== null && (
                        <Chip
                            label={STATUS_LABEL[status]}
                            size="small"
                            sx={{
                                fontSize: 10,
                                fontWeight: 700,
                                height: 20,
                                bgcolor: colors.text + '22',
                                color: colors.text,
                            }}
                        />
                    )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 2 }}>
                    <Typography
                        variant="h3"
                        fontWeight={800}
                        sx={{ color: value !== null ? colors.text : 'text.disabled', lineHeight: 1 }}
                    >
                        {value !== null ? value.toFixed(1) : '--'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">%</Typography>
                </Box>

                <LinearProgress
                    variant={value !== null ? 'determinate' : 'indeterminate'}
                    value={Math.min(value ?? 0, 100)}
                    color={STATUS_COLOR[status].bar}
                    sx={{ height: 5, borderRadius: 3, bgcolor: 'action.disabledBackground' }}
                />

                {value !== null && (
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.8, display: 'block' }}>
                        {(100 - value).toFixed(1)}% available
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

function UptimeCard({ uptime }) {
    return (
        <Card sx={{ height: '100%', border: '1px solid', borderColor: 'rgba(74,222,128,0.25)' }}>
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AccessTimeIcon sx={{ fontSize: 18, color: '#4ade80' }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>Uptime</Typography>
                </Box>
                <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ color: '#4ade80', lineHeight: 1.3, minHeight: 32 }}
                >
                    {uptime ?? '--'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 1.5 }}>
                    <FiberManualRecordIcon sx={{ fontSize: 10, color: '#4ade80' }} />
                    <Typography variant="caption" color="text.disabled">Server is online</Typography>
                </Box>
            </CardContent>
        </Card>
    );
}

export default function Dashboard() {
    const [stats, setStats]         = useState(null);
    const [loading, setLoading]     = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError]         = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);

    const fetchStats = useCallback(async (manual = false) => {
        if (manual) setRefreshing(true);
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
            setRefreshing(false);
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
                <Box>
                    <Typography variant="h5" fontWeight={700}>Server Health</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                        Auto-refreshes every 30 seconds
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {lastRefresh && (
                        <Tooltip title="Last updated">
                            <Chip
                                label={lastRefresh.toLocaleTimeString()}
                                size="small"
                                variant="outlined"
                                sx={{ fontFamily: 'monospace', fontSize: 11 }}
                            />
                        </Tooltip>
                    )}
                    <Tooltip title="Refresh now">
                        <IconButton size="small" onClick={() => fetchStats(true)} disabled={refreshing}>
                            <RefreshIcon
                                fontSize="small"
                                sx={{ transition: 'transform 0.4s', transform: refreshing ? 'rotate(180deg)' : 'none' }}
                            />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {loading && !stats ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10, gap: 2 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="text.secondary">Fetching server stats…</Typography>
                </Box>
            ) : (
                <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard
                            label="CPU Usage"
                            value={stats?.cpu ?? null}
                            metricKey="cpu"
                            icon={<SpeedIcon sx={{ fontSize: 18 }} />}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard
                            label="Memory"
                            value={stats?.memory ?? null}
                            metricKey="memory"
                            icon={<MemoryIcon sx={{ fontSize: 18 }} />}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard
                            label="Disk"
                            value={stats?.disk ?? null}
                            metricKey="disk"
                            icon={<StorageIcon sx={{ fontSize: 18 }} />}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <UptimeCard uptime={stats?.uptime} />
                    </Grid>
                </Grid>
            )}
        </Layout>
    );
}
