import type { SdLesson } from '../types'

const CHAIN = [
  { subject: 'example.com', issuer: 'Intermediate CA', expires: 100, names: ['example.com', 'www.example.com'] },
  { subject: 'Intermediate CA', issuer: 'Root CA', expires: 200, names: [] },
  { subject: 'Root CA', issuer: 'Root CA', expires: 300, names: [] },
]

export const tls: SdLesson = {
  id: 'ssl-tls',
  title: 'SSL/TLS certificates',
  topic: 'Trusting the server',
  blurb: 'How HTTPS proves a site is who it says it is, and how a chain of certificates is checked.',
  why: {
    story: 'When you send a password over the internet, many machines can see the traffic on the way. **HTTPS** encrypts it with **TLS** (the modern version of SSL), so only you and the server can read it. But encryption alone is not enough: you must also be sure you are talking to the **real** `bank.com` and not an impostor. That is the job of a **certificate**: a document, signed by a trusted authority, that says "this public key belongs to bank.com".',
    pains: ['Anyone on the network path can read or change plain HTTP traffic.', 'An attacker can pretend to be a website unless identity is verified.', 'Your browser cannot personally know every website\'s key.'],
  },
  before: {
    title: 'The chain of trust',
    nodes: [
      { id: 'r', label: 'Root CA', kind: 'gateway', x: 12, y: 28, sub: 'pre-installed trust' },
      { id: 'i', label: 'Intermediate CA', kind: 'gateway', x: 40, y: 28 },
      { id: 'l', label: 'example.com', kind: 'server', x: 70, y: 28, sub: 'leaf certificate' },
      { id: 'b', label: 'Browser', kind: 'client', x: 90, y: 10, sub: 'trusted roots' },
    ],
    edges: [{ from: 'r', to: 'i', label: 'signs' }, { from: 'i', to: 'l', label: 'signs' }, { from: 'l', to: 'b' }],
    frames: [
      { caption: 'Your device ships with a list of **root certificate authorities** (CAs) that it trusts.', active: ['b', 'r'] },
      { caption: 'A root CA signs an **intermediate CA**, which signs the website\'s **leaf certificate**. Each certificate names its issuer.', active: ['r', 'i', 'l'], flow: [['r', 'i'], ['i', 'l']] },
      { caption: 'The server sends its leaf and intermediate certificates. The browser follows the chain upward until it reaches a root it already trusts.', active: ['l', 'b'], flow: [['l', 'b']] },
      { caption: 'If every link is valid (signature, dates, name), the site is trusted: the padlock appears.', active: ['b'], badges: { b: 'TRUSTED' } },
    ],
  },
  how: {
    title: 'The TLS handshake (simplified)',
    nodes: [
      { id: 'c', label: 'Browser', kind: 'client', x: 14, y: 28 },
      { id: 's', label: 'Server', kind: 'server', x: 80, y: 28 },
    ],
    edges: [{ from: 'c', to: 's' }],
    frames: [
      { caption: '**1. Hello.** The browser says which TLS versions and ciphers it supports.', active: ['c', 's'], flow: [['c', 's']] },
      { caption: '**2. Certificate.** The server replies with its certificate chain and its choice of cipher.', active: ['s', 'c'], flow: [['s', 'c']] },
      { caption: '**3. Verify.** The browser checks the chain, the dates and that the name matches the site.', active: ['c'], badges: { c: 'VERIFY' } },
      { caption: '**4. Key exchange.** Both sides agree on a fresh secret **session key** (the server proves it owns the certificate\'s private key).', active: ['c', 's'], flow: [['c', 's'], ['s', 'c']] },
      { caption: '**5. Encrypted traffic.** From now on everything is encrypted with the fast session key. Eavesdroppers see only noise.', active: ['c', 's'], flow: [['c', 's']], badges: { s: 'HTTPS' } },
    ],
  },
  tabs: ['Chain of trust', 'Handshake'],
  realWorld: [
    { name: 'Let\'s Encrypt', text: 'A free, automated certificate authority. It issues short-lived certificates that web servers renew automatically.' },
    { name: 'The browser padlock', text: 'The padlock means the connection is encrypted and the certificate checked out. It does not mean the site itself is trustworthy or safe.' },
    { name: 'Certificate errors', text: 'Warnings such as "certificate expired", "name mismatch" or "untrusted authority" are exactly the failures you will implement below.' },
    { name: 'HTTPS everywhere', text: 'Browsers mark plain HTTP sites as "not secure", and HTTP/2 and HTTP/3 in browsers require TLS.' },
  ],
  tradeoffs: {
    gain: ['Encryption stops eavesdropping and tampering.', 'Certificates prove the server\'s identity.', 'Required for modern browsers, payments and SEO.'],
    cost: ['A small extra delay for the handshake (reduced by session resumption).', 'Certificates must be renewed before they expire.', 'Private keys must be kept secret.'],
    useWhen: ['Always: for every website and every API.'],
    avoidWhen: ['Never skip it on public traffic. Inside a private network it may be terminated at a load balancer, but encrypt service-to-service traffic where possible.'],
  },
  steps: [
    {
      title: 'Check the name and the expiry of the site\'s certificate',
      tag: 'slow',
      idea: 'The two most common problems are easy to check: does the certificate list the name you asked for, and has it expired? Checking only the leaf certificate is not enough: anyone can create a certificate that names `bank.com`.',
      walk: ['The hostname must be in the leaf certificate\'s list of names.', 'The leaf must not be expired (`now < expires`).', 'Otherwise report "ok" (but nobody has checked who issued it!).'],
      only: [0, 1, 2, 5],
      code: {
        python: `def verify_chain(chain, roots, hostname, now):
    leaf = chain[0]
    if hostname not in leaf["names"]:
        return "hostname mismatch"
    if now >= leaf["expires"]:
        return "expired"
    return "ok"
`,
        javascript: `function verifyChain(chain, roots, hostname, now) {
  const leaf = chain[0];
  if (!leaf.names.includes(hostname)) return "hostname mismatch";
  if (now >= leaf.expires) return "expired";
  return "ok";
}
`,
      },
      time: 'O(1)',
      space: 'O(1)',
      verdict: 'Necessary but not sufficient: a forged certificate would pass. We must verify **who signed it**.',
    },
    {
      title: 'Verify the whole chain up to a trusted root',
      tag: 'best',
      idea: 'Check, in order: (1) the name matches the leaf; (2) **every** certificate in the chain is unexpired; (3) each certificate\'s **issuer** is the **subject** of the next certificate (the chain is unbroken); (4) the last certificate is a **root we trust**. Real TLS also verifies each certificate\'s cryptographic signature with the issuer\'s public key; here we model that with the issuer link.',
      walk: ['Reject if the hostname is not in the leaf\'s names.', 'Reject if any certificate has `now >= expires`.', 'For each certificate except the last, its `issuer` must equal the next one\'s `subject`; otherwise "broken chain".', 'The last certificate\'s subject must be in the trusted `roots`; otherwise "untrusted root".'],
      code: {
        python: `def verify_chain(chain, roots, hostname, now):
    if hostname not in chain[0]["names"]:
        return "hostname mismatch"
    for cert in chain:
        if now >= cert["expires"]:
            return "expired"
    for i in range(len(chain) - 1):
        if chain[i]["issuer"] != chain[i + 1]["subject"]:
            return "broken chain"
    if chain[-1]["subject"] not in roots:
        return "untrusted root"
    return "ok"
`,
        javascript: `function verifyChain(chain, roots, hostname, now) {
  if (!chain[0].names.includes(hostname)) return "hostname mismatch";
  for (const cert of chain) {
    if (now >= cert.expires) return "expired";
  }
  for (let i = 0; i < chain.length - 1; i++) {
    if (chain[i].issuer !== chain[i + 1].subject) return "broken chain";
  }
  if (!roots.includes(chain[chain.length - 1].subject)) return "untrusted root";
  return "ok";
}
`,
      },
      time: 'O(chain length)',
      space: 'O(1)',
      verdict: 'This is exactly why a server must send its **intermediate** certificates too: without them the browser cannot link the leaf to a root.',
    },
  ],
  practice: {
    fn: { python: 'verify_chain', javascript: 'verifyChain' },
    starter: {
      python: `def verify_chain(chain, roots, hostname, now):
    # chain: certificates, leaf first. Each is a dict with
    #   "subject", "issuer", "expires" and "names".
    # roots: the subjects of the trusted root authorities.
    # Return "ok", "hostname mismatch", "expired", "broken chain" or "untrusted root".
    pass
`,
      javascript: `function verifyChain(chain, roots, hostname, now) {
  // chain: certificates, leaf first. Each is an object with
  //   subject, issuer, expires and names.
  // roots: the subjects of the trusted root authorities.
  // Return "ok", "hostname mismatch", "expired", "broken chain" or "untrusted root".
}
`,
    },
    cases: [
      { label: 'a valid chain', args: [CHAIN, ['Root CA'], 'example.com', 50], expected: 'ok' },
      { label: 'the name must match the certificate', args: [CHAIN, ['Root CA'], 'evil.com', 50], expected: 'hostname mismatch' },
      { label: 'an expired certificate is rejected', args: [CHAIN, ['Root CA'], 'example.com', 150], expected: 'expired' },
      { label: 'a link in the chain is missing', args: [[CHAIN[0], { ...CHAIN[1], issuer: 'Other CA' }, CHAIN[2]], ['Root CA'], 'example.com', 50], expected: 'broken chain' },
      { label: 'the root is not trusted', args: [CHAIN, ['Some Other Root'], 'example.com', 50], expected: 'untrusted root' },
      { label: 'the www name is covered too', args: [CHAIN, ['Root CA'], 'www.example.com', 50], expected: 'ok' },
      { label: 'an expired intermediate certificate', args: [[CHAIN[0], { ...CHAIN[1], expires: 40 }, CHAIN[2]], ['Root CA'], 'example.com', 50], expected: 'expired' },
    ],
    hints: ['First check the hostname against the leaf certificate (the first one in the list).', 'Then check every certificate for expiry, and that each certificate\'s `issuer` equals the next certificate\'s `subject`.', 'Finally the last certificate\'s subject must be one of the trusted `roots`.'],
  },
  quiz: [
    { q: 'What does a certificate authority (CA) do?', options: ['Encrypts all web traffic', 'Signs certificates to vouch that a key belongs to a domain', 'Hosts the website'], answer: 1, why: 'A CA verifies that you control a domain and signs a certificate saying so. Browsers trust the CA, so they trust the certificate.' },
    { q: 'Why does the browser trust a certificate it has never seen before?', options: ['It trusts everything', 'The certificate chains up to a root CA already installed on the device', 'The website promises it is safe'], answer: 1, why: 'The chain of signatures leads to a root the device already trusts.' },
    { q: 'After the handshake, how is the data actually encrypted?', options: ['With the certificate\'s private key for every byte', 'With a fast symmetric session key both sides agreed on', 'It is not encrypted, only signed'], answer: 1, why: 'Asymmetric cryptography (certificates, key exchange) sets up a shared secret; fast symmetric encryption then protects the traffic.' },
  ],
  interview: [
    { q: 'Explain how HTTPS works.', a: 'The client and server do a **TLS handshake**: the server presents its certificate chain, the client verifies it (trusted CA, valid dates, matching name), then they use asymmetric cryptography to agree on a shared **session key**. Application data is then encrypted with that symmetric key, which protects confidentiality and integrity, and the certificate proves the server\'s identity.' },
    { q: 'Where would you terminate TLS in a large system?', a: 'Commonly at the **load balancer or reverse proxy** at the edge: it holds the certificates and handles the handshake, leaving app servers to deal with plain HTTP inside a private network. For sensitive systems also encrypt internal traffic (mutual TLS between services).' },
    { q: 'What happens when a certificate expires?', a: 'Browsers show a full-page warning and many clients refuse to connect, so the site is effectively down. Use automated renewal (for example Let\'s Encrypt with certbot) and monitoring that alerts well before the expiry date.' },
  ],
  mistakes: ['Forgetting to send the intermediate certificates.', 'Letting a certificate expire because renewal was manual.', 'Using a certificate whose name does not match the domain (or forgetting `www`).', 'Treating the padlock as proof that a website is honest.'],
  recap: 'TLS encrypts traffic and a verified chain of certificates, from the site up to a trusted root, proves who you are talking to.',
}
