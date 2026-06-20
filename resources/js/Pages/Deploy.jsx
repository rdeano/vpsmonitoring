import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Box, Card, CardContent, Typography, Button, Grid,
    Alert, CircularProgress, Chip, Divider,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Stack, IconButton, Tooltip, Collapse,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import CommitIcon from '@mui/icons-material/Commit';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
                mt: 1.5,
                fontSize: 11,
                fontFamily: 'monospace',
                overflowX: 'auto',
                maxHeight: 260,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                color: '#e6edf3',
                lineHeight: 1.6,
            }}
        >
            {output}
        </Box>
    );
}

function ProjectCard({ project, deploying, onDeploy }) {
    const result = deploying?.result;
    const isDeploying = deploying?.active;

    return (
        <Card
            sx={{
                height: '100%',
                border: '1px solid',
                borderColor: result
                    ? result.success ? 'success.dark' : 'error.dark'
                    : 'divider',
                transition: 'border-color 0.3s',
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: 0.3 }}>
                            {project.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                            <FolderOpenIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                                {project.path}
                            </Typography>
                        </Box>
                    </Box>

                    <Button
                        variant="contained"
                        size="small"
                        startIcon={isDeploying
                            ? <CircularProgress size={14} color="inherit" />
                            : <RocketLaunchIcon sx={{ fontSize: 16 }} />
                        }
                        onClick={() => onDeploy(project.name)}
                        disabled={!!deploying?.anyActive}
                        sx={{ ml: 2, flexShrink: 0, fontWeight: 600, fontSize: 13 }}
                    >
                        {isDeploying ? 'Deploying…' : 'Deploy'}
                    </Button>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                        icon={<CallSplitIcon sx={{ fontSize: '14px !important' }} />}
                        label={project.branch}
                        size="small"
                        sx={{ fontSize: 11, bgcolor: 'action.selected', fontFamily: 'monospace' }}
                    />
                    <Chip
                        icon={<CommitIcon sx={{ fontSize: '14px !important' }} />}
                        label={project.commit}
                        size="small"
                        sx={{
                            fontSize: 11,
                            bgcolor: 'action.selected',
                            fontFamily: 'monospace',
                            maxWidth: 280,
                            '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                        }}
                    />
                </Stack>

                {result && (
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {result.success
                                ? <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
                                : <ErrorIcon sx={{ color: 'error.main', fontSize: 18 }} />
                            }
                            <Typography variant="body2" color={result.success ? 'success.main' : 'error.main'} fontWeight={600}>
                                {result.success ? 'Deployed successfully' : 'Deployment failed'}
                            </Typography>
                        </Box>
                        <OutputBox output={result.output} />
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

function HistoryRow({ log, isLast }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Box
                sx={{
                    px: 2.5, py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: log.output ? 'pointer' : 'default',
                    '&:hover': log.output ? { bgcolor: 'action.hover' } : {},
                    transition: 'background 0.15s',
                }}
                onClick={() => log.output && setOpen(o => !o)}
            >
                <Chip
                    label={log.status}
                    size="small"
                    color={log.status === 'success' ? 'success' : 'error'}
                    sx={{ fontWeight: 600, minWidth: 70, justifyContent: 'center' }}
                />
                <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                    {log.project_name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {new Date(log.deployed_at).toLocaleString()}
                </Typography>
                {log.output && (
                    <IconButton size="small" sx={{ ml: 0.5 }}>
                        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                )}
            </Box>
            {log.output && (
                <Collapse in={open}>
                    <Box sx={{ px: 2.5, pb: 2 }}>
                        <OutputBox output={log.output} />
                    </Box>
                </Collapse>
            )}
            {!isLast && <Divider />}
        </>
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
            setResults(prev => ({ ...prev, [projectName]: json }));
            router.reload({ only: ['history'] });
        } catch (err) {
            setResults(prev => ({
                ...prev,
                [projectName]: { success: false, output: err.message },
            }));
        } finally {
            setDeploying(null);
        }
    };

    return (
        <Layout currentPath="/deploy">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>Deploy</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                        {projects.length} project{projects.length !== 1 ? 's' : ''} detected on this server
                    </Typography>
                </Box>
            </Box>

            {projects.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No deployable projects found. Projects need a <code>.git</code> folder and a <code>deploy.sh</code> file under <code>/var/www/</code>.
                </Alert>
            ) : (
                <Grid container spacing={2.5}>
                    {projects.map((p) => (
                        <Grid item xs={12} md={6} key={p.name}>
                            <ProjectCard
                                project={p}
                                deploying={{
                                    active: deploying === p.name,
                                    anyActive: !!deploying,
                                    result: results[p.name],
                                }}
                                onDeploy={(name) => setConfirm(name)}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}

            {history.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
                        Recent Deployments
                    </Typography>
                    <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            {history.map((log, i) => (
                                <HistoryRow key={log.id} log={log} isLast={i === history.length - 1} />
                            ))}
                        </CardContent>
                    </Card>
                </Box>
            )}

            <Dialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 360 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deployment</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will run <code>deploy.sh</code> for <strong>{confirm}</strong> on the server.
                        Make sure your latest changes are pushed to GitHub first.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirm(null)} color="inherit">Cancel</Button>
                    <Button
                        variant="contained"
                        startIcon={<RocketLaunchIcon />}
                        onClick={() => { const name = confirm; setConfirm(null); runDeploy(name); }}
                    >
                        Deploy
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}
