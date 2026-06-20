import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Box, Card, CardContent, Typography, Button, Grid,
    Alert, CircularProgress, Chip, Divider,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import Layout from '../Components/Layout';

function OutputBox({ output }) {
    if (!output) return null;
    return (
        <Box
            component="pre"
            sx={{
                bgcolor: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: 1,
                p: 2,
                mt: 2,
                fontSize: 12,
                fontFamily: 'monospace',
                overflowX: 'auto',
                maxHeight: 300,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
            }}
        >
            {output}
        </Box>
    );
}

export default function Deploy({ projects, history }) {
    const [deploying, setDeploying] = useState(null);
    const [results, setResults]     = useState({});
    const [confirm, setConfirm]     = useState(null);

    const runDeploy = async (projectName) => {
        setDeploying(projectName);
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.content
                ?? document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];

            const res = await fetch('/deploy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(csrf ?? ''),
                },
                body: JSON.stringify({ project_name: projectName }),
            });
            const json = await res.json();
            setResults((prev) => ({ ...prev, [projectName]: json }));
            router.reload({ only: ['history'] });
        } catch (err) {
            setResults((prev) => ({
                ...prev,
                [projectName]: { success: false, output: err.message },
            }));
        } finally {
            setDeploying(null);
        }
    };

    return (
        <Layout currentPath="/deploy">
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Deploy</Typography>

            <Grid container spacing={3}>
                {projects.map((p) => (
                    <Grid item xs={12} md={6} key={p.name}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight={600}>{p.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{p.path}</Typography>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        startIcon={deploying === p.name ? <CircularProgress size={16} color="inherit" /> : <RocketLaunchIcon />}
                                        onClick={() => setConfirm(p.name)}
                                        disabled={!!deploying}
                                    >
                                        Deploy
                                    </Button>
                                </Box>

                                {results[p.name] && (
                                    <Alert
                                        severity={results[p.name].success ? 'success' : 'error'}
                                        sx={{ mt: 2 }}
                                    >
                                        {results[p.name].success ? 'Deployed successfully' : 'Deployment failed'}
                                    </Alert>
                                )}
                                <OutputBox output={results[p.name]?.output} />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {history.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Recent Deployments</Typography>
                    <Card>
                        <CardContent sx={{ p: 0 }}>
                            {history.map((log, i) => (
                                <Box key={log.id}>
                                    <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Chip
                                            label={log.status}
                                            size="small"
                                            color={log.status === 'success' ? 'success' : 'error'}
                                        />
                                        <Typography variant="body2" fontWeight={600}>{log.project_name}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                            {new Date(log.deployed_at).toLocaleString()}
                                        </Typography>
                                    </Box>
                                    {i < history.length - 1 && <Divider />}
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Box>
            )}

            <Dialog open={!!confirm} onClose={() => setConfirm(null)}>
                <DialogTitle>Confirm Deployment</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Deploy <strong>{confirm}</strong>? This will run its <code>deploy.sh</code> script on the server.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirm(null)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => { const name = confirm; setConfirm(null); runDeploy(name); }}
                    >
                        Deploy
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}
