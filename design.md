# Frost UI — **Edit‑Only** Migration Guide (Laravel + React + shadcn)

> Tujuan: Mengubah seluruh tampilan UI/UX default menjadi **tema Sejuk/Dingin (Frost)** **tanpa menambah file baru**. Semua langkah adalah **EDIT** pada file yang sudah ada.

Repo target: Laravel + Vite + TypeScript + Tailwind + shadcn/ui (Radix).
Direktori acuan: `resources/css`, `resources/js/components/ui`, `resources/js/layouts`, `resources/js/pages`, dsb.

---

## 0) Prinsip & Ruang Lingkup

* **Tanpa file baru**: hanya mengedit konfigurasi, CSS global, dan class komponen.
* **Global theming lewat token** (Tailwind extend) + **skin shadcn** (button/card/input/dll) + **layout wrapper**.
* **Tidak mengubah logika data**; fokus tampilan.
* **Dark mode didukung** jika app sudah menambahkan class `.dark` pada `<html>`.

Checklist hasil akhir:

* Card kaca (glass/blur), tombol biru `glacier`, latar `snow` gradasi.
* Input & kontrol membulat (`rounded-xl`), fokus ring biru.
* Halaman survey 1‑pertanyaan‑per‑kartu terasa sejuk & ringan.

---

## 1) Tailwind Tokens — **edit saja**

**File**: `tailwind.config.ts` **atau** `tailwind.config.js`
Tambahkan token warna, radius, shadow, dan easing.

```diff
*** a/tailwind.config.ts
--- b/tailwind.config.ts
@@
 export default {
   content: [
     "./resources/**/*.{blade.php,ts,tsx,js,jsx}",
   ],
-  theme: { extend: {} },
+  theme: {
+    extend: {
+      colors: {
+        glacier: { DEFAULT: '#3BA3F4', 700: '#1D7FD1' },
+        frost:   { DEFAULT: '#5EEAD4' },
+        snow:    '#F8FAFC',
+        slate:   { 700: '#334155' }
+      },
+      borderRadius: { xl: '1.25rem' },          // 20px
+      boxShadow:    { frost: '0 10px 30px rgba(59,163,244,0.15)' },
+      transitionTimingFunction: { frost: 'cubic-bezier(.2,.8,.2,1)' }
+    }
+  },
   plugins: [],
 }
```

> **Catatan:** Tidak menambah plugin. Pastikan `content` mencakup direktori `resources/**` Anda.

---

## 2) CSS Global — **edit saja**

**File**: `resources/css/app.css`

Tambahkan util glass, latar `snow`, dan fokus ring tanpa membuat file baru.

```diff
*** a/resources/css/app.css
--- b/resources/css/app.css
@@
 @tailwind base;
 @tailwind components;
 @tailwind utilities;
+
+/* ========== Frost theme helpers (edit-only) ========== */
+html, body { min-height: 100%; }
+body { background: linear-gradient(#ffffff, #F8FAFC); }
+
+/* Glass card util */
+.frost-card{
+  background: rgba(255,255,255,0.85);
+  -webkit-backdrop-filter: blur(12px);
+  backdrop-filter: blur(12px);
+  border: 1px solid rgba(255,255,255,0.6);
+  box-shadow: 0 10px 30px rgba(59,163,244,0.15);
+  border-radius: 1.25rem; /* 20px */
+}
+.focus-ring:focus{ outline:2px solid #3BA3F4; outline-offset:2px; }
+
+/* Dark mode */
+.dark .frost-card{ background: rgba(15,23,42,0.65); border-color: rgba(148,163,184,0.2); }
+.dark .focus-ring:focus{ outline-color:#3BA3F4; }
```

> **Opsional** (tanpa file baru): Anda boleh mengganti body bg ke `bg-snow` di layout ketimbang gradient ini. Keduanya konsisten.

---

## 3) Skin Komponen shadcn/UI — **edit class dasar**

Target utama: `resources/js/components/ui`
Tujuan: ubah gaya default ke Frost secara global.

### 3.1 Button

**File**: `resources/js/components/ui/button.tsx`

```diff
*** a/resources/js/components/ui/button.tsx
--- b/resources/js/components/ui/button.tsx
@@
-const buttonVariants = cva(
-  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
+const buttonVariants = cva(
+  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors ease-frost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glacier disabled:pointer-events-none disabled:opacity-50 shadow-frost",
   {
     variants: {
       variant: {
-        default: "bg-primary text-primary-foreground hover:bg-primary/90",
+        default: "bg-glacier text-white hover:bg-glacier-700",
-        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
+        outline: "border border-glacier text-glacier hover:bg-glacier/10",
-        ghost: "hover:bg-accent hover:text-accent-foreground",
+        ghost: "hover:bg-slate-100",
       },
       size: {
-        default: "h-10 px-4 py-2",
+        default: "h-11 px-5 py-2.5",
-        lg: "h-11 rounded-md px-8",
+        lg: "h-12 rounded-xl px-8",
       },
     },
     defaultVariants: { variant: "default", size: "default" },
   }
 )
```

### 3.2 Card

**File**: `resources/js/components/ui/card.tsx`

