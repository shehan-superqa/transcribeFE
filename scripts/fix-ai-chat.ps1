$ErrorActionPreference = 'Stop'

$path = 'src/components/financial/AIChatSection.tsx'

if (-not (Test-Path $path)) {
  throw "File not found: $path"
}

$c = Get-Content $path -Raw

# Remove accidental literal escape sequences inserted by a previous edit.
$c = $c.Replace('\r\n', "`r`n")
$c = $c.Replace('$insert', '')

# Ensure the prop exists (idempotent).
if ($c -notmatch 'initialQuery\?:\s*string') {
  $c = $c -replace '(\s+onClose\?: \(\) => void;\s*\r?\n)', ('$1  /** Optional query to auto-send when the chat mounts (used by the top "Ask" bar). */' + "`r`n" + '  initialQuery?: string;' + "`r`n")
}

# Ensure function signature destructures initialQuery.
$c = $c -replace 'export default function AIChatSection\(\{\s*floating\s*=\s*false,\s*minimized\s*=\s*false,\s*onMinimize,\s*onClose\s*\}:\s*AIChatSectionProps\)\s*\{', (
  "export default function AIChatSection({`r`n" +
  "  floating = false,`r`n" +
  "  minimized = false,`r`n" +
  "  onMinimize,`r`n" +
  "  onClose,`r`n" +
  "  initialQuery,`r`n" +
  "}: AIChatSectionProps) {"
)

# Ensure the ref exists.
if ($c -notmatch 'hasSentInitialRef') {
  $c = $c -replace 'const messagesEndRef = useRef<HTMLDivElement>\(null\);', 'const messagesEndRef = useRef<HTMLDivElement>(null);' + "`r`n" + '  const hasSentInitialRef = useRef(false);'
}

# Insert auto-send effect once (before handleSend).
# 1) Remove any previously inserted (and possibly misplaced) effect block.
$c = [regex]::Replace(
  $c,
  '(?s)\s*useEffect\(\(\) => \{\s*if \(hasSentInitialRef\.current\) return;.*?\}, \[initialQuery, floating, isMinimized\]\);\s*',
  "`r`n`r`n",
  1
)

# 2) Insert the effect right before handleSend.
if ($c -notmatch '\[initialQuery, floating, isMinimized\]') {
  $block = @'

  useEffect(() => {
    if (hasSentInitialRef.current) return;
    if (!initialQuery) return;
    if (floating && isMinimized) return;
    const q = initialQuery.trim();
    if (!q) return;

    hasSentInitialRef.current = true;
    const userMessage: Message = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    handleSendMessage(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, floating, isMinimized]);
'@

  $c = [regex]::Replace(
    $c,
    '(\r?\n\s*const handleSend = \(\) => \{)',
    ($block + '$1'),
    1
  )
}

Set-Content -Path $path -Value $c -NoNewline

Write-Host "Fixed: $path"

