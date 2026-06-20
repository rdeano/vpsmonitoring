import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    AppBar, Box, Drawer, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, Toolbar, Typography, IconButton,
} from '@mui/material';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import ArticleIcon from '@mui/icons-material/Article';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';

const DRAWER_WIDTH = 220;

const navItems = [
    { label: 'Dashboard', icon: <MonitorHeartIcon />, href: '/' },
    { label: 'Deploy',    icon: <RocketLaunchIcon />, href: '/deploy' },
    { label: 'Services',  icon: <MiscellaneousServicesIcon />, href: '/services' },
    { label: 'Logs',      icon: <ArticleIcon />, href: '/logs' },
];

export default function Layout({ children, currentPath }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const navigate = (href) => {
        router.visit(href);
        setMobileOpen(false);
    };

    const logout = () => router.post('/logout');

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Toolbar>
                <Typography variant="h6" fontWeight={700} color="primary">
                    VPS Dashboard
                </Typography>
            </Toolbar>
            <List sx={{ flex: 1 }}>
                {navItems.map((item) => (
                    <ListItem key={item.label} disablePadding>
                        <ListItemButton
                            selected={currentPath === item.href}
                            onClick={() => navigate(item.href)}
                            sx={{ borderRadius: 1, mx: 1 }}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={logout} sx={{ borderRadius: 1, mx: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}><LogoutIcon /></ListItemIcon>
                        <ListItemText primary="Logout" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{ display: { sm: 'none' }, zIndex: (t) => t.zIndex.drawer + 1 }}
            >
                <Toolbar>
                    <IconButton color="inherit" onClick={() => setMobileOpen(!mobileOpen)}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" fontWeight={700} sx={{ ml: 1 }}>
                        VPS Dashboard
                    </Typography>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
            >
                {drawerContent}
            </Drawer>

            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
                }}
                open
            >
                {drawerContent}
            </Drawer>

            <Box component="main" sx={{ flex: 1, p: 3, mt: { xs: 8, sm: 0 } }}>
                {children}
            </Box>
        </Box>
    );
}
