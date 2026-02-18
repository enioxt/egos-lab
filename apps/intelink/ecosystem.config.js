module.exports = {
    apps: [
        {
            name: 'intelink-web',
            cwd: '/home/enio/EGOSv3/apps/intelink',
            script: 'npm',
            args: 'run dev',
            env: {
                PORT: 3001
            },
            watch: false,
            autorestart: true,
            max_memory_restart: '500M'
        },
        {
            name: 'intelink-bot',
            cwd: '/home/enio/EGOSv3',
            script: 'npx',
            args: 'tsx apps/intelink/scripts/telegram-polling.ts',
            watch: false,
            autorestart: true,
            max_memory_restart: '200M'
        }
    ]
};
