import { useState, useEffect, useRef } from 'react';
import {
    Box, Card, CardContent, Typography, Button, Select,
    MenuItem, FormControl, InputLabel, TextField, Switch,
    FormControlLabel, CircularProgress, Alert, Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import Layout from '../Components/Layout';

function getCsrf() {
    return decodeURIComponent(
        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
    );
}

export default function Logs({ logFiles }) {
    const [selected, setSelected]   = useState(logFiles[0]?.path ?? '');
    const [lines, setLines]         = useState(100);
    const [content, setContent]     = useState('');
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [search, setSearch]       = useState('');
    const intervalRef               = useRef(null);
    const outputRef                 = useRef(null);

    const fetchLog = async () => {
        if (!selected) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/logs/fetch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({ path: selected, lines }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            setContent(json.content);
            setTimeout(() => {
                outputRef.current?.scrollTo(0, outputRef.current.scrollHeight);
            }, 50);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLog();
    }, [selected]);

    useEffect(() => {
        if (autoRefresh) {
            intervalRef.current = setInterval(fetchLog, 5000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [autoRefresh, selected, lines]);

    const filteredContent = search
        ? content.split('\n').filter((l) => l.toLowerCase().includes(search.toLowerCase())).join('\n')
        : content;

    return (
        <Layout currentPath="/logs">
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Log Viewer</Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Log file</InputLabel>
                            <Select
                                label="Log file"
                                value={selected}
                                onChange={(e) => setSelected(e.target.value)}
                            >
                                {logFiles.map((f) => (
                                    <MenuItem key={f.path} value={f.path}>{f.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Lines"
                            type="number"
                            size="small"
                            value={lines}
                            onChange={(e) => setLines(Number(e.target.value))}
                            inputProps={{ min: 10, max: 1000 }}
                            sx={{ width: 100 }}
                        />

                        <TextField
                            label="Filter"
                            size="small"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search…"
                            sx={{ flex: 1, minWidth: 150 }}
                        />

                        <Button
                            variant="outlined"
                            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                            onClick={fetchLog}
                            disabled={loading}
                        >
                            Refresh
                        </Button>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    size="small"
                                />
                            }
                            label="Auto"
                        />
                    </Box>
                </CardContent>
            </Card>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box
                ref={outputRef}
                component="pre"
                sx={{
                    bgcolor: 'background.paper',
                    border: '1px solid #30363d',
                    borderRadius: 1,
                    p: 2,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    color: '#e6edf3',
                    minHeight: 200,
                }}
            >
                {filteredContent || (loading ? 'Loading…' : 'No content')}
            </Box>
        </Layout>
    );
}
