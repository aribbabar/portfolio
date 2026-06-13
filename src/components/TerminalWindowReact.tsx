import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface TerminalWindowProps {
	title: string;
	command?: string;
	lines?: string[];
	wide?: boolean;
	interactive?: boolean;
}

interface Directory {
	dirs: string[];
	files: string[];
}

interface OutputLine {
	text?: string;
	html?: string;
	className?: string;
}

interface HistoryEntry {
	id: number;
	type: 'command' | 'output';
	command?: string;
	promptCwd?: string;
	line?: OutputLine;
}

interface ShellState {
	cwd: string;
}

interface Completion {
	value: string | null;
	matches: OutputLine[];
}

const directories: Record<string, Directory> = {
	'~': {
		dirs: ['projects', 'skills', 'contact', 'secrets'],
		files: ['about.txt', 'resume.pdf'],
	},
	'~/projects': {
		dirs: [],
		files: ['portfolio.md', 'dev-tools.md', 'interactive-experiments.md'],
	},
	'~/skills': {
		dirs: [],
		files: ['frontend.ts', 'backend.ts', 'ai-tools.ts', 'debugging.ts'],
	},
	'~/contact': {
		dirs: [],
		files: ['github.url', 'linkedin.url'],
	},
	'~/secrets': {
		dirs: [],
		files: ['easter-egg.txt'],
	},
};

const fileContents: Record<string, string[]> = {
	'~/about.txt': [
		'Arib Farooqui - Software Engineer',
		'I build interactive experiences, developer tools, and useful web systems.',
	],
	'~/resume.pdf': ['Binary-ish artifact detected. Try the Download Resume button above.'],
	'~/projects/portfolio.md': ['This site. Terminal now accepts commands.'],
	'~/projects/dev-tools.md': ['Small tools, automation, and interfaces that remove repeated work.'],
	'~/projects/interactive-experiments.md': [
		'Game-like UI, playful microinteractions, and browser-native prototypes.',
	],
	'~/skills/frontend.ts': ['Astro, React, TypeScript, CSS, animation, accessibility.'],
	'~/skills/backend.ts': ['APIs, databases, auth flows, integrations, deployment.'],
	'~/skills/ai-tools.ts': ['LLM workflows, retrieval, agent tooling, automation.'],
	'~/skills/debugging.ts': ['Breakpoints, traces, repros, and the occasional stare-off with logs.'],
	'~/contact/github.url': ['https://github.com/aribbabar'],
	'~/contact/linkedin.url': ['https://www.linkedin.com/in/aribfarooqui/'],
	'~/secrets/easter-egg.txt': ['You found the quiet folder. Try `easter-egg`.'],
};

const helpLines = [
	['help', 'show available commands'],
	['ls [folder]', 'list files and folders'],
	['cd <folder>', 'change directory'],
	['pwd', 'print current directory'],
	['cat <file>', 'read a file'],
	['tree', 'show the tiny filesystem'],
	['echo <text>', 'print text back'],
	['grep <text> <file>', 'search a readable file'],
	['contact', 'show contact links'],
	['sudo hire-me', 'run the important command'],
	['mkdir <name>', 'attempt to create a folder'],
	['touch/rm/cp/mv', 'try common file operations'],
	['easter-egg', '???'],
	['clear', 'clear this terminal'],
];

const commandNames = [
	'cat',
	'cd',
	'chmod',
	'chown',
	'clear',
	'contact',
	'cp',
	'date',
	'easter-egg',
	'echo',
	'exit',
	'grep',
	'help',
	'ls',
	'man',
	'mkdir',
	'mv',
	'nano',
	'pwd',
	'rm',
	'rmdir',
	'sudo',
	'touch',
	'tree',
	'uname',
	'vi',
	'vim',
	'whoami',
];

const escapeHtml = (value: string) =>
	value.replace(/[&<>"']/g, (char) => {
		const entities: Record<string, string> = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;',
		};
		return entities[char];
	});

const htmlToPlainText = (value: string) =>
	value
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");

const normalizePath = (cwd: string, target = '', fallback = cwd) => {
	const rawTarget = target.trim();
	if (!rawTarget) return fallback;
	if (rawTarget === '~') return '~';

	const parts = rawTarget.startsWith('~')
		? rawTarget.slice(1).split('/')
		: rawTarget.startsWith('/')
			? rawTarget.split('/')
			: `${cwd}/${rawTarget}`.replace(/^~\/?/, '').split('/');

	const resolved: string[] = [];
	for (const part of parts) {
		if (!part || part === '.') continue;
		if (part === '..') {
			resolved.pop();
			continue;
		}
		resolved.push(part);
	}

	return resolved.length > 0 ? `~/${resolved.join('/')}` : '~';
};