```diff
*** a/resources/js/components/ui/card.tsx
--- b/resources/js/components/ui/card.tsx
@@
-export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
-  return <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
+export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
+  return <div className={cn("frost-card p-5 md:p-6", className)} {...props} />
 }
```

### 3.3 Input

**File**: `resources/js/components/ui/input.tsx`

```diff
*** a/resources/js/components/ui/input.tsx
--- b/resources/js/components/ui/input.tsx
@@
-export const inputClass =
-  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none"
+export const inputClass =
+  "flex h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm focus-ring disabled:opacity-50 disabled:pointer-events-none"
```

*(Jika file menggunakan pattern function/classNames berbeda, sesuaikan nilai class string-nya.)*

### 3.4 Select

**File**: `resources/js/components/ui/select.tsx`

```diff
*** a/resources/js/components/ui/select.tsx
--- b/resources/js/components/ui/select.tsx
@@
-  className="inline-flex h-10 items-center rounded-md border bg-background px-3 text-sm"
+  className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white/90 px-3 text-sm focus-ring"
```

### 3.5 Textarea

**File**: `resources/js/components/ui/textarea.tsx`

```diff
*** a/resources/js/components/ui/textarea.tsx
--- b/resources/js/components/ui/textarea.tsx
@@
-  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
+  className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm focus-ring"
```

### 3.6 Checkbox & Radio

**File**: `resources/js/components/ui/checkbox.tsx`

```diff
-  className="peer h-4 w-4 shrink-0 rounded-sm border border-primary"
+  className="peer h-5 w-5 shrink-0 rounded-md border border-slate-300 data-[state=checked]:bg-glacier data-[state=checked]:text-white"
```

**File**: `resources/js/components/ui/radio-group.tsx`

```diff
-  className="h-4 w-4 rounded-full border"
+  className="h-5 w-5 rounded-full border border-slate-300 data-[state=checked]:border-glacier data-[state=checked]:bg-glacier"
```

### 3.7 Dialog / Sheet / Dropdown / Tooltip

* **dialog.tsx** (content/panel): gunakan `rounded-xl`, `border-slate-200`, `bg-white/90`, `backdrop: bg-black/40`.
* **sheet.tsx**: panel `rounded-l-2xl` (atau `rounded-r-2xl` sesuai sisi), `bg-white/90`, border lembut.
* **dropdown-menu.tsx**: menu `rounded-xl border-slate-200 bg-white/95 shadow-frost`.
* **tooltip.tsx**: `bg-slate-800 text-white rounded-md` (default OK); aksen biru pada panah/border opsional.

> Implementasi di file masing‑masing: ubah string class pada container `Content`, `Trigger`, `Item` sesuai pattern komponen shadcn Anda.

### 3.8 Navigation / Sidebar / Header

* **navigation-menu.tsx**: bar latar `bg-white/70 backdrop-blur` + `border-b border-white/40`.
* **sidebar.tsx**: container `bg-white/70 backdrop-blur` + `border-r border-white/50`.
* **app-header.tsx**: gunakan `frost-card` tipis atau `bg-white/70` + `backdrop-blur` + `rounded-xl` bila header bertumpuk di konten.

---

## 4) Layout Wrapper — **edit halaman/layout**

**File**: `resources/js/layouts/app-layout.tsx` (atau `AdminLayout.tsx`, `app/app-header-layout.tsx`, dsb.)

Tambahkan latar dan spacing lembut.

```diff
*** a/resources/js/layouts/app-layout.tsx
--- b/resources/js/layouts/app-layout.tsx
@@
-<div className="min-h-screen">
+<div className="min-h-screen bg-snow">
@@
-<main className="">
+<main className="p-4 md:p-6 space-y-6">
```

Jika ada grid shell/sidebar:

```diff
-<aside className="...">
+<aside className="bg-white/70 backdrop-blur border-r border-white/50">

-<header className="...">
+<header className="bg-white/70 backdrop-blur border-b border-white/40">
```

---

## 5) Halaman Survey yang **sudah ada** — **edit tampilan**

Tanpa menambah komponen baru, kita gunakan util & kelas yang sudah disuntikkan.

### 5.1 Contoh: `resources/js/pages/Run/SurveyRun.tsx`

```diff
*** a/resources/js/pages/Run/SurveyRun.tsx
--- b/resources/js/pages/Run/SurveyRun.tsx
@@
-<section className="rounded-lg border p-4">
+<section className="frost-card">
   <h1 className="text-2xl md:text-3xl font-semibold text-slate-700">Seberapa puas Anda…</h1>
-  <div className="mt-4 grid grid-cols-5 gap-2">
+  <div className="mt-6 grid grid-cols-5 gap-3">
-    <button className="rounded-md border px-3 py-2">1</button>
+    <button className="rounded-xl border px-4 py-3 bg-white hover:bg-slate-50 border-slate-200">1</button>
     {/* … tombol skala lain serupa; saat active pakai: bg-glacier text-white border-transparent */}
   </div>
-  <div className="mt-4 flex justify-end"><Button>Berikutnya</Button></div>
+  <div className="mt-8 flex justify-between">
+    <Button variant="ghost">Kembali</Button>
+    <Button>Berikutnya</Button>
+  </div>
 </section>
```

