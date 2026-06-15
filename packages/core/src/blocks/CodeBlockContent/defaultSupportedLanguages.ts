import { refractor } from 'refractor'
import docker from 'refractor/docker'
import git from 'refractor/git'
import graphql from 'refractor/graphql'
import haskell from 'refractor/haskell'
import jsx from 'refractor/jsx'
import latex from 'refractor/latex'
import scala from 'refractor/scala'
import toml from 'refractor/toml'
import tsx from 'refractor/tsx'
import typescript from 'refractor/typescript'

refractor.register(docker)
refractor.register(git)
refractor.register(graphql)
refractor.register(haskell)
refractor.register(latex)
refractor.register(toml)
refractor.register(tsx)
refractor.register(jsx)
refractor.register(scala)
refractor.register(typescript)

export type SupportedLanguageConfig = {
    id: string
    name: string
    match: string[]
}

export const defaultSupportedLanguages: SupportedLanguageConfig[] = [
    { id: 'text', name: 'Plain Text', match: ['text', 'txt', 'plain'] },
    { id: 'bash', name: 'Bash', match: ['bash', 'sh', 'shell', 'zsh'] },
    { id: 'c', name: 'C', match: ['c'] },
    { id: 'cpp', name: 'C++', match: ['cpp', 'c++', 'cc'] },
    { id: 'csharp', name: 'C#', match: ['c#', 'csharp', 'cs'] },
    { id: 'css', name: 'CSS', match: ['css'] },
    { id: 'diff', name: 'Diff', match: ['diff', 'patch'] },
    { id: 'docker', name: 'Docker', match: ['docker', 'dockerfile'] },
    { id: 'git', name: 'Git', match: ['git'] },
    { id: 'go', name: 'Go', match: ['go', 'golang'] },
    { id: 'graphql', name: 'GraphQL', match: ['graphql', 'gql'] },
    { id: 'haskell', name: 'Haskell', match: ['haskell', 'hs'] },
    { id: 'markup', name: 'HTML/XML', match: ['html', 'xml', 'svg', 'markup'] },
    { id: 'ini', name: 'INI', match: ['ini', 'conf'] },
    { id: 'java', name: 'Java', match: ['java'] },
    { id: 'javascript', name: 'JavaScript', match: ['javascript', 'js'] },
    { id: 'json', name: 'JSON', match: ['json'] },
    { id: 'jsx', name: 'JSX', match: ['jsx'] },
    { id: 'kotlin', name: 'Kotlin', match: ['kotlin', 'kt', 'kts'] },
    { id: 'latex', name: 'LaTeX', match: ['latex', 'tex'] },
    { id: 'less', name: 'Less', match: ['less'] },
    { id: 'lua', name: 'Lua', match: ['lua'] },
    { id: 'markdown', name: 'Markdown', match: ['markdown', 'md'] },
    { id: 'objectivec', name: 'Objective C', match: ['objective-c', 'objc', 'objectivec'] },
    { id: 'php', name: 'PHP', match: ['php'] },
    { id: 'python', name: 'Python', match: ['python', 'py'] },
    { id: 'ruby', name: 'Ruby', match: ['ruby', 'rb'] },
    { id: 'rust', name: 'Rust', match: ['rust', 'rs'] },
    { id: 'scala', name: 'Scala', match: ['scala'] },
    { id: 'scss', name: 'SCSS', match: ['scss'] },
    { id: 'sql', name: 'SQL', match: ['sql'] },
    { id: 'swift', name: 'Swift', match: ['swift'] },
    { id: 'toml', name: 'TOML', match: ['toml'] },
    { id: 'tsx', name: 'TSX', match: ['tsx'] },
    { id: 'typescript', name: 'TypeScript', match: ['typescript', 'ts'] },
    { id: 'yaml', name: 'YAML', match: ['yaml', 'yml'] },
]