const listDirectory = (path: string): OutputLine[] | null => {
	const directory = directories[path];
	if (!directory) return null;

	return [
		...directory.dirs.map((entry) => ({ text: `${entry}/`, className: 'directory' })),
		...directory.files.map((entry) => ({ text: entry })),
	];
};

const directoryEntries = (path: string, dirsOnly = false) => {
	const directory = directories[path];
	if (!directory) return [];

	const dirs = directory.dirs.map((name) => ({ name, type: 'dir' }));
	const files = dirsOnly ? [] : directory.files.map((name) => ({ name, type: 'file' }));

	return [...dirs, ...files];
};

const fileAt = (cwd: string, target: string) => fileContents[normalizePath(cwd, target)];

const stripFlags = (args: string[]) => args.filter((arg) => !arg.startsWith('-'));

const commonPrefix = (values: string[]) => {
	if (values.length === 0) return '';

	let prefix = values[0];
	for (const value of values.slice(1)) {
		while (!value.startsWith(prefix)) {
			prefix = prefix.slice(0, -1);
		}
	}

	return prefix;
};

const splitPathToken = (token: string) => {
	const slashIndex = token.lastIndexOf('/');
	if (slashIndex === -1) return { parentToken: '', partial: token };

	return {
		parentToken: token.slice(0, slashIndex + 1),
		partial: token.slice(slashIndex + 1),
	};
};

const completePath = (cwd: string, token: string, dirsOnly = false): Completion | null => {
	const { parentToken, partial } = splitPathToken(token);
	const parentPath = parentToken ? normalizePath(cwd, parentToken) : cwd;
	const matches = directoryEntries(parentPath, dirsOnly).filter((entry) =>
		entry.name.startsWith(partial),
	);

	if (matches.length === 0) return null;

	const displayMatches = matches.map((entry) => ({
		text: `${parentToken}${entry.name}${entry.type === 'dir' ? '/' : ''}`,
		className: entry.type === 'dir' ? 'directory' : '',
	}));

	if (matches.length === 1) {
		const [match] = matches;
		return {
			value: `${parentToken}${match.name}${match.type === 'dir' ? '/' : ' '}`,
			matches: displayMatches,
		};
	}

	const prefix = commonPrefix(matches.map((entry) => entry.name));
	return {
		value: prefix.length > partial.length ? `${parentToken}${prefix}` : null,
		matches: displayMatches,
	};
};

