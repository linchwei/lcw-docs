module.exports = {
    apps: [
        {
            name: 'lcw-docs-server',
            script: './dist/main.js',
            instances: 'max',
            exec_mode: 'cluster',
            max_memory_restart: '512M',
            env: {
                NODE_ENV: 'development',
                DB_HOST: 'localhost',
                DB_PORT: 5433,
            },
            env_production: {
                NODE_ENV: 'production',
            },
            error_file: './logs/error.log',
            out_file: './logs/out.log',
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            max_restarts: 10,
            restart_delay: 4000,
            listen_timeout: 10000,
            kill_timeout: 10000,
        },
    ],
}
