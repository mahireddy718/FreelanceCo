import { useState, useRef, useEffect } from 'react';
import { HiX } from 'react-icons/hi';

// Comprehensive skills list
const AVAILABLE_SKILLS = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
    'Swift', 'Kotlin', 'Dart', 'Scala', 'R', 'MATLAB', 'Perl', 'Shell Scripting', 'C',

    // Web Development - Frontend
    'HTML', 'CSS', 'React', 'Vue.js', 'Angular', 'Svelte', 'jQuery', 'Next.js', 'Nuxt.js',
    'Gatsby', 'Sass', 'LESS', 'Tailwind CSS', 'Bootstrap', 'Material-UI', 'Ant Design',
    'Webpack', 'Vite', 'Redux', 'MobX', 'RxJS',

    // Web Development - Backend
    'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Laravel',
    'Ruby on Rails', 'NestJS', 'Koa', 'Hapi', 'Fastify',

    // Mobile Development
    'React Native', 'Flutter', 'iOS Development', 'Android Development', 'Xamarin',
    'Ionic', 'SwiftUI', 'Jetpack Compose', 'Cordova',

    // Databases & Data Storage
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'SQL', 'NoSQL', 'SQLite',
    'Oracle', 'Microsoft SQL Server', 'MariaDB', 'Cassandra', 'DynamoDB', 'Elasticsearch',
    'Neo4j', 'CouchDB',

    // API & Integration
    'REST API', 'GraphQL', 'gRPC', 'WebSockets', 'API Development', 'Microservices',
    'SOAP', 'JSON', 'XML',

    // Cloud & DevOps
    'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Git',
    'GitHub Actions', 'GitLab CI', 'Terraform', 'Ansible', 'Linux', 'Nginx', 'Apache',
    'Heroku', 'Netlify', 'Vercel', 'DigitalOcean','Maven',

    // Design & Creative
    'UI/UX Design', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Sketch', 'InVision',
    'Prototyping', 'Wireframing', 'User Research', 'Graphic Design', 'Logo Design',
    'Branding', 'Adobe After Effects', 'Premiere Pro', 'Blender', '3D Modeling','Cap Cut',

    // AI/ML & Data Science
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras', 'scikit-learn',
    'Data Science', 'Data Analysis', 'Pandas', 'NumPy', 'Jupyter', 'AI Development',
    'Computer Vision', 'NLP', 'Neural Networks', 'OpenCV',

    // Blockchain & Web3
    'Blockchain', 'Solidity', 'Web3', 'Ethereum', 'Smart Contracts', 'Cryptocurrency',
    'NFT Development', 'DeFi',

    // CMS & E-commerce
    'WordPress', 'Shopify', 'WooCommerce', 'Magento', 'Drupal', 'Joomla', 'Contentful',
    'Strapi', 'Sanity',

    // Testing & Quality Assurance
    'Unit Testing', 'Integration Testing', 'Jest', 'Mocha', 'Cypress', 'Selenium',
    'Playwright', 'Test Automation', 'QA Testing', 'Performance Testing',

    // Marketing & SEO
    'SEO', 'SEM', 'Google Analytics', 'Google Ads', 'Facebook Ads', 'Content Marketing',
    'Email Marketing', 'Social Media Marketing', 'Copywriting', 'Content Writing',
    'Technical Writing', 'Digital Marketing',

    // Project Management & Soft Skills
    'Project Management', 'Agile', 'Scrum', 'Kanban', 'Jira', 'Trello', 'Asana',
    'Team Leadership', 'Communication', 'Problem Solving', 'Time Management',
    'Client Management', 'Requirements Analysis',

    // Other Technologies
    'Cybersecurity', 'Penetration Testing', 'Network Security', 'Game Development',
    'Unity', 'Unreal Engine', 'IoT', 'Embedded Systems', 'Arduino', 'Raspberry Pi',
    'Virtual Reality', 'Augmented Reality', 'Video Editing', 'Audio Production'
].sort(); // Sort alphabetically for easier searching

export default function SkillsAutocompleteInput({
    selectedSkills = [],
    onChange,
    placeholder = "Type to search skills...",
    maxSkills = 10
}) {
    const [inputValue, setInputValue] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Filter available skills based on input and exclude already selected
    const filteredSkills = AVAILABLE_SKILLS.filter(skill =>
        skill.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedSkills.includes(skill)
    ).slice(0, 10); // Show max 10 suggestions

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                !inputRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset highlighted index when filtered skills change
    useEffect(() => {
        setHighlightedIndex(0);
    }, [inputValue]);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        setShowDropdown(true);
    };

    const handleSelectSkill = (skill) => {
        if (selectedSkills.length < maxSkills) {
            onChange([...selectedSkills, skill]);
            setInputValue('');
            setShowDropdown(false);
            inputRef.current?.focus();
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        onChange(selectedSkills.filter(skill => skill !== skillToRemove));
    };

    const handleKeyDown = (e) => {
        if (!showDropdown || filteredSkills.length === 0) {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredSkills.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredSkills[highlightedIndex]) {
                    handleSelectSkill(filteredSkills[highlightedIndex]);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                setInputValue('');
                break;
        }
    };

    return (
        <div className="space-y-3">
            {/* Input with dropdown */}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={selectedSkills.length >= maxSkills ? `Maximum ${maxSkills} skills reached` : placeholder}
                    disabled={selectedSkills.length >= maxSkills}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 focus:border-green-600 dark:focus:border-green-500 focus:outline-none transition-all font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />

                {/* Dropdown */}
                {showDropdown && filteredSkills.length > 0 && (
                    <div
                        ref={dropdownRef}
                        className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    >
                        {filteredSkills.map((skill, index) => (
                            <div
                                key={skill}
                                onClick={() => handleSelectSkill(skill)}
                                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${index === highlightedIndex
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            >
                                {skill}
                            </div>
                        ))}
                    </div>
                )}

                {/* No results message */}
                {showDropdown && inputValue && filteredSkills.length === 0 && (
                    <div
                        ref={dropdownRef}
                        className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
                    >
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            No skills found. Please select from the available list.
                        </div>
                    </div>
                )}
            </div>

            {/* Selected skills tags */}
            {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedSkills.map((skill) => (
                        <div
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg text-sm font-light"
                        >
                            <span>{skill}</span>
                            <button
                                onClick={() => handleRemoveSkill(skill)}
                                className="hover:bg-green-100 dark:hover:bg-green-900/40 rounded-full p-0.5 transition-colors"
                                title={`Remove ${skill}`}
                            >
                                <HiX size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Skills counter */}
            <p className="text-xs text-gray-400 dark:text-gray-500">
                {selectedSkills.length}/{maxSkills} skills selected
            </p>
        </div>
    );
}