const completeInput = (value: string, state: ShellState): Completion | null => {
	const leadingWhitespace = value.match(/^\s*/)?.[0] || '';
	const trimmedStart = value.trimStart();
	const parts = trimmedStart.split(/\s+/);
	const command = parts[0] || '';
	const hasCommandOnly = !trimmedStart.includes(' ');

	if (!command) {
		return { value: null, matches: commandNames.map((name) => ({ text: name })) };
	}

	if (hasCommandOnly) {
		const matches = commandNames.filter((name) => name.startsWith(command));
		if (matches.length === 0) return null;
		if (matches.length === 1) {
			return { value: `${leadingWhitespace}${matches[0]} `, matches: matches.map((text) => ({ text })) };
		}

		const prefix = commonPrefix(matches);
		return {
			value: prefix.length > command.length ? `${leadingWhitespace}${prefix}` : null,
			matches: matches.map((text) => ({ text })),
		};
	}

	if (command === 'sudo') {
		const subcommand = parts[1] || '';
		if ('hire-me'.startsWith(subcommand)) {
			return { value: 'sudo hire-me ', matches: [{ text: 'hire-me' }] };
		}
		return null;
	}

	const pathCommands = new Set(['ls', 'cd', 'cat', 'grep']);
	if (!pathCommands.has(command)) return null;

	const lastToken = parts.at(-1) || '';
	const completion = completePath(state.cwd, lastToken, command === 'cd');
	if (!completion) return null;

	const replacePattern = new RegExp(`${lastToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
	return {
		value: completion.value ? value.replace(replacePattern, completion.value) : null,
		matches: completion.matches,
	};
};

const runCommand = (rawCommand: string, state: ShellState) => {
	const command = rawCommand.trim();
	const lowerCommand = command.toLowerCase();
	const [name, ...args] = command.split(/\s+/);
	const lowerName = (name || '').toLowerCase();
	let nextCwd = state.cwd;

	if (!command) return { output: [] as OutputLine[], nextCwd };
	if (lowerCommand === 'clear') return { output: 'clear' as const, nextCwd };
	if (lowerCommand === 'sudo hire-me') {
		return {
			output: [
				{ text: 'Checking qualifications...' },
				{ text: 'Overqualified.', className: 'ok' },
				{ text: 'Opening best next step: linkedin.url', className: 'accent' },
			],
			nextCwd,
		};
	}
	if (lowerCommand === 'easter-egg') {
		return {
			output: [
				{ text: 'Achievement unlocked: looked under the floorboards.', className: 'accent' },
				{ text: 'Secret command discovered. Status: still hireable.' },
			],
			nextCwd,
		};
	}

	switch (lowerName) {
		case 'man':
		case 'help':
			return {
				output: helpLines.map(([cmd, description]) => ({
					html: `<span class="cmd">${escapeHtml(cmd)}</span> - ${escapeHtml(description)}`,
				})),
				nextCwd,
			};
		case 'ls': {
			const target = normalizePath(state.cwd, stripFlags(args).join(' '));
			const entries = listDirectory(target);
			return {
				output: entries ?? [
					{ text: `ls: cannot access '${args.join(' ')}': No such directory`, className: 'error' },
				],
				nextCwd,
			};
		}
		case 'cd': {
			const target = normalizePath(state.cwd, args.join(' '), '~');
			if (!directories[target]) {
				const fileExists = Boolean(fileContents[target]);
				return {
					output: [
						{
							text: fileExists
								? `cd: not a directory: ${args.join(' ')}`
								: `cd: no such directory: ${args.join(' ')}`,
							className: 'error',
						},
					],
					nextCwd,
				};
			}
			nextCwd = target;
			return { output: [], nextCwd };
		}
		case 'pwd':
			return { output: [{ text: state.cwd }], nextCwd };
		case 'cat': {
			if (args.length === 0) {
				return { output: [{ text: 'cat: missing file operand', className: 'error' }], nextCwd };
			}
			const contents = fileAt(state.cwd, args.join(' '));
			return {
				output: contents
					? contents.map((text) => ({ text }))
					: [{ text: `cat: ${args.join(' ')}: No such file`, className: 'error' }],
				nextCwd,
			};
		}
		case 'tree':
			return {
				output: [
					{ text: '~' },
					{ text: '|-- about.txt' },
					{ text: '|-- resume.pdf' },
					{ text: '|-- projects/' },
					{ text: '|   |-- portfolio.md' },
					{ text: '|   |-- dev-tools.md' },
					{ text: '|   `-- interactive-experiments.md' },
					{ text: '|-- skills/' },
					{ text: '|-- contact/' },
					{ text: '`-- secrets/' },
				],
				nextCwd,
			};
		case 'echo':
			return { output: [{ text: args.join(' ') }], nextCwd };
		case 'grep': {
			if (args.length < 2) {
				return { output: [{ text: 'grep: usage: grep <text> <file>', className: 'error' }], nextCwd };
			}
			const [query, ...fileArgs] = args;
			const contents = fileAt(state.cwd, fileArgs.join(' '));
			if (!contents) {
				return {
					output: [{ text: `grep: ${fileArgs.join(' ')}: No such file`, className: 'error' }],
					nextCwd,
				};
			}
			const matches = contents.filter((line) => line.toLowerCase().includes(query.toLowerCase()));
			return {
				output: matches.length > 0 ? matches.map((text) => ({ text })) : [{ text: '(no matches)' }],
				nextCwd,
			};
		}
		case 'mkdir':
			return {
				output: [
					{
						text: `mkdir: cannot create directory '${args.join(' ') || 'new-folder'}': read-only static site`,
						className: 'error',
					},
					{ text: 'Try again after this portfolio grows a backend and a tiny sense of responsibility.' },
				],
				nextCwd,
			};
		case 'touch':
			return {
				output: [{ text: `Touched ${args.join(' ') || 'nothing'} emotionally. Filesystem unchanged.` }],
				nextCwd,
			};
		case 'rm':
			return {
				output: [
					{
						text: 'rm: refused. Deleting portfolio files from the browser would be a career-limiting feature.',
						className: 'error',
					},
				],
				nextCwd,
			};
		case 'rmdir':
			return {
				output: [
					{ text: 'rmdir: directories here are decorative and emotionally load-bearing.', className: 'error' },
				],
				nextCwd,
			};
		case 'cp':
			return { output: [{ text: 'cp: copied the idea, not the file. Static site privileges are limited.' }], nextCwd };
		case 'mv':
			return {
				output: [{ text: 'mv: everything stayed exactly where it was. Very on brand for static hosting.' }],
				nextCwd,
			};
		case 'chmod':
		case 'chown':
			return {
				output: [
					{ text: `${lowerName}: permission model unavailable. This is HTML with confidence.`, className: 'error' },
				],
				nextCwd,
			};
		case 'nano':
		case 'vim':
		case 'vi':
			return { output: [{ text: `${lowerName}: editor unavailable. Also, there is no escape room here.` }], nextCwd };
		case 'uname':
			return { output: [{ text: 'portfolio static-site 1.0.0 astro/browser x86_64-ish' }], nextCwd };
		case 'contact':
			return {
				output: [
					{ text: 'GitHub: https://github.com/aribbabar', className: 'accent' },
					{ text: 'LinkedIn: https://www.linkedin.com/in/aribfarooqui/' },
				],
				nextCwd,
			};
		case 'sudo':
			return { output: [{ text: 'sudo: nice try. Only `sudo hire-me` is allowed.', className: 'error' }], nextCwd };
		case 'whoami':
			return { output: [{ text: 'visitor' }], nextCwd };
		case 'date':
			return { output: [{ text: new Date().toLocaleString() }], nextCwd };
		case 'exit':
			return { output: [{ text: 'Session preserved. This terminal refuses to quit.', className: 'accent' }], nextCwd };
		default:
			return {
				output: [{ text: `${name}: command not found. Type 'help' for available commands.`, className: 'error' }],
				nextCwd,
			};
	}
};