### 5.2 Progress Bar (inline, tanpa komponen baru)

```tsx
<div className="h-2 bg-slate-200 rounded-full overflow-hidden">
  <div className="h-2 bg-glacier rounded-full" style={{ width: `${pct}%` }} />
</div>
<div className="text-xs text-slate-500 mt-2">{pct}%</div>
```

> `pct` ambil dari state langkah yang sudah ada.

### 5.3 Textarea Uraian

```diff
-<textarea className="rounded-md border border-input ..." />
+<textarea className="w-full rounded-xl border border-slate-200 bg-white/90 p-4 focus-ring" />
```

---

## 6) Tabel & Data (Index/Responses/Dashboard) — **edit styling**

* **Table wrapper**: bungkus dengan `frost-card` agar konsisten.
* **Header**: `bg-white/60 backdrop-blur` atau biarkan transparan.
* **Row**: tambahkan zebra ringan opsional `odd:bg-white/50`.

Contoh di halaman daftar survei (`resources/js/pages/Surveys/Index.tsx`):

```diff
-<div className="rounded-lg border p-4">
+<div className="frost-card">
   <table className="min-w-full text-sm">
     <thead>
-      <tr className="bg-muted/50">
+      <tr className="">
         <th className="p-2 text-left text-slate-500">Nama</th>
         <th className="p-2 text-left text-slate-500">Status</th>
         <th className="p-2 text-left text-slate-500">Aksi</th>
       </tr>
     </thead>
-    <tbody className="divide-y">
+    <tbody className="divide-y divide-slate-100">
       {/* rows */}
     </tbody>
   </table>
 </div>
```

---

## 7) Komponen Navigasi (Breadcrumb, Sidebar, Menu) — **edit class**

* **breadcrumb.tsx**: link aktif `text-slate-700`, item non-aktif `text-slate-500`, separator `text-slate-400`.
* **sidebar item**: `hover:bg-glacier/10 text-slate-700 data-[active=true]:bg-glacier data-[active=true]:text-white rounded-xl`.
* **navigation-menu**: container `bg-white/70 backdrop-blur border-b border-white/40`.

Potongan contoh item sidebar:

```diff
-<a className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted">
+<a className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-glacier/10 data-[active=true]:bg-glacier data-[active=true]:text-white">
```

---

## 8) Dialog/Modal & Toast — **edit class**

**dialog.tsx** (Content):

```diff
-<Content className="rounded-lg border bg-background p-6 shadow-sm">
+<Content className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur p-6 shadow-frost">
```

**toast.tsx**: gunakan `rounded-xl`, `shadow-frost`, ikon biru `glacier` untuk success/info.

---

## 9) Dark Mode — **tanpa file baru**

* Gunakan patch CSS global (Bagian 2).
* Pastikan toggle mode Anda menambah `.dark` pada `<html>`.

Penyesuaian opsional di komponen (pattern umum):

```diff
-bg-white/90
+bg-white/90 dark:bg-slate-900/70

-border-slate-200
+border-slate-200 dark:border-slate-700/60

-text-slate-700
+text-slate-700 dark:text-slate-200
```

---

## 10) Aksesibilitas & Interaksi — **edit minor**

* Tambahkan `.focus-ring` ke elemen interaktif utama (Button/Input/Select/Link penting).
* Pastikan ukuran kontrol minimal `h-11` dan `rounded-xl`.
* Shortcut: angka `1..5` untuk skala (jika sudah ada, pertahankan).

---

## 11) Cheatsheet **Search & Replace** (aman)

> Lakukan bertahap dan review visual.

* `rounded-md` → `rounded-xl`
* `h-10` → `h-11`
* `bg-background` → `bg-white/90`
* `border border-input` → `border border-slate-200`
* `shadow-sm|shadow` pada card → ganti wrapper jadi `frost-card` (hapus shadow lama)
* header/sidebar container → tambahkan `bg-white/70 backdrop-blur border-white/40|50`

---

## 12) QA — Pemeriksaan Akhir

* [ ] Card tampak kaca, tombol biru `glacier`.
* [ ] Latar global putih → `snow`, nyaman dilihat.
* [ ] Input/select/textarea membulat, fokus ring jelas.
* [ ] Halaman survey: kartu pertanyaan + progress bar tampil konsisten.
* [ ] Tabel & navigasi sejalan dengan tema.
* [ ] Dark mode (bila aktif) tampak proporsional.

---

## 13) Rollback Sederhana

Semua perubahan bersifat kosmetik kelas Tailwind. Untuk rollback:

1. Revert commit yang menyentuh `tailwind.config.*`, `app.css`, dan `components/ui/*`.
2. Hapus class `frost-card`, `bg-snow`, `glacier` di komponen.

---

### Selesai

Dengan langkah **edit‑only** di atas, seluruh aplikasi akan bertransformasi ke **Frost** tanpa menambah file baru. Jika ada nama komponen yang berbeda di repo Anda, terapkan pola kelas yang sama pada file tersebut agar konsisten.
