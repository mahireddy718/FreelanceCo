import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
} from './command';
import { Dialog, DialogContent } from './dialog';
import {
    SearchIcon,
    HomeIcon,
    BriefcaseIcon,
    UsersIcon,
    PlusCircleIcon,
    FolderIcon,
    MessageSquareIcon,
    SettingsIcon,
    HelpCircleIcon,
    LogInIcon,
    UserPlusIcon
} from 'lucide-react';

export default function SearchCommand() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    // Toggle command palette with Cmd+K / Ctrl+K
    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const handleSelect = (path) => {
        setOpen(false);
        navigate(path);
    };

    // Determine which items to show based on role
    const isClient = user?.role === 'client' || user?.role === 'both';
    const isFreelancer = user?.role === 'freelancer' || user?.role === 'both';

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(true)}
                className="dark:bg-black fixed bottom-8 right-8 flex items-center gap-2 px-4 py-2 outline outline-1 outline-gray-200 rounded-full shadow-lg hover:bg-gray-200 transition-all z-50 bg-white cursor-pointer"
                title="Search (⌘K)"
            >
                <SearchIcon className="w-5 h-5 text-gray-600 font-light dark:text-white" />
                <span className="text-gray-500 text-sm font-light dark:text-white">Search (⌘K)</span>
            </button>


            {/* Command Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 max-w-2xl bg-white dark:bg-black" showCloseButton={false}>
                    <Command className="rounded-lg border-none bg-white dark:bg-black">
                        <CommandInput placeholder="Search for pages, features..." />
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>

                            <CommandGroup heading="Navigation">
                                <CommandItem onSelect={() => handleSelect('/')}>
                                    <HomeIcon className="mr-2 h-4 w-4" />
                                    <span>Home</span>
                                </CommandItem>

                                {/* Browse Projects - Only for freelancers */}
                                {isFreelancer && (
                                    <CommandItem onSelect={() => handleSelect('/projects')}>
                                        <BriefcaseIcon className="mr-2 h-4 w-4" />
                                        <span>Browse Projects</span>
                                    </CommandItem>
                                )}

                                {/* Find Freelancers - Only for clients */}
                                {isClient && (
                                    <CommandItem onSelect={() => handleSelect('/freelancers')}>
                                        <UsersIcon className="mr-2 h-4 w-4" />
                                        <span>Find Freelancers</span>
                                    </CommandItem>
                                )}
                            </CommandGroup>

                            {isAuthenticated ? (
                                <>
                                    <CommandSeparator />

                                    <CommandGroup heading="Actions">
                                        {/* Post Project - Only for clients */}
                                        {isClient && (
                                            <CommandItem onSelect={() => handleSelect('/post-project')}>
                                                <PlusCircleIcon className="mr-2 h-4 w-4" />
                                                <span>Post a Project</span>
                                            </CommandItem>
                                        )}

                                        {/* My Projects - Only for clients */}
                                        {isClient && (
                                            <CommandItem onSelect={() => handleSelect('/my-projects')}>
                                                <FolderIcon className="mr-2 h-4 w-4" />
                                                <span>My Projects</span>
                                            </CommandItem>
                                        )}

                                        {/* Messages - For all authenticated users */}
                                        <CommandItem onSelect={() => handleSelect('/messages')}>
                                            <MessageSquareIcon className="mr-2 h-4 w-4" />
                                            <span>Messages</span>
                                        </CommandItem>
                                    </CommandGroup>

                                    <CommandSeparator />

                                    <CommandGroup heading="Account">
                                        <CommandItem onSelect={() => handleSelect('/dashboard')}>
                                            <BriefcaseIcon className="mr-2 h-4 w-4" />
                                            <span>Dashboard</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => handleSelect('/settings')}>
                                            <SettingsIcon className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => handleSelect('/support')}>
                                            <HelpCircleIcon className="mr-2 h-4 w-4" />
                                            <span>Support</span>
                                        </CommandItem>
                                    </CommandGroup>
                                </>
                            ) : (
                                <>
                                    <CommandSeparator />

                                    <CommandGroup heading="Get Started">
                                        <CommandItem onSelect={() => handleSelect('/login')}>
                                            <LogInIcon className="mr-2 h-4 w-4" />
                                            <span>Login</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => handleSelect('/signup')}>
                                            <UserPlusIcon className="mr-2 h-4 w-4" />
                                            <span>Sign Up</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => handleSelect('/support')}>
                                            <HelpCircleIcon className="mr-2 h-4 w-4" />
                                            <span>Support</span>
                                        </CommandItem>
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </DialogContent>
            </Dialog>
        </>
    );
}
