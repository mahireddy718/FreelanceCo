import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const LAST_SEEN_KEY = 'lastSeenProjectTime';

export function useProjectNotifications() {
    const [notificationCount, setNotificationCount] = useState(0);
    const [recentProjects, setRecentProjects] = useState([]);
    const [newProjectIds, setNewProjectIds] = useState([]);

    useEffect(() => {
        fetchProjects();

        // Poll for new projects every 30 seconds
        const interval = setInterval(fetchProjects, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchProjects = async () => {
        try {
            // Get the last time user checked notifications
            const lastSeenTime = localStorage.getItem(LAST_SEEN_KEY);

            // Always fetch the last 10 projects
            const response = await axios.get(`${API_BASE_URL}/api/projects?status=open&limit=10`);
            const projects = response.data.projects || [];

            setRecentProjects(projects);

            if (lastSeenTime) {
                // Find projects created after last seen time
                const unseenProjects = projects.filter(project =>
                    new Date(project.createdAt) > new Date(lastSeenTime)
                );
                const unseenIds = unseenProjects.map(p => p._id);
                setNewProjectIds(unseenIds);
                setNotificationCount(unseenProjects.length);
            } else {
                // First time - set initial timestamp but don't show count
                const now = new Date().toISOString();
                localStorage.setItem(LAST_SEEN_KEY, now);
                setNotificationCount(0);
                setNewProjectIds([]);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const markAsSeen = () => {
        const now = new Date().toISOString();
        localStorage.setItem(LAST_SEEN_KEY, now);
        setNotificationCount(0);
        setNewProjectIds([]);
    };

    return {
        notificationCount,
        recentProjects,
        newProjectIds,
        markAsSeen,
        refreshNotifications: fetchProjects
    };
}
