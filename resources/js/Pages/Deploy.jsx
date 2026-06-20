import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
    Box, Card, CardContent, Typography, Button, Grid,
    Chip, Divider, Stack, Collapse, IconButton,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import CommitIcon from '@mui/icons-material/Commit';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Layout from '../Components/Layout';

function useElapsed(running) {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        if (!running) { setElapsed(0); return; }
        const t = setInterval(() => setElapsed(s => s + 1), 1000);
        return () => clearInterval(t);
    }, [running]);
    return elapsed;
}

function ElapsedBadge({ running, elapsed }) {
    if (!running && elapsed === 0) return null;
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    return (
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {m}:{s}
        </Typography>
    );
}

function Terminal({ output, running }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
    }, [output]);

    if (!output && !running) return null;

    return (
        <Box
            ref={ref}
            component="pre"
            sx={{
                bgcolor: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: 1,
                p: 2,
                mt: 2,
                fontSize: 11,
                fontFamily: 'monospace',
                overflowX: 'auto',
                maxHeight: 320,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                color: '#e6edf3',
                lineHeight: 1.7,
            }}
        >
            {output || ''}
            {running && <Box component="span" sx={{ display: 'inline-block', animation: 'blink 1s step-end infinite', '@keyframes blink': { '50%': { opacity: 0 } } }}>█</Box>}
        </Box>
    );
}

function ProjectCard({ project, onDeploy, deployState }) {
    const { status, output, id } = deployState ?? {};
    const running  = status === 'running';
    const done     = status === 'success' || status === 'failed';
    const elapsed  = useElapsed(running);

    const borderColor = status === 'success' ? 'success.dark'
                      : status === 'failed'  ? 'error.dark'
                      : 'divider';

    return (
        <Card sx={{ height: '100%', border: '1px solid', borderColor, transition: 'border-color 0.3s' }}>
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={700}>{project.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                            <FolderOpenIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                                {project.path}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, ml: 2 }}>
                        <ElapsedBadge running={running} elapsed={elapsed} />
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={running ? <HourglassTopIcon sx={{ fontSize: 16 }} /> : <RocketLaunchIcon sx={{ fontSize: 16 }} />}
                            onClick={() => onDeploy(project.name)}
                            disabled={running}
                            color={status === 'failed' ? 'error' : 'primary'}
                            sx={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}
                        >
                            {running ? 'Deploying…' : done ? 'Re-deploy' : 'Deploy'}
                        </Button>
                    </Box>
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
                        sx={{ fontSize: 11, bgcolor: 'action.selected', fontFamily: 'monospace', maxWidth: 280 }}
                    />
                </Stack>

                {(running || done) && (
                    <Box sx={{ mt: 2 }}>
                        {done && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                {status === 'success'
                                    ? <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
                                    : <ErrorIcon sx={{ color: 'error.main', fontSize: 18 }} />
                                }
                                <Typography variant="body2" fontWeight={600}
                                    color={status === 'success' ? 'success.main' : 'error.main'}>
                                    {status === 'success' ? 'Deployed successfully' : 'Deployment failed'}
                                </Typography>
                            </Box>
                        )}
                        {running && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Running deploy.sh — output appears below in real time…
                            </Typography>
                        )}
                        <Terminal output={output} running={running} />
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
                    px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 2,
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
                    <IconButton size="small">
                        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                )}
            </Box>
            {log.output && (
                <Collapse in={open}>
                    <Box sx={{ px: 2.5, pb: 2 }}>
                        <Terminal output={log.output} running={false} />
                    </Box>
                </Collapse>
            )}
            {!isLast && <Divider />}
        </>
    );
}

export default function Deploy({ projects, history: initialHistory }) {
    const [deployStates, setDeployStates] = useState({});
    const [confirm, setConfirm]           = useState(null);
    const [history, setHistory]           = useState(initialHistory);
    const pollRefs                        = useRef({});

    const getCsrf = () => {
        return document.querySelector('meta[name="csrf-token"]')?.content
            ?? decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
    };

    const pollStatus = (projectName, id) => {
        if (pollRefs.current[projectName]) clearInterval(pollRefs.current[projectName]);

        pollRefs.current[projectName] = setInterval(async () => {
            try {
                const res  = await fetch(`/deploy/status/${id}?project=${encodeURIComponent(projectName)}`);
                const json = await res.json();

                setDeployStates(prev => ({
                    ...prev,
                    [projectName]: {
                        id,
                        output:  json.output ?? '',
                        status:  json.done ? (json.success ? 'success' : 'failed') : 'running',
                    },
                }));

                if (json.done) {
                    clearInterval(pollRefs.current[projectName]);
                    router.reload({ only: ['history'] });
                }
            } catch {
                clearInterval(pollRefs.current[projectName]);
            }
        }, 2000);
    };

    const runDeploy = async (projectName) => {
        setDeployStates(prev => ({ ...prev, [projectName]: { status: 'running', output: '', id: null } }));

        try {
            const res  = await fetch('/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() },
                body: JSON.stringify({ project_name: projectName }),
            });
            const json = await res.json();

            if (json.error) {
                setDeployStates(prev => ({ ...prev, [projectName]: { status: 'failed', output: json.error } }));
                return;
            }

            setDeployStates(prev => ({ ...prev, [projectName]: { status: 'running', output: '', id: json.id } }));
            pollStatus(projectName, json.id);
        } catch (err) {
            setDeployStates(prev => ({ ...prev, [projectName]: { status: 'failed', output: err.message } }));
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
                <Box sx={{ color: 'text.secondary', mt: 4, textAlign: 'center' }}>
                    <Typography>No deployable projects found.</Typography>
                    <Typography variant="caption">Projects need a <code>.git</code> folder and <code>deploy.sh</code> under <code>/var/www/</code>.</Typography>
                </Box>
            ) : (
                <Grid container spacing={2.5}>
                    {projects.map((p) => (
                        <Grid item xs={12} md={6} key={p.name}>
                            <ProjectCard
                                project={p}
                                deployState={deployStates[p.name]}
                                onDeploy={(name) => setConfirm(name)}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}

            {history.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>Recent Deployments</Typography>
                    <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            {history.map((log, i) => (
                                <HistoryRow key={log.id} log={log} isLast={i === history.length - 1} />
                            ))}
                        </CardContent>
                    </Card>
                </Box>
            )}

            {confirm && (
                <Box
                    onClick={() => setConfirm(null)}
                    sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Card onClick={e => e.stopPropagation()} sx={{ minWidth: 360, borderRadius: 2, p: 1 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Confirm Deployment</Typography>
                            <Typography variant="body2" color="text.secondary">
                                This will run <code>deploy.sh</code> for <strong>{confirm}</strong>.<br />
                                Make sure your latest changes are pushed to GitHub first.
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                                <Button onClick={() => setConfirm(null)} color="inherit">Cancel</Button>
                                <Button
                                    variant="contained"
                                    startIcon={<RocketLaunchIcon />}
                                    onClick={() => { const name = confirm; setConfirm(null); runDeploy(name); }}
                                >
                                    Deploy
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            )}
        </Layout>
    );
}