const wait = (milliseconds: number) =>
	new Promise((resolve) => {
		window.setTimeout(resolve, milliseconds);
	});

const createInputId = (title: string) => `terminal-input-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export default function TerminalWindowReact({
	title,
	command = 'help',
	lines = [],
	wide = false,
	interactive = false,
}: TerminalWindowProps) {
	const inputId = useMemo(() => createInputId(title), [title]);
	const terminalRef = useRef<HTMLElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const bodyRef = useRef<HTMLDivElement | null>(null);
	const entryId = useRef(0);
	const animationStarted = useRef(false);
	const [cwd, setCwd] = useState('~');
	const [inputValue, setInputValue] = useState('');
	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const [commandHistory, setCommandHistory] = useState<string[]>([]);
	const [commandHistoryIndex, setCommandHistoryIndex] = useState(0);
	const [caretIndex, setCaretIndex] = useState(0);
	const [bootHidden, setBootHidden] = useState(false);
	const [bootCommandText, setBootCommandText] = useState(command);
	const [bootLineText, setBootLineText] = useState<string[] | null>(null);
	const [isAnimating, setIsAnimating] = useState(false);
	const [animationComplete, setAnimationComplete] = useState(!interactive);
	const pendingCaretIndex = useRef<number | null>(null);
	const bootPlainLines = useMemo(() => lines.map(htmlToPlainText), [lines]);

	const nextId = useCallback(() => {
		entryId.current += 1;
		return entryId.current;
	}, []);

	const scrollToBottom = useCallback(() => {
		window.requestAnimationFrame(() => {
			if (!bodyRef.current) return;
			bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
		});
	}, []);

	const focusInput = useCallback(() => {
		if (window.getSelection()?.toString()) return;
		inputRef.current?.focus();
	}, []);

	const setInputValueWithCaret = useCallback((value: string, nextCaretIndex = value.length) => {
		const boundedCaretIndex = Math.max(0, Math.min(nextCaretIndex, value.length));
		pendingCaretIndex.current = boundedCaretIndex;
		setInputValue(value);
		setCaretIndex(boundedCaretIndex);
	}, []);

	const syncCaretFromInput = useCallback(() => {
		const input = inputRef.current;
		setCaretIndex(input?.selectionStart ?? inputValue.length);
	}, [inputValue.length]);

	const appendCommandOutput = useCallback(
		(rawCommand: string, output: OutputLine[] | 'clear', promptCwd: string) => {
			if (output === 'clear') {
				setHistory([]);
				setBootHidden(true);
				return;
			}

			setHistory((current) => [
				...current,
				{ id: nextId(), type: 'command', command: rawCommand, promptCwd },
				...output.map((line) => ({ id: nextId(), type: 'output' as const, line })),
			]);
		},
		[nextId],
	);

	const appendCompletionOutput = useCallback(
		(rawCommand: string, matches: OutputLine[], promptCwd: string) => {
			setHistory((current) => [
				...current,
				{ id: nextId(), type: 'command', command: rawCommand, promptCwd },
				...matches.map((line) => ({ id: nextId(), type: 'output' as const, line })),
			]);
		},
		[nextId],
	);

	const submitCommand = useCallback(() => {
		const rawCommand = inputValue;
		const promptCwd = cwd;
		const { output, nextCwd } = runCommand(rawCommand, { cwd });

		if (rawCommand.trim()) {
			setCommandHistory((current) => {
				const next = [...current, rawCommand];
				setCommandHistoryIndex(next.length);
				return next;
			});
		}

		appendCommandOutput(rawCommand, output, promptCwd);
		setInputValueWithCaret('');
		setCwd(nextCwd);
		scrollToBottom();
	}, [appendCommandOutput, cwd, inputValue, scrollToBottom, setInputValueWithCaret]);

	const handleTabCompletion = useCallback(() => {
		const completion = completeInput(inputValue, { cwd });
		if (!completion) return;

		const nextInput = completion.value ?? inputValue;
		if (completion.value) {
			setInputValueWithCaret(completion.value);
		}
		if (!completion.value || completion.matches.length > 1) {
			appendCompletionOutput(nextInput, completion.matches, cwd);
		}
		scrollToBottom();
	}, [appendCompletionOutput, cwd, inputValue, scrollToBottom, setInputValueWithCaret]);

	useEffect(() => {
		scrollToBottom();
	}, [history, inputValue, scrollToBottom]);

	useEffect(() => {
		if (pendingCaretIndex.current === null || !inputRef.current) return;

		const nextCaretIndex = Math.max(0, Math.min(pendingCaretIndex.current, inputValue.length));
		inputRef.current.setSelectionRange(nextCaretIndex, nextCaretIndex);
		setCaretIndex(nextCaretIndex);
		pendingCaretIndex.current = null;
	}, [inputValue]);

	useEffect(() => {
		if (!interactive) return undefined;
		const terminal = terminalRef.current;
		const input = inputRef.current;
		if (!terminal || !input) return undefined;

		let cancelled = false;
		let observer: IntersectionObserver | null = null;

		const typeText = async (value: string, onUpdate: (text: string) => void, delay = 24) => {
			onUpdate('');
			let next = '';
			for (const character of value) {
				if (cancelled) return;
				next += character;
				onUpdate(next);
				await wait(delay);
			}
		};

		const playBootAnimation = async () => {
			if (animationStarted.current) return;
			animationStarted.current = true;
			setIsAnimating(true);
			setAnimationComplete(false);
			input.disabled = true;
			input.setAttribute('aria-disabled', 'true');
			setBootLineText(lines.map(() => ''));

			await wait(240);
			await typeText(command, setBootCommandText, 34);
			await wait(140);

			for (let index = 0; index < lines.length; index += 1) {
				const text = bootPlainLines[index] ?? '';
				await typeText(text, (next) => {
					setBootLineText((current) => {
						const nextLines = [...(current ?? lines.map(() => ''))];
						nextLines[index] = next;
						return nextLines;
					});
				}, 12);
				await wait(95);
			}

			if (cancelled) return;

			setBootLineText(null);
			setIsAnimating(false);
			setAnimationComplete(true);
			input.disabled = false;
			input.removeAttribute('aria-disabled');
			input.focus();
		};

		if ('IntersectionObserver' in window) {
			observer = new IntersectionObserver(
				(entries) => {
					if (entries.some((entry) => entry.isIntersecting)) {
						observer?.disconnect();
						void playBootAnimation();
					}
				},
				{ threshold: 0.42 },
			);
			observer.observe(terminal);
		} else {
			void playBootAnimation();
		}

		return () => {
			cancelled = true;
			observer?.disconnect();
		};
	}, [bootPlainLines, command, interactive, lines]);

	const classes = ['terminal', wide ? 'wide' : '', interactive ? 'interactive' : '']
		.filter(Boolean)
		.join(' ');
	const visibleCaretIndex = Math.max(0, Math.min(caretIndex, inputValue.length));
	const inputBeforeCaret = inputValue.slice(0, visibleCaretIndex);
	const inputAfterCaret = inputValue.slice(visibleCaretIndex);

	return (
		<article
			ref={terminalRef}
			className={classes}
			data-terminal-interactive={interactive}
			data-terminal-animating={isAnimating ? 'true' : undefined}
			data-terminal-animation-complete={animationComplete ? 'true' : undefined}
			onClick={interactive ? focusInput : undefined}
		>
			<header>
				<span>&gt; {title}</span>
				<div className="lights" aria-hidden="true">
					<i className="hot" />
					<i className="warm" />
					<i className="ok" />
				</div>
			</header>
			<div
				ref={bodyRef}
				className="terminal-body"
				onPointerDown={(event) => {
					if (!interactive) return;
					if (event.target instanceof Element && event.target.closest('[data-terminal-form]')) return;
					inputRef.current?.blur();
				}}
			>
				{!bootHidden && (
					<>
						<p className="command" data-terminal-boot-command={interactive}>
							arib@portfolio:~$ <span data-terminal-boot-command-text>{bootCommandText}</span>
						</p>
						{lines.length > 0 && (
							<div className="lines">
								{lines.map((line, index) =>
									bootLineText ? (
										<p key={`${line}-${index}`} data-terminal-boot-line={interactive}>
											{bootLineText[index] || '\u00a0'}
										</p>
									) : (
										<p
											key={`${line}-${index}`}
											data-terminal-boot-line={interactive}
											dangerouslySetInnerHTML={{ __html: line }}
										/>
									),
								)}
							</div>
						)}
					</>
				)}

				{interactive ? (
					<>
						<div className="terminal-history" data-terminal-history>
							{history.map((entry) =>
								entry.type === 'command' ? (
									<p key={entry.id} className="terminal-output-line command-entry">
										<span className="terminal-command-prompt">
											arib@portfolio:{entry.promptCwd}$
										</span>{' '}
										<span className="terminal-command-text">{entry.command}</span>
									</p>
								) : (
									<p
										key={entry.id}
										className={['terminal-output-line', entry.line?.className || '']
											.filter(Boolean)
											.join(' ')}
										dangerouslySetInnerHTML={
											entry.line?.html ? { __html: entry.line.html } : undefined
										}
									>
										{entry.line?.html ? undefined : entry.line?.text}
									</p>
								),
							)}
						</div>
						<form
							className="terminal-form"
							data-terminal-form
							onClick={focusInput}
							onSubmit={(event) => {
								event.preventDefault();
								submitCommand();
							}}
						>
							<label className="command prompt-label" htmlFor={inputId}>
								arib@portfolio:<span data-terminal-path>{cwd}</span>$
							</label>
							<input
								ref={inputRef}
								id={inputId}
								data-terminal-input
								className="terminal-input"
								type="text"
								autoComplete="off"
								autoCapitalize="none"
								autoCorrect="off"
								spellCheck={false}
								aria-label="Terminal command"
								value={inputValue}
								onChange={(event) => {
									setInputValue(event.target.value);
									setCaretIndex(event.target.selectionStart ?? event.target.value.length);
								}}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										event.preventDefault();
										submitCommand();
										return;
									}
									if (event.key === 'Tab') {
										event.preventDefault();
										handleTabCompletion();
										return;
									}
									if (event.key === 'ArrowUp') {
										event.preventDefault();
										const nextIndex = Math.max(0, commandHistoryIndex - 1);
										const nextCommand = commandHistory[nextIndex] || '';
										setCommandHistoryIndex(nextIndex);
										setInputValueWithCaret(nextCommand);
										return;
									}
									if (event.key === 'ArrowDown') {
										event.preventDefault();
										const nextIndex = Math.min(commandHistory.length, commandHistoryIndex + 1);
										const nextCommand = commandHistory[nextIndex] || '';
										setCommandHistoryIndex(nextIndex);
										setInputValueWithCaret(nextCommand);
									}
								}}
								onKeyUp={syncCaretFromInput}
								onSelect={syncCaretFromInput}
								onFocus={syncCaretFromInput}
							/>
							<span className="terminal-entry" data-terminal-entry aria-hidden="true">
								<span data-terminal-typed>
									<span>{inputBeforeCaret}</span>
									<span className="terminal-block-cursor" />
									<span>{inputAfterCaret}</span>
								</span>
							</span>
						</form>
					</>
				) : (
					<p className="command prompt">
						arib@portfolio:~$ <span className="cursor" />
					</p>
				)}
			</div>
		</article>
	);
}
